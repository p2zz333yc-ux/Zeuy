"""Modèle de risque : corrélations, plafonds, cible de volatilité, coupe-circuit.

C'est ici que se joue l'essentiel. Un bon classement de titres mal
dimensionné produit un portefeuille qui explose au premier choc ; un
classement médiocre correctement dimensionné survit. Le contrôle du risque
est la seule partie de la chaîne dont l'effet est prévisible.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from ..analysis.themes import macro_bucket
from ..common import clamp
from ..data.models import Universe


@dataclass(frozen=True)
class RiskConfig:
    """Contraintes du portefeuille cible."""

    target_vol: float = 0.12
    """Volatilité annualisée visée (12 %, environ 3/4 de celle du S&P 500)."""

    max_position: float = 0.10
    max_sector: float = 0.30
    max_bucket: float = 0.40
    max_gross_exposure: float = 1.00
    """1,00 = aucun effet de levier. Le levier transforme une erreur en ruine."""

    min_position: float = 0.01
    """En dessous, la ligne ne change rien au résultat mais coûte des frais."""

    crowding_haircut: float = 0.30
    """Réduction du plafond appliquée aux titres détenus par presque tout le monde."""

    intra_sector_corr: float = 0.65
    intra_bucket_corr: float = 0.50
    inter_corr: float = 0.30
    """Corrélations par défaut, utilisées faute de séries de prix."""

    cash_rate: float = 0.04
    soft_drawdown: float = 0.10
    hard_drawdown: float = 0.20
    min_exposure_in_drawdown: float = 0.40

    def __post_init__(self) -> None:
        if not 0 < self.max_position <= 1:
            raise ValueError("max_position doit être dans ]0, 1]")
        if self.soft_drawdown >= self.hard_drawdown:
            raise ValueError("soft_drawdown doit être inférieur à hard_drawdown")


def correlation(universe: Universe, a: str, b: str, config: RiskConfig) -> float:
    """Corrélation supposée entre deux titres.

    Modèle volontairement grossier et transparent : même titre = 1, même
    secteur = forte, même macro-pari = moyenne, sinon faible. Il surestime
    rarement la diversification, ce qui est le bon sens de l'erreur.
    """
    if a == b:
        return 1.0
    asset_a, asset_b = universe.asset(a), universe.asset(b)
    if asset_a.sector == asset_b.sector:
        return config.intra_sector_corr
    if macro_bucket(asset_a.theme) == macro_bucket(asset_b.theme):
        return config.intra_bucket_corr
    return config.inter_corr


def portfolio_vol(
    universe: Universe, weights: dict[str, float], config: RiskConfig
) -> float:
    """Volatilité annualisée du portefeuille (les poids sont des fractions)."""
    tickers = list(weights)
    variance = 0.0
    for i, ti in enumerate(tickers):
        wi, vi = weights[ti], universe.asset(ti).vol
        for tj in tickers[i:]:
            wj, vj = weights[tj], universe.asset(tj).vol
            term = wi * wj * vi * vj * correlation(universe, ti, tj, config)
            variance += term if ti == tj else 2 * term
    return math.sqrt(max(variance, 0.0))


def diversification_ratio(universe: Universe, weights: dict[str, float], config: RiskConfig) -> float:
    """Volatilité moyenne pondérée ÷ volatilité du portefeuille.

    1,0 = aucune diversification (tout bouge ensemble) ; 2,0 = la
    diversification divise le risque par deux.
    """
    weighted = sum(w * universe.asset(t).vol for t, w in weights.items())
    vol = portfolio_vol(universe, weights, config)
    return weighted / vol if vol > 0 else 0.0


def apply_caps(
    universe: Universe,
    weights: dict[str, float],
    config: RiskConfig,
    *,
    position_caps: dict[str, float] | None = None,
    rounds: int = 25,
) -> tuple[dict[str, float], list[str]]:
    """Applique les plafonds ligne / secteur / macro-pari.

    Le capital écrêté est redistribué aux lignes non saturées ; ce qui ne
    peut pas l'être reste en liquidités plutôt que d'être forcé dans une
    position qui viole une contrainte.
    """
    warnings: list[str] = []
    caps = position_caps or {}
    total = sum(weights.values())
    if total <= 0:
        return {}, ["portefeuille vide"]
    result = {t: w / total for t, w in weights.items()}

    def group_keys(ticker: str) -> tuple[str, str]:
        asset = universe.asset(ticker)
        return asset.sector, macro_bucket(asset.theme)

    def group_totals(index: int) -> dict[str, float]:
        totals: dict[str, float] = {}
        for ticker, weight in result.items():
            key = group_keys(ticker)[index]
            totals[key] = totals.get(key, 0.0) + weight
        return totals

    def enforce() -> None:
        """Ramène chaque ligne, secteur et macro-pari sous son plafond."""
        for ticker, weight in list(result.items()):
            cap = caps.get(ticker, config.max_position)
            if weight > cap + 1e-12:
                result[ticker] = cap
        for index, (cap, label) in enumerate(
            ((config.max_sector, "secteur"), (config.max_bucket, "macro-pari"))
        ):
            for name, exposure in group_totals(index).items():
                if exposure > cap + 1e-12:
                    scale = cap / exposure
                    for ticker in result:
                        if group_keys(ticker)[index] == name:
                            result[ticker] *= scale
                    message = f"{label} « {name} » ramené au plafond de {cap:.0%}"
                    if message not in warnings:
                        warnings.append(message)

    for _ in range(rounds):
        enforce()
        deficit = 1.0 - sum(result.values())
        if deficit <= 1e-6:
            break

        # Redistribution *au prorata des poids existants* (et non de la place
        # disponible) : sinon les lignes faibles rattraperaient les fortes et
        # le classement serait effacé par la contrainte. La marge de manœuvre
        # tient compte des plafonds de groupe, sans quoi l'algorithme oscille
        # entre écrêtage et réinvestissement sans jamais converger.
        sectors, buckets = group_totals(0), group_totals(1)
        room: dict[str, float] = {}
        for ticker, weight in result.items():
            sector, bucket = group_keys(ticker)
            room[ticker] = max(
                0.0,
                min(
                    caps.get(ticker, config.max_position) - weight,
                    config.max_sector - sectors[sector],
                    config.max_bucket - buckets[bucket],
                ),
            )
        open_lines = {t: w for t, w in result.items() if room[t] > 1e-12}
        base = sum(open_lines.values())
        if base <= 1e-9:
            break
        for ticker, weight in open_lines.items():
            result[ticker] += min(deficit * weight / base, room[ticker])

    # Passe finale : les contraintes de risque priment toujours sur l'objectif
    # d'être pleinement investi. Ce qui ne rentre pas reste en liquidités.
    enforce()
    result = {t: w for t, w in result.items() if w >= config.min_position}
    invested = sum(result.values())
    if invested < 0.999:
        warnings.append(
            f"{1 - invested:.1%} du portefeuille laissé en liquidités : les plafonds de "
            "risque ne permettent pas d'investir davantage sans concentrer."
        )
    return result, warnings


def crowding_discount(config: RiskConfig, crowding: dict[str, float]) -> dict[str, float]:
    """Coefficient de réduction du poids pour les titres très consensuels.

    Un titre détenu par tout le monde est aussi celui que tout le monde
    vendra le même jour. On garde l'idée, on réduit la dose — sans jamais
    inverser le classement, ce qui serait absurde : la réduction est un
    facteur multiplicatif, pas un plafond spécifique.
    """
    return {
        ticker: 1.0 - config.crowding_haircut * clamp(value, 0.0, 1.0)
        for ticker, value in crowding.items()
    }


def volatility_scaling(vol: float, config: RiskConfig) -> float:
    """Facteur d'exposition pour atteindre la volatilité cible, sans levier."""
    if vol <= 0:
        return 0.0
    return min(config.target_vol / vol, config.max_gross_exposure)


def drawdown_throttle(drawdown: float, config: RiskConfig) -> float:
    """Réduction progressive de l'exposition en fonction de la perte courante.

    ``drawdown`` est positif (0,15 = -15 % depuis le sommet). Le coupe-circuit
    est progressif : une coupure brutale garantit de vendre au plus bas.
    """
    dd = abs(drawdown)
    if dd <= config.soft_drawdown:
        return 1.0
    if dd >= config.hard_drawdown:
        return config.min_exposure_in_drawdown
    span = config.hard_drawdown - config.soft_drawdown
    progress = (dd - config.soft_drawdown) / span
    return 1.0 - progress * (1.0 - config.min_exposure_in_drawdown)
