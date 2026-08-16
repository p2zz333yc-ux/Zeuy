"""Statistiques descriptives : concentration, chevauchement, consensus."""

from __future__ import annotations

from dataclasses import dataclass

from ..common import effective_positions, herfindahl
from ..data.models import Manager, Portfolio, Universe


@dataclass(frozen=True)
class ConcentrationStats:
    """À quel point un gérant met-il ses œufs dans le même panier ?"""

    manager: Manager
    portfolio: Portfolio
    encoded_positions: int
    covered_weight: float
    top1: float
    top5: float
    hhi: float
    effective_positions: float

    @property
    def label(self) -> str:
        if self.effective_positions < 5:
            return "concentration extrême"
        if self.effective_positions < 12:
            return "concentré"
        if self.effective_positions < 30:
            return "diversifié"
        return "très dispersé"


def concentration(universe: Universe) -> list[ConcentrationStats]:
    """Mesure la concentration de chaque portefeuille, du plus concentré au moins."""
    stats: list[ConcentrationStats] = []
    for portfolio in universe.portfolios:
        weights = sorted((h.weight_pct for h in portfolio.active), reverse=True)
        if not weights:
            continue
        stats.append(
            ConcentrationStats(
                manager=universe.manager_of(portfolio),
                portfolio=portfolio,
                encoded_positions=len(weights),
                covered_weight=sum(weights),
                top1=weights[0],
                top5=sum(weights[:5]),
                hhi=herfindahl(weights),
                effective_positions=effective_positions(weights),
            )
        )
    return sorted(stats, key=lambda s: s.effective_positions)


def weighted_overlap(left: Portfolio, right: Portfolio) -> float:
    """Recouvrement pondéré entre deux portefeuilles, en points de pourcentage.

    Somme des poids communs (minimum ligne à ligne) : combien de capital les
    deux gérants engagent-ils exactement sur les mêmes titres.
    """
    right_weights = {h.ticker: h.weight_pct for h in right.active}
    return sum(
        min(h.weight_pct, right_weights.get(h.ticker, 0.0)) for h in left.active
    )


def overlap_matrix(universe: Universe, *, signal_only: bool = True) -> dict[tuple[str, str], float]:
    """Matrice de recouvrement pondéré entre tous les gérants."""
    portfolios = universe.signal_portfolios() if signal_only else universe.portfolios
    return {
        (a.manager_key, b.manager_key): weighted_overlap(a, b)
        for a in portfolios
        for b in portfolios
        if a.manager_key != b.manager_key
    }


@dataclass(frozen=True)
class ConsensusRow:
    """Une ligne de la table de consensus : qui détient quoi."""

    ticker: str
    holders: tuple[str, ...]       # clés de gérants (positions actives)
    buyers: tuple[str, ...]        # gérants qui ont ouvert ou renforcé
    sellers: tuple[str, ...]       # gérants qui ont allégé ou soldé
    styles: tuple[str, ...]
    max_weight: float
    mean_weight: float

    @property
    def holder_count(self) -> int:
        return len(self.holders)


def consensus_table(universe: Universe, *, signal_only: bool = True) -> list[ConsensusRow]:
    """Agrège les détentions par titre, triées par nombre de détenteurs."""
    portfolios = universe.signal_portfolios() if signal_only else universe.portfolios
    holders: dict[str, list[str]] = {}
    buyers: dict[str, list[str]] = {}
    sellers: dict[str, list[str]] = {}
    styles: dict[str, list[str]] = {}
    weights: dict[str, list[float]] = {}

    for portfolio in portfolios:
        manager = universe.manager_of(portfolio)
        for holding in portfolio.holdings:
            ticker = holding.ticker
            if holding.action.flow_score > 0:
                buyers.setdefault(ticker, []).append(manager.key)
            elif holding.action.flow_score < 0:
                sellers.setdefault(ticker, []).append(manager.key)
            if holding.weight_pct <= 0:
                continue
            holders.setdefault(ticker, []).append(manager.key)
            weights.setdefault(ticker, []).append(holding.weight_pct)
            style = manager.style.value
            if style not in styles.setdefault(ticker, []):
                styles[ticker].append(style)

    rows = [
        ConsensusRow(
            ticker=ticker,
            holders=tuple(names),
            buyers=tuple(buyers.get(ticker, ())),
            sellers=tuple(sellers.get(ticker, ())),
            styles=tuple(styles.get(ticker, ())),
            max_weight=max(weights[ticker]),
            mean_weight=sum(weights[ticker]) / len(weights[ticker]),
        )
        for ticker, names in holders.items()
    ]
    return sorted(rows, key=lambda r: (-r.holder_count, -r.max_weight))
