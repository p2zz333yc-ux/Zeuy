"""Backtest du dispositif de risque sur un marché quelconque.

La sélection de titres issue des 13F ne peut se tester que sur un
historique de dépôts. Le **dispositif de risque**, lui, est agnostique à
l'actif : cible de volatilité, coupe-circuit sur perte, frais de rotation.
Il se teste donc directement sur un indice, un métal ou n'importe quelle
série de prix.

Règle absolue de ce module : l'exposition de la période *t* n'est calculée
qu'avec l'information disponible à la fin de *t−1*. Un backtest qui
dimensionne le risque avec la volatilité de la période qu'il est en train
de traverser produit des résultats magnifiques et faux.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from ..common import mean, stdev
from .market_data import PriceHistory
from .metrics import PerformanceStats, summarize, to_returns
from .risk import RiskConfig, drawdown_throttle


@dataclass(frozen=True)
class OverlayConfig:
    """Paramètres du dispositif appliqué à une série de prix."""

    target_vol: float = 0.12
    lookback: int = 12
    """Nombre de périodes utilisées pour estimer la volatilité récente."""

    periods_per_year: int = 12
    cost_bps: float = 10.0
    cash_rate: float = 0.04
    max_exposure: float = 1.0
    use_drawdown_throttle: bool = True

    def __post_init__(self) -> None:
        if self.lookback < 3:
            raise ValueError("lookback trop court pour estimer une volatilité")
        if self.periods_per_year < 1:
            raise ValueError("periods_per_year doit être ≥ 1")


@dataclass
class OverlayResult:
    """Comparaison entre l'achat-conservation et le même actif sous dispositif."""

    label: str
    dates: list[str]
    buyhold_path: list[float]
    overlay_path: list[float]
    exposures: list[float]
    buyhold: PerformanceStats
    overlay: PerformanceStats
    turnover: float
    costs: float
    periods_per_year: int

    @property
    def avg_exposure(self) -> float:
        return mean(self.exposures)

    @property
    def min_exposure(self) -> float:
        return min(self.exposures) if self.exposures else 0.0

    @property
    def return_capture(self) -> float:
        """Part de la performance de l'actif conservée par le dispositif."""
        gross = self.buyhold_path[-1] / self.buyhold_path[0] - 1.0
        net = self.overlay_path[-1] / self.overlay_path[0] - 1.0
        return net / gross if gross != 0 else 0.0

    @property
    def risk_reduction(self) -> float:
        """Part du risque de perte évitée (1 − perte max relative)."""
        if self.buyhold.max_drawdown == 0:
            return 0.0
        return 1.0 - self.overlay.max_drawdown / self.buyhold.max_drawdown


def _trailing_vol(returns: list[float], periods_per_year: int) -> float:
    return stdev(returns) * math.sqrt(periods_per_year)


def run_overlay(
    history: PriceHistory,
    weights: dict[str, float],
    *,
    label: str,
    config: OverlayConfig | None = None,
    risk_config: RiskConfig | None = None,
) -> OverlayResult:
    """Applique la cible de volatilité et le coupe-circuit à un panier.

    ``weights`` peut contenir un seul actif (test d'un indice) ou plusieurs
    (test de la diversification). Les poids relatifs sont maintenus
    constants ; seule l'exposition globale varie.
    """
    config = config or OverlayConfig()
    risk = risk_config or RiskConfig(target_vol=config.target_vol)

    missing = [t for t in weights if t not in history.series]
    if missing:
        raise ValueError(f"séries absentes de l'historique : {', '.join(missing)}")

    total = sum(weights.values())
    if total <= 0:
        raise ValueError("les poids doivent être positifs")
    mix = {t: w / total for t, w in weights.items()}

    asset_returns = {t: history.returns(t) for t in mix}
    n = len(history.dates)
    blend = [
        sum(mix[t] * asset_returns[t][i] for t in mix) for i in range(n - 1)
    ]

    if len(blend) <= config.lookback:
        raise ValueError(
            f"historique trop court : {len(blend)} périodes pour un lookback de "
            f"{config.lookback}"
        )

    start = config.lookback
    dates = history.dates[start:]
    period_cash = config.cash_rate / config.periods_per_year

    buyhold = [1.0]
    overlay = [1.0]
    exposures: list[float] = []
    exposure = 0.0
    peak = 1.0
    turnover = costs = 0.0

    for i in range(start, len(blend)):
        # --- décision prise avec l'information de la période précédente ----
        window = blend[i - config.lookback : i]
        vol = _trailing_vol(window, config.periods_per_year)
        # Une volatilité nulle décrit un actif sans risque sur la fenêtre :
        # elle appelle l'exposition maximale, pas l'absence d'exposition.
        target = min(config.target_vol / vol, config.max_exposure) if vol > 0 else config.max_exposure
        if config.use_drawdown_throttle:
            drawdown = (peak - overlay[-1]) / peak if peak > 0 else 0.0
            target *= drawdown_throttle(drawdown, risk)

        traded = abs(target - exposure)
        turnover += traded
        cost = traded * config.cost_bps / 10_000.0
        costs += cost
        exposure = target
        exposures.append(exposure)

        # --- puis seulement, le rendement de la période --------------------
        period = blend[i]
        overlay.append(
            overlay[-1] * (1.0 - cost) * (1.0 + exposure * period + (1.0 - exposure) * period_cash)
        )
        buyhold.append(buyhold[-1] * (1.0 + period))
        peak = max(peak, overlay[-1])

    return OverlayResult(
        label=label,
        dates=dates,
        buyhold_path=buyhold,
        overlay_path=overlay,
        exposures=exposures,
        buyhold=summarize(
            buyhold, risk_free=config.cash_rate, periods_per_year=config.periods_per_year
        ),
        overlay=summarize(
            overlay, risk_free=config.cash_rate, periods_per_year=config.periods_per_year
        ),
        turnover=turnover,
        costs=costs,
        periods_per_year=config.periods_per_year,
    )


def correlation_matrix(history: PriceHistory, tickers: list[str]) -> dict[tuple[str, str], float]:
    """Corrélation des rendements entre séries, mesurée et non supposée."""
    series = {t: history.returns(t) for t in tickers}
    out: dict[tuple[str, str], float] = {}
    for a in tickers:
        for b in tickers:
            ra, rb = series[a], series[b]
            ma, mb = mean(ra), mean(rb)
            cov = sum((x - ma) * (y - mb) for x, y in zip(ra, rb, strict=True)) / len(ra)
            sa, sb = stdev(ra, sample=False), stdev(rb, sample=False)
            out[(a, b)] = cov / (sa * sb) if sa > 0 and sb > 0 else 0.0
    return out


def summarize_market(history: PriceHistory, ticker: str, periods_per_year: int) -> PerformanceStats:
    """Statistiques brutes d'un marché, sans aucun dispositif."""
    prices = history.series[ticker]
    path = [p / prices[0] for p in prices]
    return summarize(path, periods_per_year=periods_per_year)


def annualized_return(history: PriceHistory, ticker: str, periods_per_year: int) -> float:
    prices = history.series[ticker]
    years = (len(prices) - 1) / periods_per_year
    if years <= 0 or prices[0] <= 0:
        return 0.0
    return (prices[-1] / prices[0]) ** (1 / years) - 1.0


def realized_vol(history: PriceHistory, ticker: str, periods_per_year: int) -> float:
    return _trailing_vol(to_returns(history.series[ticker]), periods_per_year)
