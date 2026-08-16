"""Séries de prix : import réel et modèle de marché pour la simulation.

Deux régimes, jamais confondus :

* **Données réelles** — un CSV ``date,ticker,close`` fourni par vous. Les
  volatilités et bêtas sont alors *mesurés*, pas supposés.
* **Modèle** — un modèle à facteurs (marché + secteur + idiosyncrasique)
  qui sert uniquement à explorer la distribution des résultats possibles.
  Ce n'est pas une prévision, et tout affichage issu de ce mode est
  explicitement étiqueté comme simulé.
"""

from __future__ import annotations

import csv
import math
import random
from dataclasses import dataclass, replace
from pathlib import Path

from ..common import mean, stdev
from ..data.models import Universe
from .metrics import TRADING_DAYS, to_returns


@dataclass
class PriceHistory:
    """Historique de clôtures aligné sur un calendrier commun."""

    dates: list[str]
    series: dict[str, list[float]]

    def __post_init__(self) -> None:
        for ticker, values in self.series.items():
            if len(values) != len(self.dates):
                raise ValueError(
                    f"{ticker}: {len(values)} prix pour {len(self.dates)} dates"
                )

    @property
    def tickers(self) -> tuple[str, ...]:
        return tuple(self.series)

    def returns(self, ticker: str) -> list[float]:
        return to_returns(self.series[ticker])

    def index_of_date(self, date: str) -> int:
        """Première position dont la date est ≥ ``date`` (-1 si aucune)."""
        for i, current in enumerate(self.dates):
            if current >= date:
                return i
        return -1

    def slice_from(self, date: str) -> PriceHistory:
        start = self.index_of_date(date)
        if start < 0:
            raise ValueError(f"aucune donnée à partir du {date}")
        return PriceHistory(
            dates=self.dates[start:],
            series={t: v[start:] for t, v in self.series.items()},
        )


def load_prices_csv(path: Path) -> PriceHistory:
    """Charge un CSV au format long ``date,ticker,close``.

    Les dates sans cotation pour un titre sont comblées par report du
    dernier cours connu ; les titres sans historique complet en début de
    période sont écartés plutôt que rétropolés.
    """
    rows: dict[str, dict[str, float]] = {}
    tickers: list[str] = []
    with path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            date = row["date"].strip()
            ticker = row["ticker"].strip().upper()
            rows.setdefault(date, {})[ticker] = float(row["close"])
            if ticker not in tickers:
                tickers.append(ticker)

    dates = sorted(rows)
    if not dates:
        raise ValueError(f"{path} ne contient aucune ligne exploitable")

    series: dict[str, list[float]] = {}
    for ticker in tickers:
        values: list[float] = []
        last: float | None = None
        for date in dates:
            price = rows[date].get(ticker, last)
            if price is None:
                break
            values.append(price)
            last = price
        if len(values) == len(dates):
            series[ticker] = values

    return PriceHistory(dates=dates, series=series)


def measure_risk(
    history: PriceHistory, universe: Universe, *, benchmark: str = "SPY"
) -> Universe:
    """Remplace les volatilités et bêtas supposés par les valeurs mesurées.

    Les titres absents de l'historique conservent leurs valeurs par défaut,
    et le fait est signalé par la fonction appelante si nécessaire.
    """
    if benchmark not in history.series:
        raise ValueError(f"indice de référence {benchmark} absent de l'historique")

    market = history.returns(benchmark)
    market_var = stdev(market, sample=False) ** 2
    assets = dict(universe.assets)

    for ticker in history.tickers:
        if ticker not in assets:
            continue
        returns = history.returns(ticker)
        if len(returns) < 30:
            continue
        vol = stdev(returns) * math.sqrt(TRADING_DAYS)
        if market_var > 0 and len(returns) == len(market):
            mr, ar = mean(market), mean(returns)
            covariance = sum(
                (m - mr) * (a - ar) for m, a in zip(market, returns, strict=True)
            ) / len(returns)
            beta = covariance / market_var
        else:
            beta = assets[ticker].beta
        assets[ticker] = replace(assets[ticker], vol=max(vol, 1e-4), beta=beta)

    return Universe(managers=universe.managers, portfolios=universe.portfolios, assets=assets)


