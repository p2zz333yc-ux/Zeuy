"""Tests du backtest et de la simulation.

Le piège classique du backtest de 13F est l'anticipation : acheter à la
date de photo du portefeuille alors que l'information n'est publiée que
45 jours plus tard. Le premier test ci-dessous existe pour cela.
"""

from __future__ import annotations

import math
import tempfile
import unittest
from pathlib import Path

from superinvestors.algo.backtest import (
    BacktestConfig,
    SimulationConfig,
    rebalance_date,
    run_backtest,
    simulate_forward,
)
from superinvestors.algo.market_data import (
    MarketModel,
    PriceHistory,
    load_prices_csv,
    measure_risk,
)
from superinvestors.algo.metrics import cagr, max_drawdown, percentile, summarize
from superinvestors.algo.portfolio import build_target_portfolio
from superinvestors.algo.risk import RiskConfig
from superinvestors.algo.scoring import score_universe
from superinvestors.data.loader import load_universe


def _synthetic_history(tickers: list[str], days: int = 500) -> PriceHistory:
    """Historique déterministe : une sinusoïde décalée par titre.

    Il ne ressemble pas au marché et ce n'est pas le but : on teste la
    mécanique du moteur, pas la rentabilité d'une stratégie.
    """
    from datetime import date, timedelta

    start = date(2025, 1, 1)
    dates = [(start + timedelta(days=i)).isoformat() for i in range(days)]
    series = {
        ticker: [
            100.0 * (1.0 + 0.0003 * i + 0.05 * math.sin((i + 30 * k) / 40))
            for i in range(days)
        ]
        for k, ticker in enumerate(tickers)
    }
    return PriceHistory(dates=dates, series=series)


class TestFilingLag(unittest.TestCase):
    def test_rebalance_happens_45_days_after_quarter_end(self) -> None:
        self.assertEqual(rebalance_date("2026Q2"), "2026-08-14")
        self.assertEqual(rebalance_date("2026Q1"), "2026-05-15")
        self.assertEqual(rebalance_date("2025Q4"), "2026-02-14")

    def test_backtest_never_trades_before_publication(self) -> None:
        universe = load_universe()
        history = _synthetic_history(["SPY", "AAPL", "KO"], days=600)
        result = run_backtest(
            universe,
            {"2026Q2": {"AAPL": 0.5, "KO": 0.5}},
            history,
            config=BacktestConfig(benchmark="SPY"),
        )
        self.assertGreaterEqual(result.dates[0], rebalance_date("2026Q2"))


class TestBacktestEngine(unittest.TestCase):
    def setUp(self) -> None:
        self.universe = load_universe()
        self.history = _synthetic_history(["SPY", "AAPL", "KO", "CVX"], days=600)

    def test_result_shapes_are_consistent(self) -> None:
        result = run_backtest(
            self.universe, {"2026Q2": {"AAPL": 0.6, "KO": 0.4}}, self.history
        )
        self.assertEqual(len(result.path), len(result.dates))
        self.assertEqual(len(result.benchmark_path), len(result.dates))
        self.assertEqual(result.rebalances, 1)

    def test_costs_reduce_performance(self) -> None:
        targets = {"2026Q2": {"AAPL": 0.6, "KO": 0.4}}
        free = run_backtest(
            self.universe, targets, self.history, config=BacktestConfig(cost_bps=0.0)
        )
        expensive = run_backtest(
            self.universe, targets, self.history, config=BacktestConfig(cost_bps=100.0)
        )
        self.assertLess(expensive.path[-1], free.path[-1])
        self.assertGreater(expensive.total_costs, 0.0)

    def test_missing_tickers_are_reported_not_silent(self) -> None:
        result = run_backtest(
            self.universe, {"2026Q2": {"AAPL": 0.5, "NVDA": 0.5}}, self.history
        )
        self.assertIn("NVDA", result.skipped)
        self.assertTrue(result.warnings)

    def test_short_window_is_flagged_as_meaningless(self) -> None:
        """Annualiser dix jours de bourse produit des chiffres absurdes : il faut le dire."""
        short = _synthetic_history(["SPY", "AAPL"], days=600)
        result = run_backtest(self.universe, {"2026Q2": {"AAPL": 1.0}}, short)
        self.assertLess(len(result.dates), 252)
        self.assertTrue(any("trop court" in w for w in result.warnings))

    def test_missing_benchmark_raises(self) -> None:
        with self.assertRaises(ValueError):
            run_backtest(
                self.universe, {"2026Q2": {"AAPL": 1.0}}, self.history,
                config=BacktestConfig(benchmark="ABSENT"),
            )

    def test_cash_only_portfolio_earns_the_risk_free_rate(self) -> None:
        result = run_backtest(
            self.universe, {"2026Q2": {}}, self.history,
            config=BacktestConfig(risk_free=0.04, cost_bps=0.0),
        )
        years = (len(result.dates) - 1) / 252
        expected = (1.0 + 0.04 / 252) ** (252 * years)
        self.assertAlmostEqual(result.path[-1], expected, places=4)


