"""Tests de cohérence des données : la base doit être auditable."""

from __future__ import annotations

import csv
import tempfile
import unittest
from pathlib import Path

from superinvestors.data.loader import (
    export_holdings_csv,
    import_holdings_csv,
    load_universe,
)
from superinvestors.data.models import Action, Confidence, Holding, Portfolio


class TestUniverse(unittest.TestCase):
    def setUp(self) -> None:
        self.universe = load_universe()

    def test_universe_is_valid(self) -> None:
        self.assertGreater(len(self.universe.portfolios), 5)
        self.assertGreater(len(self.universe.managers), 5)

    def test_every_holding_has_an_asset(self) -> None:
        for portfolio in self.universe.portfolios:
            for holding in portfolio.holdings:
                self.assertIn(holding.ticker, self.universe.assets, holding.ticker)

    def test_weights_never_exceed_one_hundred(self) -> None:
        for portfolio in self.universe.portfolios:
            self.assertLessEqual(portfolio.covered_weight, 100.5, portfolio.manager_key)

    def test_every_portfolio_carries_a_source(self) -> None:
        for portfolio in self.universe.portfolios:
            self.assertTrue(portfolio.source.startswith("http"), portfolio.manager_key)

    def test_excluded_managers_state_a_reason(self) -> None:
        for manager in self.universe.managers.values():
            if not manager.include_in_signal:
                self.assertTrue(manager.exclusion_reason)

    def test_signal_portfolios_exclude_untradeable_managers(self) -> None:
        keys = {p.manager_key for p in self.universe.signal_portfolios()}
        self.assertNotIn("renaissance", keys)   # rotation trop rapide
        self.assertNotIn("bridgewater", keys)   # risque hors 13F
        self.assertNotIn("icahn", keys)         # positions de contrôle
        self.assertIn("berkshire", keys)

    def test_estimated_weights_are_flagged(self) -> None:
        """Toute pondération reconstituée doit être marquée comme telle."""
        pershing = next(p for p in self.universe.portfolios if p.manager_key == "pershing")
        carried = [h for h in pershing.active if h.confidence is Confidence.ESTIMATED]
        self.assertTrue(carried)

    def test_exit_positions_have_zero_weight(self) -> None:
        for portfolio in self.universe.portfolios:
            for holding in portfolio.holdings:
                if holding.action is Action.EXIT:
                    self.assertEqual(holding.weight_pct, 0.0)


class TestModelInvariants(unittest.TestCase):
    def test_negative_weight_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            Holding("AAPL", -1.0)

    def test_exit_with_weight_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            Holding("AAPL", 5.0, Action.EXIT)

    def test_covered_weight_ignores_exits(self) -> None:
        portfolio = Portfolio(
            manager_key="x", quarter="2026Q2", filed_on=None,
            total_value_usd=1.0, positions_reported=2,
            holdings=(Holding("AAPL", 10.0), Holding("KO", 0.0, Action.EXIT)),
        )
        self.assertEqual(portfolio.covered_weight, 10.0)
        self.assertEqual(len(portfolio.active), 1)


class TestCsvRoundTrip(unittest.TestCase):
    def test_export_then_import(self) -> None:
        universe = load_universe()
        with tempfile.TemporaryDirectory() as tmp:
            path = export_holdings_csv(universe, Path(tmp) / "positions.csv")
            with path.open(encoding="utf-8") as handle:
                rows = list(csv.DictReader(handle))
            expected = sum(len(p.holdings) for p in universe.portfolios)
            self.assertEqual(len(rows), expected)

            reimported = import_holdings_csv(path, universe)
            self.assertEqual(len(reimported), len(universe.portfolios))
            original = {
                (p.manager_key, p.quarter): p.covered_weight for p in universe.portfolios
            }
            for portfolio in reimported:
                key = (portfolio.manager_key, portfolio.quarter)
                self.assertAlmostEqual(original[key], portfolio.covered_weight, places=6)


if __name__ == "__main__":
    unittest.main()