@dataclass(frozen=True)
class MarketModel:
    """Modèle à facteurs utilisé pour simuler des trajectoires.

    ``alpha_annual`` est volontairement nul par défaut : la simulation ne
    doit pas supposer la conclusion qu'elle est censée tester. Mettez-le à
    0,02 ou 0,04 pour vérifier ce que devient le portefeuille *si* l'alpha
    documenté par la littérature se matérialisait.
    """

    market_drift: float = 0.07
    market_vol: float = 0.16
    sector_vol: float = 0.10
    alpha_annual: float = 0.0
    seed: int = 20260814

    def _idio_vol(self, total_vol: float, beta: float) -> float:
        systematic = (beta * self.market_vol) ** 2 + self.sector_vol**2 * 0.25
        return math.sqrt(max(total_vol**2 - systematic, (0.05 * total_vol) ** 2))

    def simulate_portfolio(
        self,
        universe: Universe,
        weights: dict[str, float],
        *,
        days: int,
        paths: int,
        cash_rate: float = 0.04,
        cash_weight: float | None = None,
    ) -> list[list[float]]:
        """Simule ``paths`` trajectoires quotidiennes de la valeur du portefeuille.

        Les corrélations émergent de la structure : facteur de marché commun,
        facteur sectoriel partagé, bruit propre à chaque titre.
        """
        # Deux flux aléatoires séparés : le facteur de marché consomme
        # exactement un tirage par jour, ce qui permet à
        # `simulate_benchmark` de rejouer les mêmes chocs de marché.
        market_rng = random.Random(self.seed)
        noise_rng = random.Random(self.seed + 1)
        tickers = [t for t in weights if weights[t] > 0]
        invested = sum(weights[t] for t in tickers)
        cash = cash_weight if cash_weight is not None else max(0.0, 1.0 - invested)

        dt = 1.0 / TRADING_DAYS
        sqrt_dt = math.sqrt(dt)
        sectors = sorted({universe.asset(t).sector for t in tickers})

        params = {
            t: (
                universe.asset(t).beta,
                self._idio_vol(universe.asset(t).vol, universe.asset(t).beta),
                universe.asset(t).sector,
            )
            for t in tickers
        }

        results: list[list[float]] = []
        for _ in range(paths):
            value = 1.0
            path = [value]
            for _ in range(days):
                market = self.market_drift * dt + self.market_vol * sqrt_dt * market_rng.gauss(0, 1)
                sector_shocks = {
                    s: self.sector_vol * 0.5 * sqrt_dt * noise_rng.gauss(0, 1) for s in sectors
                }
                day_return = cash * cash_rate * dt
                for ticker in tickers:
                    beta, idio_vol, sector = params[ticker]
                    asset_return = (
                        beta * market
                        + sector_shocks[sector]
                        + idio_vol * sqrt_dt * noise_rng.gauss(0, 1)
                        + self.alpha_annual * dt
                    )
                    day_return += weights[ticker] * asset_return
                value *= 1.0 + day_return
                path.append(value)
            results.append(path)
        return results

    def simulate_benchmark(self, *, days: int, paths: int) -> list[list[float]]:
        """Trajectoires de l'indice, générées avec la même graine.

        Comparer un portefeuille simulé à un indice simulé sous les mêmes
        chocs est la seule comparaison qui ait un sens ici.
        """
        rng = random.Random(self.seed)
        dt = 1.0 / TRADING_DAYS
        sqrt_dt = math.sqrt(dt)
        results: list[list[float]] = []
        for _ in range(paths):
            value = 1.0
            path = [value]
            for _ in range(days):
                market = self.market_drift * dt + self.market_vol * sqrt_dt * rng.gauss(0, 1)
                value *= 1.0 + market
                path.append(value)
            results.append(path)
        return results