class TestPriceIo(unittest.TestCase):
    def test_csv_round_trip_and_risk_measurement(self) -> None:
        history = _synthetic_history(["SPY", "AAPL"], days=300)
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "prix.csv"
            with path.open("w", encoding="utf-8") as handle:
                handle.write("date,ticker,close\n")
                for i, day in enumerate(history.dates):
                    for ticker in history.tickers:
                        handle.write(f"{day},{ticker},{history.series[ticker][i]:.4f}\n")

            loaded = load_prices_csv(path)
            self.assertEqual(loaded.dates, history.dates)
            self.assertAlmostEqual(loaded.series["AAPL"][10], history.series["AAPL"][10], places=3)

            universe = load_universe()
            measured = measure_risk(loaded, universe, benchmark="SPY")
            self.assertNotEqual(measured.asset("AAPL").vol, universe.asset("AAPL").vol)
            # Les titres absents de l'historique gardent leurs valeurs par défaut.
            self.assertEqual(measured.asset("MU").vol, universe.asset("MU").vol)


class TestSimulation(unittest.TestCase):
    def setUp(self) -> None:
        self.universe = load_universe()
        self.target = build_target_portfolio(
            self.universe, score_universe(self.universe), risk_config=RiskConfig()
        )

    def test_simulation_is_reproducible(self) -> None:
        config = SimulationConfig(horizon_days=60, paths=50)
        first = simulate_forward(self.universe, self.target, config=config)
        second = simulate_forward(self.universe, self.target, config=config)
        self.assertEqual(first.returns, second.returns)

    def test_probability_of_gain_is_never_certainty(self) -> None:
        """Le cœur du sujet : aucune configuration ne produit 100 % de gains."""
        result = simulate_forward(
            self.universe, self.target,
            model=MarketModel(alpha_annual=0.04),
            config=SimulationConfig(horizon_days=252, paths=400),
        )
        self.assertLess(result.prob_gain, 1.0)
        self.assertGreater(result.prob_gain, 0.0)
        self.assertLess(result.expected_shortfall_5, 0.0)

    def test_alpha_assumption_shifts_the_distribution(self) -> None:
        config = SimulationConfig(horizon_days=252, paths=300)
        neutral = simulate_forward(
            self.universe, self.target, model=MarketModel(alpha_annual=0.0), config=config
        )
        optimistic = simulate_forward(
            self.universe, self.target, model=MarketModel(alpha_annual=0.05), config=config
        )
        self.assertGreater(optimistic.median_return, neutral.median_return)


class TestMetrics(unittest.TestCase):
    def test_max_drawdown(self) -> None:
        self.assertAlmostEqual(max_drawdown([100, 120, 60, 90]), 0.5, places=9)
        self.assertEqual(max_drawdown([1, 2, 3]), 0.0)

    def test_cagr_doubling_in_one_year(self) -> None:
        path = [1.0] * 253
        path[-1] = 2.0
        self.assertAlmostEqual(cagr(path), 1.0, places=6)

    def test_percentile_bounds(self) -> None:
        values = [float(i) for i in range(101)]
        self.assertAlmostEqual(percentile(values, 0.0), 0.0)
        self.assertAlmostEqual(percentile(values, 0.5), 50.0)
        self.assertAlmostEqual(percentile(values, 1.0), 100.0)

    def test_summarize_flat_path(self) -> None:
        stats = summarize([1.0] * 100)
        self.assertEqual(stats.total_return, 0.0)
        self.assertEqual(stats.volatility, 0.0)
        self.assertEqual(stats.max_drawdown, 0.0)


if __name__ == "__main__":
    unittest.main()
