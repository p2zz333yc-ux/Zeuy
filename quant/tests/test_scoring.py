"""Tests du moteur de score : le classement doit être explicable et stable."""

from __future__ import annotations

import unittest

from superinvestors.algo.scoring import ScoringConfig, eligible_assets, score_universe
from superinvestors.common import quarter_lag, zscore
from superinvestors.data.loader import load_universe
from superinvestors.data.models import (
    Action,
    Holding,
    Horizon,
    Manager,
    Portfolio,
    Style,
    Universe,
)
from superinvestors.data.universe import ASSETS


def _manager(key: str, style: Style, quality: float = 1.0) -> Manager:
    return Manager(
        key=key, name=key, firm=key, cik=None, style=style, horizon=Horizon.LONG,
        track_record="", thesis="", quality=quality,
    )


def _universe(portfolios: tuple[Portfolio, ...], managers: dict[str, Manager]) -> Universe:
    return Universe(managers=managers, portfolios=portfolios, assets=dict(ASSETS))


class TestScoringMechanics(unittest.TestCase):
    def test_consensus_beats_isolation(self) -> None:
        """À conviction égale, le titre partagé par trois gérants passe devant."""
        managers = {
            "a": _manager("a", Style.QUALITY_COMPOUNDER),
            "b": _manager("b", Style.DEEP_VALUE),
            "c": _manager("c", Style.GLOBAL_MACRO),
        }
        portfolios = tuple(
            Portfolio(
                manager_key=key, quarter="2026Q2", filed_on=None, total_value_usd=1.0,
                positions_reported=2,
                holdings=(Holding("AMZN", 8.0), Holding(solo, 8.0)),
            )
            for key, solo in (("a", "KO"), ("b", "CVX"), ("c", "GE"))
        )
        scored = score_universe(_universe(portfolios, managers))
        by_ticker = {s.ticker: s for s in scored}
        self.assertTrue(by_ticker["AMZN"].eligible)
        self.assertGreater(by_ticker["AMZN"].score, by_ticker["KO"].score)

    def test_solo_positions_are_rejected_unless_high_conviction(self) -> None:
        managers = {"a": _manager("a", Style.ACTIVIST)}
        portfolios = (
            Portfolio(
                manager_key="a", quarter="2026Q2", filed_on=None, total_value_usd=1.0,
                positions_reported=2,
                holdings=(Holding("KO", 2.0), Holding("AAPL", 25.0)),
            ),
        )
        scored = {s.ticker: s for s in score_universe(_universe(portfolios, managers))}
        self.assertFalse(scored["KO"].eligible)
        self.assertTrue(scored["AAPL"].eligible)

    def test_index_vehicles_are_never_eligible(self) -> None:
        managers = {"a": _manager("a", Style.GLOBAL_MACRO), "b": _manager("b", Style.GROWTH)}
        portfolios = tuple(
            Portfolio(
                manager_key=key, quarter="2026Q2", filed_on=None, total_value_usd=1.0,
                positions_reported=1, holdings=(Holding("SPY", 30.0),),
            )
            for key in ("a", "b")
        )
        scored = {s.ticker: s for s in score_universe(_universe(portfolios, managers))}
        self.assertFalse(scored["SPY"].eligible)

    def test_stale_filings_are_discounted(self) -> None:
        """Un dépôt vieux d'un an pèse moins qu'un dépôt du trimestre."""
        managers = {"old": _manager("old", Style.DEEP_VALUE), "new": _manager("new", Style.GROWTH)}
        portfolios = (
            Portfolio("old", "2025Q2", None, 1.0, 1, (Holding("KO", 10.0),)),
            Portfolio("new", "2026Q2", None, 1.0, 1, (Holding("CVX", 10.0),)),
        )
        scored = {s.ticker: s for s in score_universe(_universe(portfolios, managers))}
        self.assertLess(scored["KO"].factors["consensus"], scored["CVX"].factors["consensus"])

    def test_flow_direction_matters(self) -> None:
        managers = {"a": _manager("a", Style.GROWTH), "b": _manager("b", Style.DEEP_VALUE)}
        portfolios = (
            Portfolio("a", "2026Q2", None, 1.0, 2,
                      (Holding("KO", 10.0, Action.NEW), Holding("CVX", 10.0, Action.TRIM))),
            Portfolio("b", "2026Q2", None, 1.0, 2,
                      (Holding("KO", 10.0, Action.ADD), Holding("CVX", 10.0, Action.TRIM))),
        )
        scored = {s.ticker: s for s in score_universe(_universe(portfolios, managers))}
        self.assertGreater(scored["KO"].factors["flux"], scored["CVX"].factors["flux"])
        self.assertGreater(scored["KO"].score, scored["CVX"].score)

    def test_manager_weight_cap_limits_a_single_voice(self) -> None:
        """Une ligne à 40 % ne doit pas compter quatre fois une ligne à 10 %."""
        managers = {"a": _manager("a", Style.ACTIVIST), "b": _manager("b", Style.GROWTH)}
        config = ScoringConfig(manager_weight_cap=15.0)
        portfolios = (
            Portfolio("a", "2026Q2", None, 1.0, 2,
                      (Holding("KO", 40.0), Holding("CVX", 15.0))),
            Portfolio("b", "2026Q2", None, 1.0, 2,
                      (Holding("KO", 5.0), Holding("CVX", 15.0))),
        )
        scored = {s.ticker: s for s in score_universe(_universe(portfolios, managers), config)}
        self.assertLessEqual(scored["KO"].factors["conviction"], config.manager_weight_cap)

    def test_contributions_sum_to_score(self) -> None:
        for asset in score_universe(load_universe()):
            self.assertAlmostEqual(sum(asset.contributions.values()), asset.score, places=9)


class TestRealUniverseScoring(unittest.TestCase):
    def setUp(self) -> None:
        self.scored = score_universe(load_universe())

    def test_ranking_is_not_empty(self) -> None:
        self.assertGreaterEqual(len(eligible_assets(self.scored)), 10)

    def test_consensus_names_reach_the_top(self) -> None:
        top5 = [s.ticker for s in eligible_assets(self.scored)[:5]]
        self.assertIn("AMZN", top5)
        self.assertIn("GOOGL", top5)

    def test_rejections_always_carry_a_motive(self) -> None:
        for asset in self.scored:
            if not asset.eligible:
                self.assertTrue(asset.rejection)

    def test_scoring_is_deterministic(self) -> None:
        again = score_universe(load_universe())
        self.assertEqual(
            [s.ticker for s in self.scored], [s.ticker for s in again]
        )


class TestHelpers(unittest.TestCase):
    def test_zscore_of_constant_series(self) -> None:
        self.assertEqual(zscore([3.0, 3.0, 3.0]), [0.0, 0.0, 0.0])

    def test_quarter_lag(self) -> None:
        self.assertEqual(quarter_lag("2026Q2", "2025Q2"), 4)
        self.assertEqual(quarter_lag("2026Q2", "2026Q2"), 0)


if __name__ == "__main__":
    unittest.main()
