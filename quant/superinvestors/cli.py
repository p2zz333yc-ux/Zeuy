"""Interface en ligne de commande.

    python3 -m superinvestors.cli gerants
    python3 -m superinvestors.cli analyse
    python3 -m superinvestors.cli pourquoi GOOGL
    python3 -m superinvestors.cli score --top 20
    python3 -m superinvestors.cli portefeuille --lignes 15
    python3 -m superinvestors.cli simuler --horizon 252 --trajectoires 2000
    python3 -m superinvestors.cli backtest --prix historique.csv
    python3 -m superinvestors.cli export --sortie positions.csv
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import AVERTISSEMENT
from .algo.backtest import (
    BacktestConfig,
    SimulationConfig,
    rebalance_date,
    run_backtest,
    simulate_forward,
)
from .algo.market_data import MarketModel, load_prices_csv, measure_risk
from .algo.portfolio import TargetPortfolio, build_target_portfolio
from .algo.risk import RiskConfig
from .algo.scoring import ScoringConfig, eligible_assets, score_universe
from .analysis.portfolio_stats import concentration, consensus_table, overlap_matrix
from .analysis.rationale import explain
from .analysis.themes import aggregate_macro_exposure, macro_exposure
from .common import latest_quarter
from .data.loader import export_holdings_csv, load_universe
from .data.models import Universe

RULE = "─" * 78


def _title(text: str) -> str:
    return f"\n{text}\n{RULE}"


# ---------------------------------------------------------------------------
# Commandes
# ---------------------------------------------------------------------------

def cmd_gerants(universe: Universe, _: argparse.Namespace) -> None:
    print(_title("LES GÉRANTS SUIVIS"))
    retained, excluded = [], []
    for portfolio in universe.portfolios:
        (retained if universe.manager_of(portfolio).include_in_signal else excluded).append(portfolio)

    print(f"\n{len(retained)} gérants retenus pour le signal :\n")
    for portfolio in retained:
        manager = universe.manager_of(portfolio)
        print(f"  {manager.name} — {manager.firm}")
        print(
            f"    style {manager.style.value} · horizon {manager.horizon.value} · "
            f"confiance {manager.quality:.2f} · {portfolio.quarter} · "
            f"{portfolio.total_value_usd / 1e9:.1f} Md$ · {portfolio.positions_reported} lignes"
        )
        print(f"    palmarès : {manager.track_record}")
        print(f"    thèse : {manager.thesis}\n")

    print(f"{len(excluded)} gérants analysés mais exclus du signal :\n")
    for portfolio in excluded:
        manager = universe.manager_of(portfolio)
        print(f"  {manager.name} — {manager.firm} ({portfolio.quarter})")
        print(f"    motif d'exclusion : {manager.exclusion_reason}\n")


def cmd_analyse(universe: Universe, _: argparse.Namespace) -> None:
    print(_title("1. CONCENTRATION DES PORTEFEUILLES"))
    print(
        "\n  Le « nombre effectif de lignes » (inverse de l'indice Herfindahl) dit\n"
        "  combien de paris réels un gérant porte, quel que soit le nombre de lignes.\n"
    )
    print(f"  {'gérant':<28}{'lignes':>7}{'top 1':>8}{'top 5':>8}{'effectif':>10}  profil")
    for stats in concentration(universe):
        print(
            f"  {stats.manager.firm[:27]:<28}{stats.encoded_positions:>7}"
            f"{stats.top1:>7.1f}%{stats.top5:>7.1f}%{stats.effective_positions:>10.1f}"
            f"  {stats.label}"
        )

    print(_title("2. CE QUE LES GÉRANTS DÉTIENNENT EN COMMUN"))
    rows = [r for r in consensus_table(universe) if r.holder_count >= 2]
    print(f"\n  {'titre':<8}{'détenteurs':>11}{'poids max':>11}{'poids moyen':>13}  styles représentés")
    for row in rows[:15]:
        print(
            f"  {row.ticker:<8}{row.holder_count:>11}{row.max_weight:>10.1f}%"
            f"{row.mean_weight:>12.1f}%  {', '.join(row.styles)}"
        )

    print(_title("3. RECOUVREMENT ENTRE GÉRANTS (capital engagé sur les mêmes titres)"))
    overlaps = sorted(overlap_matrix(universe).items(), key=lambda kv: -kv[1])
    seen: set[frozenset[str]] = set()
    print()
    for (a, b), value in overlaps:
        pair = frozenset({a, b})
        if pair in seen or value <= 0:
            continue
        seen.add(pair)
        if len(seen) > 10:
            break
        print(
            f"  {universe.managers[a].firm[:24]:<25} ↔ "
            f"{universe.managers[b].firm[:24]:<25} {value:>6.1f} %"
        )

    print(_title("4. LES PARIS MACRO SOUS-JACENTS (moyenne des gérants retenus)"))
    print()
    for exposure in aggregate_macro_exposure(universe):
        bar = "█" * max(1, int(exposure.weight / 2))
        print(f"  {exposure.label:<32}{exposure.weight:>6.1f} %  {bar}")
        print(f"      {', '.join(exposure.tickers[:8])}")

    print(_title("5. LE PARI DOMINANT, GÉRANT PAR GÉRANT"))
    print()
    for portfolio in universe.signal_portfolios():
        exposures = macro_exposure(universe, portfolio)
        if not exposures:
            continue
        top = exposures[0]
        share = 100 * top.weight / portfolio.covered_weight if portfolio.covered_weight else 0
        print(
            f"  {universe.manager_of(portfolio).firm[:26]:<28} "
            f"{top.label:<32} {share:>5.0f} % du portefeuille encodé"
        )


def cmd_pourquoi(universe: Universe, args: argparse.Namespace) -> None:
    explanation = explain(universe, args.ticker)
    print(_title(f"POURQUOI {explanation.ticker} ? — {explanation.name}"))
    print(f"\n  secteur : {explanation.sector} · thème : {explanation.theme}\n")

    if explanation.thesis:
        print(f"  Thèse    : {explanation.thesis.summary}")
        print(f"  Moteur   : {explanation.thesis.driver}")
        print(f"  Risque   : {explanation.thesis.risk}\n")
    else:
        print("  Aucune thèse documentée pour ce titre dans la base.\n")

    if not explanation.holders:
        print("  Aucun gérant suivi ne détient ce titre.")
        return

    print(f"  Détenu par {explanation.holder_count()} gérant(s) suivis :\n")
    for name, weight, action, style in explanation.holders:
        label = {
            "new": "ouverture", "add": "renforcement", "hold": "inchangé",
            "trim": "allègement", "exit": "sortie totale",
        }[action]
        print(f"    {name:<32}{weight:>6.1f} %   {label:<14}({style})")


def cmd_score(universe: Universe, args: argparse.Namespace) -> None:
    scored = score_universe(universe, ScoringConfig())
    retained = eligible_assets(scored)

    print(_title("CLASSEMENT DES TITRES"))
    print(
        "\n  Score = 0,35 conviction + 0,25 consensus + 0,15 diversité de styles\n"
        "        + 0,20 flux du trimestre + 0,05 persistance (facteurs centrés-réduits).\n"
    )
    print(
        f"  {'#':<4}{'titre':<8}{'score':>7}{'dét.':>6}{'convic.':>9}{'flux':>8}"
        f"{'styles':>8}  facteur dominant"
    )
    for i, asset in enumerate(retained[: args.top], start=1):
        print(
            f"  {i:<4}{asset.ticker:<8}{asset.score:>7.2f}{asset.holder_count:>6}"
            f"{asset.factors['conviction']:>8.1f}%{asset.factors['flux']:>8.2f}"
            f"{int(asset.factors['diversité_styles']):>8}  {asset.top_reason()}"
        )

    rejected = [s for s in scored if not s.eligible]
    if rejected:
        print(f"\n  Écartés ({len(rejected)}) :")
        for asset in rejected:
            print(f"    {asset.ticker:<8}{asset.rejection}")


def _print_portfolio(target: TargetPortfolio) -> None:
    print(
        f"\n  {'titre':<8}{'poids':>8}{'score':>8}{'dét.':>6}  {'secteur':<22}raison principale"
    )
    for position in target.positions:
        print(
            f"  {position.ticker:<8}{position.weight_pct:>7.1f}%{position.score:>8.2f}"
            f"{position.holder_count:>6}  {position.sector:<22}{position.reason}"
        )
    print(f"  {'LIQUIDITÉS':<8}{target.cash_weight * 100:>7.1f}%")

    print("\n  Contrôle du risque")
    print(f"    volatilité estimée avant mise à l'échelle : {target.unlevered_vol:.1%}")
    print(
        f"    exposition retenue : {target.gross_exposure:.0%} "
        f"→ volatilité cible {target.expected_vol:.1%} (objectif {target.config.target_vol:.0%})"
    )
    print(f"    ratio de diversification : {target.diversification:.2f}")
    print(f"    plafonds : {target.config.max_position:.0%} par ligne, "
          f"{target.config.max_sector:.0%} par secteur, {target.config.max_bucket:.0%} par macro-pari")

    print("\n  Exposition par macro-pari")
    for label, weight in target.bucket_exposures().items():
        print(f"    {label:<34}{weight * 100:>6.1f} %")

    for warning in target.warnings:
        print(f"\n  ⚠ {warning}")


def cmd_portefeuille(universe: Universe, args: argparse.Namespace) -> None:
    scored = score_universe(universe, ScoringConfig())
    risk = RiskConfig(target_vol=args.vol_cible, max_position=args.poids_max)
    target = build_target_portfolio(
        universe, scored, risk_config=risk, n_positions=args.lignes
    )
    quarter = latest_quarter(p.quarter for p in universe.signal_portfolios())

    print(_title(f"PORTEFEUILLE CIBLE — dépôts {quarter}"))
    print(
        f"\n  Date d'exécution la plus tôt possible : {rebalance_date(quarter)} "
        "(fin de trimestre + 45 jours)"
    )
    _print_portfolio(target)


def cmd_simuler(universe: Universe, args: argparse.Namespace) -> None:
    scored = score_universe(universe, ScoringConfig())
    risk = RiskConfig(target_vol=args.vol_cible, max_position=args.poids_max)
    target = build_target_portfolio(universe, scored, risk_config=risk, n_positions=args.lignes)

    model = MarketModel(alpha_annual=args.alpha)
    result = simulate_forward(
        universe,
        target,
        model=model,
        config=SimulationConfig(horizon_days=args.horizon, paths=args.trajectoires),
    )

    print(_title("SIMULATION PROSPECTIVE — RÉSULTATS SUR DONNÉES SIMULÉES"))
    print(
        "\n  ⚠ Ces chiffres ne proviennent PAS du marché réel. Ils décrivent le\n"
        "    comportement du portefeuille sous un modèle explicite (marché à "
        f"{model.market_drift:.0%} de\n    dérive, {model.market_vol:.0%} de volatilité). "
        "Ils servent à mesurer un risque, pas à prévoir un gain.\n"
    )
    print(result.render())
    print(
        "\n  Lecture : même avec un portefeuille bien construit, une part\n"
        "  significative des trajectoires est perdante. C'est la réponse honnête\n"
        "  à la question « comment garantir un gain ? » : on ne peut pas."
    )


def cmd_backtest(universe: Universe, args: argparse.Namespace) -> None:
    history = load_prices_csv(Path(args.prix))
    universe = measure_risk(history, universe, benchmark=args.indice)

    scored = score_universe(universe, ScoringConfig())
    risk = RiskConfig(target_vol=args.vol_cible, max_position=args.poids_max)
    target = build_target_portfolio(universe, scored, risk_config=risk, n_positions=args.lignes)
    quarter = latest_quarter(p.quarter for p in universe.signal_portfolios())

    result = run_backtest(
        universe,
        {quarter: target.weights()},
        history,
        config=BacktestConfig(benchmark=args.indice, cost_bps=args.frais),
        risk_config=risk,
    )
    print(_title("BACKTEST SUR DONNÉES DE PRIX RÉELLES"))
    print(
        "\n  Volatilités et bêtas mesurés sur l'historique fourni. Achat au plus tôt\n"
        "  à la date de publication du dépôt, frais de transaction inclus.\n"
    )
    print(result.render())


def cmd_export(universe: Universe, args: argparse.Namespace) -> None:
    path = export_holdings_csv(universe, Path(args.sortie))
    lines = sum(len(p.holdings) for p in universe.portfolios)
    print(f"{lines} lignes de portefeuille écrites dans {path}")


# ---------------------------------------------------------------------------
# Point d'entrée
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="superinvestors",
        description="Analyse des portefeuilles des grands gérants et algorithme de réplication sélective.",
        epilog=AVERTISSEMENT,
    )
    subparsers = parser.add_subparsers(dest="commande", required=True)

    def add_portfolio_options(sub: argparse.ArgumentParser) -> None:
        sub.add_argument("--lignes", type=int, default=15, help="nombre de positions (défaut : 15)")
        sub.add_argument("--vol-cible", type=float, default=0.12,
                         help="volatilité annualisée visée (défaut : 0.12)")
        sub.add_argument("--poids-max", type=float, default=0.10,
                         help="poids maximal d'une ligne (défaut : 0.10)")

    subparsers.add_parser("gerants", help="qui est suivi, qui est exclu et pourquoi")
    subparsers.add_parser("analyse", help="concentration, consensus, recouvrements, paris macro")

    pourquoi = subparsers.add_parser("pourquoi", help="thèse et détenteurs d'un titre")
    pourquoi.add_argument("ticker", help="symbole, par exemple GOOGL")

    score = subparsers.add_parser("score", help="classement des titres par le moteur")
    score.add_argument("--top", type=int, default=20, help="nombre de lignes affichées")

    add_portfolio_options(subparsers.add_parser("portefeuille", help="portefeuille cible"))

    simuler = subparsers.add_parser("simuler", help="distribution des résultats possibles")
    add_portfolio_options(simuler)
    simuler.add_argument("--horizon", type=int, default=252, help="jours de bourse simulés")
    simuler.add_argument("--trajectoires", type=int, default=1000, help="nombre de trajectoires")
    simuler.add_argument("--alpha", type=float, default=0.0,
                         help="alpha annuel supposé (défaut : 0, aucune hypothèse de surperformance)")

    backtest = subparsers.add_parser("backtest", help="backtest sur vos propres données de prix")
    add_portfolio_options(backtest)
    backtest.add_argument("--prix", required=True, help="CSV date,ticker,close")
    backtest.add_argument("--indice", default="SPY", help="ticker de l'indice de référence")
    backtest.add_argument("--frais", type=float, default=10.0, help="frais en points de base")

    export = subparsers.add_parser("export", help="exporter les positions en CSV")
    export.add_argument("--sortie", default="positions_13f.csv")

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    universe = load_universe()

    commands = {
        "gerants": cmd_gerants,
        "analyse": cmd_analyse,
        "pourquoi": cmd_pourquoi,
        "score": cmd_score,
        "portefeuille": cmd_portefeuille,
        "simuler": cmd_simuler,
        "backtest": cmd_backtest,
        "export": cmd_export,
    }
    try:
        commands[args.commande](universe, args)
    except (ValueError, KeyError, FileNotFoundError) as error:
        print(f"Erreur : {error}", file=sys.stderr)
        return 1

    if args.commande in {"portefeuille", "simuler", "backtest", "score"}:
        print(f"\n{RULE}\n{AVERTISSEMENT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
