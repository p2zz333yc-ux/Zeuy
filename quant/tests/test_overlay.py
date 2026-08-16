"""Tests du dispositif de risque appliqué à un marché.

Le test le plus important est le premier : vérifier qu'aucune décision
d'exposition n'utilise le rendement de la période qu'elle dimensionne.
Un backtest qui triche là-dessus produit toujours d'excellents résultats.
"""

from __future__ import annotations

import unittest
from datetime import date

from superinvestors.algo.market_data import PriceHistory
from superinvestors.algo.overlay import (
    OverlayConfig,
    annualized_return,
    correlation_matrix,
    realized_vol,
    run_overlay,
    summarize_market,
)


def _months(n: int) -> list[str]:
    start = date(2020, 1, 1)
    out = []
    for i in range(n):
        year, month = divmod(start.month - 1 + i, 12)
        out.append(f"{start.year + year:04d}-{month + 1:02d}-01")
    return out


def _history(series: dict[str, list[float]]) -> PriceHistory:
    length = len(next(iter(series.values())))
    return PriceHistory(dates=_months(length), series=series)


def _steady(n: int, monthly: float, start: float = 100.0) -> list[float]:
    prices = [start]
    for _ in range(n - 1):
        prices.append(prices[-1] * (1 + monthly))
    return prices


def _crash(n: int, drop_at: int, drop: float) -> list[float]:
    """Marché calme, puis une chute violente, puis calme à nouveau."""
    prices = [100.0]
    for i in range(1, n):
        move = -drop if i == drop_at else 0.004
        prices.append(prices[-1] * (1 + move))
    return prices


class TestNoLookAhead(unittest.TestCase):
    def test_exposure_ignores_the_period_it_sizes(self) -> None:
        """Modifier le tout dernier rendement ne doit changer aucune exposition."""
        base = _crash(40, drop_at=30, drop=0.18)
        altered = list(base)
        altered[-1] = altered[-2] * 1.25  # dernier mois radicalement différent

        config = OverlayConfig(lookback=12)
        first = run_overlay(_history({"X": base}), {"X": 1.0}, label="X", config=config)
        second = run_overlay(_history({"X": altered}), {"X": 1.0}, label="X", config=config)

        self.assertEqual(first.exposures, second.exposures)

    def test_history_too_short_is_refused(self) -> None:
        history = _history({"X": _steady(10, 0.01)})
        with self.assertRaises(ValueError):
            run_overlay(history, {"X": 1.0}, label="X", config=OverlayConfig(lookback=12))


class TestExposureSizing(unittest.TestCase):
    def test_calm_market_is_fully_invested(self) -> None:
        """Une volatilité sous la cible ne justifie aucun levier."""
        history = _history({"X": _steady(40, 0.004)})
        result = run_overlay(history, {"X": 1.0}, label="X", config=OverlayConfig(lookback=12))
        self.assertLessEqual(max(result.exposures), 1.0)
        self.assertAlmostEqual(max(result.exposures), 1.0, places=9)

    def test_violent_market_is_de_risked(self) -> None:
        history = _history({"X": _crash(48, drop_at=20, drop=0.25)})
        result = run_overlay(history, {"X": 1.0}, label="X", config=OverlayConfig(lookback=12))
        self.assertLess(result.min_exposure, 1.0)
        self.assertLess(result.overlay.max_drawdown, result.buyhold.max_drawdown)

    def test_costs_are_charged_on_exposure_changes(self) -> None:
        history = _history({"X": _crash(48, drop_at=20, drop=0.25)})
        free = run_overlay(history, {"X": 1.0}, label="X",
                           config=OverlayConfig(lookback=12, cost_bps=0.0))
        costly = run_overlay(history, {"X": 1.0}, label="X",
                             config=OverlayConfig(lookback=12, cost_bps=200.0))
        self.assertGreater(costly.costs, free.costs)
        self.assertLess(costly.overlay_path[-1], free.overlay_path[-1])

    def test_unknown_series_is_refused(self) -> None:
        history = _history({"X": _steady(40, 0.004)})
        with self.assertRaises(ValueError):
            run_overlay(history, {"ABSENT": 1.0}, label="?", config=OverlayConfig())

    def test_blend_weights_are_normalised(self) -> None:
        history = _history({"A": _steady(40, 0.004), "B": _steady(40, 0.006)})
        equal = run_overlay(history, {"A": 1.0, "B": 1.0}, label="mix", config=OverlayConfig())
        scaled = run_overlay(history, {"A": 5.0, "B": 5.0}, label="mix", config=OverlayConfig())
        self.assertEqual(equal.overlay_path, scaled.overlay_path)


class TestMarketStats(unittest.TestCase):
    def setUp(self) -> None:
        self.history = _history({"A": _steady(37, 0.01), "B": _steady(37, -0.005)})

    def test_annualised_return_matches_compounding(self) -> None:
        self.assertAlmostEqual(annualized_return(self.history, "A", 12), 1.01**12 - 1, places=6)

    def test_steady_market_has_no_volatility(self) -> None:
        self.assertAlmostEqual(realized_vol(self.history, "A", 12), 0.0, places=9)

    def test_falling_market_has_a_drawdown(self) -> None:
        self.assertGreater(summarize_market(self.history, "B", 12).max_drawdown, 0.0)

    def test_correlation_of_identical_series_is_one(self) -> None:
        history = _history({"A": _crash(40, 15, 0.2), "B": _crash(40, 15, 0.2)})
        matrix = correlation_matrix(history, ["A", "B"])
        self.assertAlmostEqual(matrix[("A", "B")], 1.0, places=6)
        self.assertAlmostEqual(matrix[("A", "A")], 1.0, places=6)


if __name__ == "__main__":
    unittest.main()
