"""Tests du modèle de risque et de la construction de portefeuille.

Ce sont les tests les plus importants du dépôt : une erreur de score coûte
de la performance, une erreur de dimensionnement coûte le capital.
"""

from __future__ import annotations

import unittest

from superinvestors.algo.portfolio import build_target_portfolio
from superinvestors.algo.risk import (
    RiskConfig,
    apply_caps,
    correlation,
    drawdown_throttle,
    portfolio_vol,
    volatility_scaling,
)
from superinvestors.algo.scoring import score_universe
from superinvestors.data.loader import load_universe


class TestCorrelationModel(unittest.TestCase):
    def setUp(self) -> None:
        self.universe = load_universe()
        self.config = RiskConfig()

    def test_self_correlation_is_one(self) -> None:
        self.assertEqual(correlation(self.universe, "AAPL", "AAPL", self.config), 1.0)

    def test_same_sector_is_more_correlated_than_different(self) -> None:
        same = correlation(self.universe, "AAPL", "MU", self.config)
        different = correlation(self.universe, "AAPL", "KO", self.config)
        self.assertGreater(same, different)

    def test_single_asset_vol_matches_asset_vol(self) -> None:
        vol = portfolio_vol(self.universe, {"AAPL": 1.0}, self.config)
        self.assertAlmostEqual(vol, self.universe.asset("AAPL").vol, places=9)

    def test_diversification_reduces_volatility(self) -> None:
        concentrated = portfolio_vol(self.universe, {"MU": 1.0}, self.config)
        spread = portfolio_vol(
            self.universe, {"MU": 0.25, "KO": 0.25, "CVX": 0.25, "ELV": 0.25}, self.config
        )
        self.assertLess(spread, concentrated)


class TestCaps(unittest.TestCase):
    def setUp(self) -> None:
        self.universe = load_universe()

    def test_position_cap_is_enforced(self) -> None:
        config = RiskConfig(max_position=0.10, min_position=0.0)
        weights, _ = apply_caps(self.universe, {"AAPL": 0.9, "KO": 0.05, "CVX": 0.05}, config)
        for weight in weights.values():
            self.assertLessEqual(weight, 0.10 + 1e-9)

    def test_sector_cap_is_enforced(self) -> None:
        config = RiskConfig(max_position=0.50, max_sector=0.30, min_position=0.0)
        raw = {"AAPL": 0.3, "MU": 0.3, "INTC": 0.3, "KO": 0.05, "CVX": 0.05}
        weights, warnings = apply_caps(self.universe, raw, config)
        tech = sum(
            w for t, w in weights.items() if self.universe.asset(t).sector == "technologie"
        )
        self.assertLessEqual(tech, 0.30 + 1e-6)
        self.assertTrue(any("secteur" in w for w in warnings))

    def test_capping_preserves_ranking(self) -> None:
        """Le plafonnement ne doit jamais faire passer une petite ligne devant une grande."""
        config = RiskConfig(max_position=0.20, min_position=0.0)
        raw = {"KO": 0.5, "CVX": 0.3, "ELV": 0.2}
        weights, _ = apply_caps(self.universe, raw, config)
        self.assertGreaterEqual(weights["KO"], weights["CVX"])
        self.assertGreaterEqual(weights["CVX"], weights["ELV"])

    def test_weights_never_exceed_one(self) -> None:
        config = RiskConfig()
        weights, _ = apply_caps(
            self.universe, {"KO": 1.0, "CVX": 1.0, "ELV": 1.0, "GE": 1.0}, config
        )
        self.assertLessEqual(sum(weights.values()), 1.0 + 1e-9)


class TestVolatilityTargeting(unittest.TestCase):
    def test_scaling_hits_the_target(self) -> None:
        config = RiskConfig(target_vol=0.10)
        self.assertAlmostEqual(volatility_scaling(0.20, config), 0.5, places=9)

    def test_no_leverage_by_default(self) -> None:
        config = RiskConfig(target_vol=0.30)
        self.assertEqual(volatility_scaling(0.10, config), 1.0)

    def test_zero_volatility_is_not_infinite_leverage(self) -> None:
        self.assertEqual(volatility_scaling(0.0, RiskConfig()), 0.0)


class TestDrawdownThrottle(unittest.TestCase):
    def setUp(self) -> None:
        self.config = RiskConfig(soft_drawdown=0.10, hard_drawdown=0.20,
                                 min_exposure_in_drawdown=0.40)

    def test_no_throttle_before_soft_threshold(self) -> None:
        self.assertEqual(drawdown_throttle(0.05, self.config), 1.0)

    def test_full_throttle_beyond_hard_threshold(self) -> None:
        self.assertEqual(drawdown_throttle(0.35, self.config), 0.40)

    def test_throttle_is_progressive_and_monotonic(self) -> None:
        values = [drawdown_throttle(dd / 100, self.config) for dd in range(0, 30)]
        self.assertEqual(values, sorted(values, reverse=True))
        self.assertAlmostEqual(drawdown_throttle(0.15, self.config), 0.70, places=9)


class TestTargetPortfolio(unittest.TestCase):
    def setUp(self) -> None:
        self.universe = load_universe()
        self.scored = score_universe(self.universe)

    def test_portfolio_respects_all_constraints(self) -> None:
        config = RiskConfig()
        target = build_target_portfolio(
            self.universe, self.scored, risk_config=config, n_positions=15
        )
        invested = sum(p.weight for p in target.positions)

        self.assertLessEqual(invested, config.max_gross_exposure + 1e-9)
        self.assertAlmostEqual(invested + target.cash_weight, 1.0, places=9)
        for weight in target.bucket_exposures().values():
            self.assertLessEqual(weight / max(invested, 1e-9), config.max_bucket + 1e-6)

    def test_expected_volatility_matches_target(self) -> None:
        config = RiskConfig(target_vol=0.12)
        target = build_target_portfolio(self.universe, self.scored, risk_config=config)
        self.assertLessEqual(target.expected_vol, config.target_vol + 1e-6)

    def test_higher_target_vol_invests_more(self) -> None:
        prudent = build_target_portfolio(
            self.universe, self.scored, risk_config=RiskConfig(target_vol=0.08)
        )
        bold = build_target_portfolio(
            self.universe, self.scored, risk_config=RiskConfig(target_vol=0.18)
        )
        self.assertGreater(bold.gross_exposure, prudent.gross_exposure)
        self.assertLess(bold.cash_weight, prudent.cash_weight)

    def test_empty_selection_is_all_cash(self) -> None:
        target = build_target_portfolio(self.universe, [], n_positions=10)
        self.assertEqual(target.positions, ())
        self.assertEqual(target.cash_weight, 1.0)

    def test_every_position_is_explained(self) -> None:
        target = build_target_portfolio(self.universe, self.scored)
        for position in target.positions:
            self.assertTrue(position.reason)
            self.assertTrue(position.holders)


if __name__ == "__main__":
    unittest.main()
