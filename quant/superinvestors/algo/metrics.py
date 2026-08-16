"""Mesures de performance et de risque, sans complaisance.

Une performance sans mesure de perte maximale et de dispersion n'est pas
une performance : c'est un argument commercial.
"""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import asdict, dataclass

from ..common import mean, stdev

TRADING_DAYS = 252


def to_returns(path: Sequence[float]) -> list[float]:
    """Rendements simples d'une trajectoire de valeurs."""
    return [
        (path[i] / path[i - 1]) - 1.0
        for i in range(1, len(path))
        if path[i - 1] > 0
    ]


def max_drawdown(path: Sequence[float]) -> float:
    """Perte maximale depuis un sommet, en valeur positive (0,25 = -25 %)."""
    peak, worst = float("-inf"), 0.0
    for value in path:
        peak = max(peak, value)
        if peak > 0:
            worst = max(worst, (peak - value) / peak)
    return worst


def cagr(path: Sequence[float], *, periods_per_year: int = TRADING_DAYS) -> float:
    """Taux de croissance annuel composé."""
    if len(path) < 2 or path[0] <= 0 or path[-1] <= 0:
        return 0.0
    years = (len(path) - 1) / periods_per_year
    if years <= 0:
        return 0.0
    return (path[-1] / path[0]) ** (1 / years) - 1.0


def annualized_vol(returns: Sequence[float], *, periods_per_year: int = TRADING_DAYS) -> float:
    return stdev(returns) * math.sqrt(periods_per_year)


def sharpe(returns: Sequence[float], *, risk_free: float = 0.04,
           periods_per_year: int = TRADING_DAYS) -> float:
    """Ratio de Sharpe annualisé (rendement excédentaire ÷ volatilité)."""
    vol = annualized_vol(returns, periods_per_year=periods_per_year)
    if vol == 0:
        return 0.0
    excess = mean(returns) * periods_per_year - risk_free
    return excess / vol


def sortino(returns: Sequence[float], *, risk_free: float = 0.04,
            periods_per_year: int = TRADING_DAYS) -> float:
    """Comme Sharpe, mais ne pénalise que la volatilité à la baisse."""
    downside = [r for r in returns if r < 0]
    if not downside:
        return 0.0
    dev = math.sqrt(sum(r * r for r in downside) / len(returns)) * math.sqrt(periods_per_year)
    if dev == 0:
        return 0.0
    return (mean(returns) * periods_per_year - risk_free) / dev


def percentile(values: Sequence[float], q: float) -> float:
    """Percentile par interpolation linéaire (q dans [0, 1])."""
    if not values:
        return 0.0
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    position = q * (len(ordered) - 1)
    low = int(math.floor(position))
    high = int(math.ceil(position))
    if low == high:
        return ordered[low]
    return ordered[low] + (ordered[high] - ordered[low]) * (position - low)


@dataclass(frozen=True)
class PerformanceStats:
    """Résumé d'une trajectoire de portefeuille."""

    total_return: float
    cagr: float
    volatility: float
    sharpe: float
    sortino: float
    max_drawdown: float
    best_day: float
    worst_day: float
    positive_days: float

    def as_dict(self) -> dict[str, float]:
        return asdict(self)

    def render(self) -> str:
        return (
            f"  rendement total    : {self.total_return:+.1%}\n"
            f"  TCAC               : {self.cagr:+.2%}\n"
            f"  volatilité         : {self.volatility:.2%}\n"
            f"  Sharpe             : {self.sharpe:.2f}\n"
            f"  Sortino            : {self.sortino:.2f}\n"
            f"  perte max          : -{self.max_drawdown:.1%}\n"
            f"  meilleur/pire jour : {self.best_day:+.2%} / {self.worst_day:+.2%}\n"
            f"  jours positifs     : {self.positive_days:.1%}"
        )


def summarize(path: Sequence[float], *, risk_free: float = 0.04,
              periods_per_year: int = TRADING_DAYS) -> PerformanceStats:
    """Statistiques complètes d'une trajectoire de valeurs de portefeuille."""
    returns = to_returns(path)
    if not returns:
        return PerformanceStats(0, 0, 0, 0, 0, 0, 0, 0, 0)
    return PerformanceStats(
        total_return=path[-1] / path[0] - 1.0,
        cagr=cagr(path, periods_per_year=periods_per_year),
        volatility=annualized_vol(returns, periods_per_year=periods_per_year),
        sharpe=sharpe(returns, risk_free=risk_free, periods_per_year=periods_per_year),
        sortino=sortino(returns, risk_free=risk_free, periods_per_year=periods_per_year),
        max_drawdown=max_drawdown(path),
        best_day=max(returns),
        worst_day=min(returns),
        positive_days=sum(1 for r in returns if r > 0) / len(returns),
    )
