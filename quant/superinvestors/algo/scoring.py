"""Le moteur de score : transformer des dépôts 13F en classement de titres.

Cinq facteurs, tous calculables à partir de données publiques, tous
justifiés par ce que la recherche a réellement montré :

1. **Conviction** — le poids qu'un gérant accorde à une idée est son seul
   vote sincère. Antón, Cohen & Polk (*Best Ideas*) montrent que les
   premières lignes d'un gérant surperforment nettement le reste de son
   portefeuille.
2. **Consensus** — plusieurs gérants indépendants sur la même idée réduit
   la probabilité d'erreur idiosyncrasique. Angelini, Iqbal & Jivraj
   (*Systematic 13F Hedge Fund Alpha*) combinent conviction et consensus
   pour battre le S&P 500 de ≈3,8 % par an entre 2004 et 2019.
3. **Diversité des styles** — un titre détenu par un value, un macro et un
   activiste résiste à plus de scénarios qu'un titre détenu par trois
   clones. C'est un test de robustesse, pas de popularité.
4. **Flux** — ce que le gérant vient de *faire* (ouvrir, renforcer,
   alléger) est plus informatif que ce qu'il détient par inertie.
5. **Persistance** — une position conservée sans modification depuis
   plusieurs trimestres traduit une thèse de long terme, la seule qui
   survive au décalage de publication de 45 jours.

Chaque facteur est centré-réduit sur l'univers du moment, puis combiné.
La décomposition est conservée : un score sans explication n'est pas
exploitable.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from ..analysis.themes import macro_bucket
from ..common import latest_quarter, quarter_lag, zscore_map
from ..data.models import Action, Universe

# Familles de titres que l'on refuse de copier : véhicules du gérant
# lui-même et ETF indiciels. Les répliquer n'apporte aucune information —
# c'est du bêta déguisé en conviction.
EXCLUDED_BUCKETS = frozenset({"véhicules et indices"})


@dataclass(frozen=True)
class ScoringConfig:
    """Paramètres du moteur. Tous exposés, aucun magique."""

    w_conviction: float = 0.35
    w_consensus: float = 0.25
    w_style_diversity: float = 0.15
    w_flow: float = 0.20
    w_persistence: float = 0.05

    manager_weight_cap: float = 15.0
    """Plafond du poids d'un gérant pris en compte (en %).

    Sans plafond, une ligne à 33 % chez TCI écraserait tout le classement :
    on mesure une conviction, pas une taille de bilan.
    """

    staleness_decay: float = 0.6
    """Décote appliquée par trimestre de retard d'un dépôt (0,6 par trimestre)."""

    exit_nominal_weight: float = 2.0
    """Poids supposé d'une ligne soldée, dont le 13F ne dit plus rien."""

    min_holders: int = 2
    """Nombre minimal de gérants requis pour retenir un titre…"""

    solo_conviction_threshold: float = 10.0
    """…sauf si un seul gérant y consacre au moins ce pourcentage."""

    estimated_confidence_discount: float = 0.85
    """Pondération réduite des lignes dont le poids a été reconstitué."""

    def total_weight(self) -> float:
        return (
            self.w_conviction + self.w_consensus + self.w_style_diversity
            + self.w_flow + self.w_persistence
        )


@dataclass(frozen=True)
class HolderView:
    """Ce qu'un gérant fait sur un titre, du point de vue du score."""

    manager_key: str
    manager_name: str
    style: str
    quarter: str
    weight_pct: float
    action: Action
    trust: float  # qualité du gérant × fraîcheur × fiabilité de la donnée


@dataclass
class ScoredAsset:
    """Résultat complet pour un titre : score, facteurs, détenteurs."""

    ticker: str
    name: str
    sector: str
    macro_bucket: str
    score: float = 0.0
    factors: dict[str, float] = field(default_factory=dict)        # valeurs brutes
    contributions: dict[str, float] = field(default_factory=dict)  # points de score
    holders: tuple[HolderView, ...] = ()
    crowding: float = 0.0        # part des gérants éligibles détenant le titre
    eligible: bool = True
    rejection: str | None = None

    @property
    def holder_count(self) -> int:
        return len(self.holders)

    @property
    def max_weight(self) -> float:
        return max((h.weight_pct for h in self.holders), default=0.0)

    def top_reason(self) -> str:
        """Le facteur qui contribue le plus au score — la raison courte."""
        if not self.contributions:
            return "aucun facteur"
        label, value = max(self.contributions.items(), key=lambda kv: kv[1])
        return f"{label} ({value:+.2f})"


def _trust(quality: float, lag: int, decay: float, estimated: bool, discount: float) -> float:
    trust = quality * (decay ** max(lag, 0))
    return trust * (discount if estimated else 1.0)


