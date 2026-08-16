"""Analyse des portefeuilles des grands gérants et algorithme de réplication sélective.

Point d'entrée rapide :

    from superinvestors import load_universe, score_universe, build_target_portfolio

    universe = load_universe()
    scores = score_universe(universe)
    cible = build_target_portfolio(universe, scores)

Aucune dépendance externe. Aucune promesse de gain : voir ``AVERTISSEMENT``.
"""

from __future__ import annotations

from .algo.backtest import run_backtest, simulate_forward
from .algo.portfolio import build_target_portfolio
from .algo.risk import RiskConfig
from .algo.scoring import ScoringConfig, score_universe
from .data.loader import load_universe

AVERTISSEMENT = (
    "Aucun algorithme ne peut garantir un gain sur les marchés actions. Ce code "
    "produit un classement, un dimensionnement du risque et une distribution de "
    "résultats possibles — pas une promesse. Il est fourni à titre d'analyse et "
    "d'outil de recherche, ne constitue pas un conseil en investissement, et son "
    "usage relève de la seule responsabilité de l'utilisateur."
)

__all__ = [
    "AVERTISSEMENT",
    "RiskConfig",
    "ScoringConfig",
    "build_target_portfolio",
    "load_universe",
    "run_backtest",
    "score_universe",
    "simulate_forward",
]
