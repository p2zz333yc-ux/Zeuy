"""Construction et validation de l'univers, import/export CSV."""

from __future__ import annotations

import csv
from pathlib import Path

from .holdings import PORTFOLIOS
from .managers import MANAGERS
from .models import Action, Confidence, Holding, Portfolio, Universe
from .universe import ASSETS


def load_universe() -> Universe:
    """Univers par défaut : gérants + dépôts 13F encodés + caractéristiques titres."""
    universe = Universe(managers=dict(MANAGERS), portfolios=PORTFOLIOS, assets=dict(ASSETS))
    validate(universe)
    return universe


def validate(universe: Universe) -> None:
    """Vérifie la cohérence de l'univers avant tout calcul.

    Une erreur de données silencieuse est plus coûteuse qu'un plantage : on
    échoue vite et fort.
    """
    problems: list[str] = []

    for portfolio in universe.portfolios:
        if portfolio.manager_key not in universe.managers:
            problems.append(f"portefeuille orphelin : gérant {portfolio.manager_key} inconnu")
        for holding in portfolio.holdings:
            if holding.ticker not in universe.assets:
                problems.append(
                    f"{portfolio.manager_key}/{holding.ticker} : titre absent de universe.py"
                )
        covered = portfolio.covered_weight
        if covered > 100.5:
            problems.append(
                f"{portfolio.manager_key} : les poids encodés totalisent {covered:.1f} % (> 100 %)"
            )

    seen: set[tuple[str, str]] = set()
    for portfolio in universe.portfolios:
        key = (portfolio.manager_key, portfolio.quarter)
        if key in seen:
            problems.append(f"doublon : {key[0]} apparaît deux fois pour {key[1]}")
        seen.add(key)

    if problems:
        raise ValueError("Univers incohérent :\n  - " + "\n  - ".join(problems))


def export_holdings_csv(universe: Universe, path: Path) -> Path:
    """Écrit toutes les lignes de portefeuille dans un CSV auditable."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "manager", "firm", "quarter", "filed_on", "ticker", "name",
                "sector", "theme", "weight_pct", "action", "confidence",
                "in_signal", "source",
            ]
        )
        for portfolio in universe.portfolios:
            manager = universe.manager_of(portfolio)
            for holding in portfolio.holdings:
                asset = universe.assets[holding.ticker]
                writer.writerow(
                    [
                        manager.name, manager.firm, portfolio.quarter,
                        portfolio.filed_on or "", holding.ticker, asset.name,
                        asset.sector, asset.theme, f"{holding.weight_pct:.2f}",
                        holding.action.value, holding.confidence.value,
                        "oui" if manager.include_in_signal else "non",
                        portfolio.source,
                    ]
                )
    return path


def import_holdings_csv(path: Path, universe: Universe) -> tuple[Portfolio, ...]:
    """Relit un CSV au format produit par :func:`export_holdings_csv`.

    Permet de brancher ses propres données (extraction EDGAR, agrégateur
    payant, portefeuille personnel) sans toucher au code.
    """
    grouped: dict[tuple[str, str], list[Holding]] = {}
    meta: dict[tuple[str, str], tuple[str | None, str]] = {}
    key_by_name = {m.name: k for k, m in universe.managers.items()}
    key_by_firm = {m.firm: k for k, m in universe.managers.items()}

    with path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            manager_key = (
                key_by_name.get(row["manager"])
                or key_by_firm.get(row.get("firm", ""))
                or row["manager"]
            )
            key = (manager_key, row["quarter"])
            grouped.setdefault(key, []).append(
                Holding(
                    ticker=row["ticker"].upper(),
                    weight_pct=float(row["weight_pct"]),
                    action=Action(row.get("action", "hold")),
                    confidence=Confidence(row.get("confidence", "reported")),
                )
            )
            meta[key] = (row.get("filed_on") or None, row.get("source", ""))

    return tuple(
        Portfolio(
            manager_key=manager_key,
            quarter=quarter,
            filed_on=meta[(manager_key, quarter)][0],
            total_value_usd=0.0,
            positions_reported=len(holdings),
            holdings=tuple(holdings),
            source=meta[(manager_key, quarter)][1],
        )
        for (manager_key, quarter), holdings in grouped.items()
    )