def score_universe(
    universe: Universe,
    config: ScoringConfig | None = None,
    *,
    reference_quarter: str | None = None,
) -> list[ScoredAsset]:
    """Classe tous les titres de l'univers, du plus au moins convaincant.

    Les titres inéligibles (trop peu de détenteurs, ETF, véhicule du gérant)
    sont conservés dans la liste avec ``eligible=False`` et le motif : une
    exclusion silencieuse est une erreur qu'on ne verra jamais.
    """
    config = config or ScoringConfig()
    portfolios = universe.signal_portfolios()
    if not portfolios:
        return []

    reference = reference_quarter or latest_quarter(p.quarter for p in portfolios)
    eligible_managers = {p.manager_key for p in portfolios}

    holders: dict[str, list[HolderView]] = {}
    for portfolio in portfolios:
        manager = universe.manager_of(portfolio)
        lag = quarter_lag(reference, portfolio.quarter)
        for holding in portfolio.holdings:
            trust = _trust(
                manager.quality,
                lag,
                config.staleness_decay,
                holding.confidence.value == "estimated",
                config.estimated_confidence_discount,
            )
            holders.setdefault(holding.ticker, []).append(
                HolderView(
                    manager_key=manager.key,
                    manager_name=manager.name,
                    style=manager.style.value,
                    quarter=portfolio.quarter,
                    weight_pct=holding.weight_pct,
                    action=holding.action,
                    trust=trust,
                )
            )

    # --- facteurs bruts ----------------------------------------------------
    conviction: dict[str, float] = {}
    consensus: dict[str, float] = {}
    style_diversity: dict[str, float] = {}
    flow: dict[str, float] = {}
    persistence: dict[str, float] = {}

    for ticker, views in holders.items():
        active = [v for v in views if v.action is not Action.EXIT]
        trust_active = sum(v.trust for v in active)

        if trust_active > 0:
            conviction[ticker] = sum(
                v.trust * min(v.weight_pct, config.manager_weight_cap) for v in active
            ) / trust_active
        else:
            conviction[ticker] = 0.0

        consensus[ticker] = trust_active
        style_diversity[ticker] = float(len({v.style for v in active}))

        flow[ticker] = sum(
            v.trust
            * v.action.flow_score
            * min(
                v.weight_pct if v.action is not Action.EXIT else config.exit_nominal_weight,
                config.manager_weight_cap,
            )
            / config.manager_weight_cap
            for v in views
        )

        persistence[ticker] = (
            sum(v.trust for v in active if v.action is Action.HOLD) / trust_active
            if trust_active > 0
            else 0.0
        )

    factor_z = {
        "conviction": zscore_map(conviction),
        "consensus": zscore_map(consensus),
        "diversité_styles": zscore_map(style_diversity),
        "flux": zscore_map(flow),
        "persistance": zscore_map(persistence),
    }
    weights = {
        "conviction": config.w_conviction,
        "consensus": config.w_consensus,
        "diversité_styles": config.w_style_diversity,
        "flux": config.w_flow,
        "persistance": config.w_persistence,
    }

    results: list[ScoredAsset] = []
    for ticker, views in holders.items():
        asset = universe.asset(ticker)
        active = [v for v in views if v.action is not Action.EXIT]
        bucket = macro_bucket(asset.theme)

        contributions = {name: weights[name] * z[ticker] for name, z in factor_z.items()}
        scored = ScoredAsset(
            ticker=ticker,
            name=asset.name,
            sector=asset.sector,
            macro_bucket=bucket,
            score=sum(contributions.values()),
            factors={
                "conviction": conviction[ticker],
                "consensus": consensus[ticker],
                "diversité_styles": style_diversity[ticker],
                "flux": flow[ticker],
                "persistance": persistence[ticker],
            },
            contributions=contributions,
            holders=tuple(sorted(active, key=lambda v: -v.weight_pct)),
            crowding=len({v.manager_key for v in active}) / max(len(eligible_managers), 1),
        )

        if bucket in EXCLUDED_BUCKETS:
            scored.eligible = False
            scored.rejection = "véhicule du gérant ou ETF indiciel : aucune information à copier"
        elif not active:
            scored.eligible = False
            scored.rejection = "position soldée par tous les détenteurs"
        elif (
            len(active) < config.min_holders
            and scored.max_weight < config.solo_conviction_threshold
        ):
            scored.eligible = False
            scored.rejection = (
                f"un seul gérant et conviction < {config.solo_conviction_threshold:.0f} % "
                "du portefeuille"
            )

        results.append(scored)

    results.sort(key=lambda s: (-int(s.eligible), -s.score))
    return results


def eligible_assets(scored: list[ScoredAsset]) -> list[ScoredAsset]:
    return [s for s in scored if s.eligible]
