"""Deux façons d'évaluer la stratégie, et aucune ne garantit quoi que ce soit.

* :func:`simulate_forward` — distribution des résultats possibles du
  portefeuille cible sur un horizon donné, sous un modèle de marché
  explicite. Répond à « quelle est la probabilité de gagner ? », qui est la
  seule version honnête de la question « comment garantir un gain ? ».
* :func:`run_backtest` — moteur historique classique : rebalancement à la
  date de publication réelle (fin de trimestre + 45 jours), frais de
  transaction, coupe-circuit sur perte. Il exige *vos* données de prix et
  *vos* dépôts historiques ; il ne fabrique rien.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta

from ..common import FILING_LAG_DAYS, quarter_end, quarter_index
from ..data.models import Universe
from .market_data import MarketModel, PriceHistory
from .metrics import (
    TRADING_DAYS,
    PerformanceStats,
    max_drawdown,
    percentile,
    summarize,
)
from .portfolio import TargetPortfolio
from .risk import RiskConfig, drawdown_throttle

# ---------------------------------------------------------------------------
# Simulation prospective
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class SimulationConfig:
    horizon_days: int = TRADING_DAYS
    paths: int = 1000
    cash_rate: float = 0.04


@dataclass
class SimulationResult:
    """Distribution des résultats simulés — pas une prévision."""

    horizon_days: int
    paths: int
    model: MarketModel
    returns: list[float]
    drawdowns: list[float]
    benchmark_returns: list[float]

    @property
    def median_return(self) -> float:
        return percentile(self.returns, 0.5)

    @property
    def prob_gain(self) -> float:
        return sum(1 for r in self.returns if r > 0) / len(self.returns)

    @property
    def prob_beat_benchmark(self) -> float:
        return sum(
            1 for r, b in zip(self.returns, self.benchmark_returns, strict=True) if r > b
        ) / len(self.returns)

    @property
    def expected_shortfall_5(self) -> float:
        """Perte moyenne dans les 5 % de scénarios les plus défavorables."""
        threshold = percentile(self.returns, 0.05)
        tail = [r for r in self.returns if r <= threshold]
        return sum(tail) / len(tail) if tail else 0.0

    def render(self) -> str:
        years = self.horizon_days / TRADING_DAYS
        return (
            f"  horizon            : {years:.1f} an(s), {self.paths} trajectoires\n"
            f"  hypothèse d'alpha  : {self.model.alpha_annual:+.2%} par an\n"
            f"  rendement médian   : {self.median_return:+.1%}\n"
            f"  intervalle 5-95 %  : {percentile(self.returns, 0.05):+.1%} "
            f"à {percentile(self.returns, 0.95):+.1%}\n"
            f"  probabilité de gain: {self.prob_gain:.1%}\n"
            f"  bat l'indice       : {self.prob_beat_benchmark:.1%} des trajectoires\n"
            f"  perte max médiane  : -{percentile(self.drawdowns, 0.5):.1%}\n"
            f"  perte max au p95   : -{percentile(self.drawdowns, 0.95):.1%}\n"
            f"  pertes des 5 % pires scénarios : {self.expected_shortfall_5:+.1%}"
        )


def simulate_forward(
    universe: Universe,
    portfolio: TargetPortfolio,
    *,
    model: MarketModel | None = None,
    config: SimulationConfig | None = None,
) -> SimulationResult:
    """Projette le portefeuille cible sur des milliers de marchés possibles."""
    model = model or MarketModel()
    config = config or SimulationConfig()

    paths = model.simulate_portfolio(
        universe,
        portfolio.weights(),
        days=config.horizon_days,
        paths=config.paths,
        cash_rate=config.cash_rate,
        cash_weight=portfolio.cash_weight,
    )
    benchmark = model.simulate_benchmark(days=config.horizon_days, paths=config.paths)

    return SimulationResult(
        horizon_days=config.horizon_days,
        paths=config.paths,
        model=model,
        returns=[p[-1] / p[0] - 1.0 for p in paths],
        drawdowns=[max_drawdown(p) for p in paths],
        benchmark_returns=[b[-1] / b[0] - 1.0 for b in benchmark],
    )


# ---------------------------------------------------------------------------
# Backtest historique
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class BacktestConfig:
    cost_bps: float = 10.0
    """Frais aller-retour appliqués à la rotation, en points de base."""

    risk_free: float = 0.04
    use_drawdown_throttle: bool = True
    benchmark: str = "SPY"
    periods_per_year: int = TRADING_DAYS
    """252 pour un historique quotidien, 12 pour un historique mensuel."""


@dataclass
class BacktestResult:
    dates: list[str]
    path: list[float]
    benchmark_path: list[float]
    stats: PerformanceStats
    benchmark_stats: PerformanceStats
    rebalances: int
    total_turnover: float
    total_costs: float
    warnings: tuple[str, ...] = ()
    skipped: tuple[str, ...] = field(default_factory=tuple)

    @property
    def excess_cagr(self) -> float:
        return self.stats.cagr - self.benchmark_stats.cagr

    def render(self) -> str:
        lines = [
            f"  période            : {self.dates[0]} → {self.dates[-1]}",
            f"  rebalancements     : {self.rebalances} "
            f"(rotation cumulée {self.total_turnover:.0%}, frais {self.total_costs:.2%})",
            "",
            "  STRATÉGIE",
            self.stats.render(),
            "",
            "  INDICE DE RÉFÉRENCE",
            self.benchmark_stats.render(),
            "",
            f"  écart de TCAC      : {self.excess_cagr:+.2%} par an",
        ]
        if self.skipped:
            lines.append(f"  titres sans historique : {', '.join(self.skipped)}")
        for warning in self.warnings:
            lines.append(f"  ⚠ {warning}")
        return "\n".join(lines)


def rebalance_date(quarter: str, *, lag_days: int = FILING_LAG_DAYS) -> str:
    """Date à laquelle l'information devient publique : fin de trimestre + 45 jours.

    Utiliser la fin de trimestre comme date d'achat serait la faute
    classique du backtest de 13F : elle donne accès à une information que
    personne ne détenait à ce moment-là.
    """
    year, month, day = quarter_end(quarter)
    return (date(year, month, day) + timedelta(days=lag_days)).isoformat()


def run_backtest(
    universe: Universe,
    targets: dict[str, dict[str, float]],
    history: PriceHistory,
    *,
    config: BacktestConfig | None = None,
    risk_config: RiskConfig | None = None,
) -> BacktestResult:
    """Rejoue la stratégie sur un historique de prix réel.

    ``targets`` associe un trimestre (``"2026Q2"``) à des poids cibles. Le
    portefeuille correspondant n'est mis en place qu'à la date de
    publication du dépôt, jamais avant.
    """
    config = config or BacktestConfig()
    risk = risk_config or RiskConfig()

    if config.benchmark not in history.series:
        raise ValueError(f"l'indice {config.benchmark} est absent de l'historique de prix")
    if not targets:
        raise ValueError("aucun portefeuille cible fourni")

    warnings: list[str] = []
    skipped: set[str] = set()

    unknown = sorted(
        {t for target in targets.values() for t in target if t not in universe.assets}
    )
    if unknown:
        warnings.append(
            "titres absents de l'univers, donc sans caractéristiques de risque : "
            + ", ".join(unknown)
        )

    schedule = sorted(
        ((rebalance_date(q), q) for q in targets), key=lambda item: quarter_index(item[1])
    )

    start = history.index_of_date(schedule[0][0])
    if start < 0:
        raise ValueError(
            f"l'historique s'arrête avant la première date de rebalancement ({schedule[0][0]})"
        )

    dates = history.dates[start:]
    value, peak = 1.0, 1.0
    weights: dict[str, float] = {}
    cash = 1.0
    path = [value]
    total_turnover = total_costs = 0.0
    rebalances = 0
    pending = list(schedule)

    def install(target: dict[str, float], throttle: float) -> None:
        nonlocal weights, cash, total_turnover, total_costs, value, rebalances
        available = {t: w for t, w in target.items() if t in history.series}
        for missing in set(target) - set(available):
            skipped.add(missing)
        scaled = {t: w * throttle for t, w in available.items()}
        invested = sum(scaled.values())
        if invested > 1.0:
            scaled = {t: w / invested for t, w in scaled.items()}
            invested = 1.0
        turnover = sum(
            abs(scaled.get(t, 0.0) - weights.get(t, 0.0))
            for t in set(scaled) | set(weights)
        )
        cost = turnover * config.cost_bps / 10_000.0
        value *= 1.0 - cost
        total_turnover += turnover
        total_costs += cost
        weights, cash = scaled, 1.0 - invested
        rebalances += 1

    for i, current_date in enumerate(dates):
        while pending and pending[0][0] <= current_date:
            _, quarter = pending.pop(0)
            drawdown = (peak - value) / peak if peak > 0 else 0.0
            throttle = drawdown_throttle(drawdown, risk) if config.use_drawdown_throttle else 1.0
            install(targets[quarter], throttle)

        if i == 0:
            continue

        day_return = cash * config.risk_free / config.periods_per_year
        drift: dict[str, float] = {}
        for ticker, weight in weights.items():
            series = history.series[ticker]
            previous = series[start + i - 1]
            asset_return = (series[start + i] / previous - 1.0) if previous > 0 else 0.0
            day_return += weight * asset_return
            drift[ticker] = weight * (1.0 + asset_return)

        value *= 1.0 + day_return
        peak = max(peak, value)
        path.append(value)

        # Les poids dérivent avec les cours entre deux rebalancements.
        growth = 1.0 + day_return
        if growth > 0:
            weights = {t: w / growth for t, w in drift.items()}
            cash = cash * (1.0 + config.risk_free / config.periods_per_year) / growth

    benchmark_series = history.series[config.benchmark][start:]
    benchmark_path = [v / benchmark_series[0] for v in benchmark_series]

    if skipped:
        warnings.append(
            "certaines cibles n'ont pas d'historique de prix et ont été ignorées : "
            "le résultat surpondère mécaniquement les titres restants."
        )
    if len(dates) < config.periods_per_year:
        warnings.append(
            f"période de {len(dates)} périodes seulement : le TCAC et le Sharpe affichés "
            "sont annualisés à partir d'un échantillon trop court pour signifier quoi "
            "que ce soit. Ne les citez pas."
        )

    return BacktestResult(
        dates=dates,
        path=path,
        benchmark_path=benchmark_path,
        stats=summarize(path, risk_free=config.risk_free,
                        periods_per_year=config.periods_per_year),
        benchmark_stats=summarize(benchmark_path, risk_free=config.risk_free,
                                  periods_per_year=config.periods_per_year),
        rebalances=rebalances,
        total_turnover=total_turnover,
        total_costs=total_costs,
        warnings=tuple(warnings),
        skipped=tuple(sorted(skipped)),
    )
