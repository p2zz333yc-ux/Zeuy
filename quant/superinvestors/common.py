"""Utilitaires transverses : trimestres et statistiques élémentaires.

Aucune dépendance externe : le paquet doit tourner avec l'interpréteur
Python standard, sans installation.
"""

from __future__ import annotations

import math
import re
from collections.abc import Iterable, Sequence

_QUARTER_RE = re.compile(r"^(\d{4})Q([1-4])$")

# Un 13F doit être déposé au plus tard 45 jours après la fin du trimestre.
FILING_LAG_DAYS = 45


def quarter_index(quarter: str) -> int:
    """Convertit ``"2026Q2"`` en un entier monotone (utile pour comparer)."""
    match = _QUARTER_RE.match(quarter)
    if not match:
        raise ValueError(f"Trimestre invalide : {quarter!r} (format attendu : 2026Q2)")
    year, q = int(match.group(1)), int(match.group(2))
    return year * 4 + (q - 1)


def quarter_lag(reference: str, quarter: str) -> int:
    """Nombre de trimestres d'ancienneté de ``quarter`` par rapport à ``reference``."""
    return quarter_index(reference) - quarter_index(quarter)


def latest_quarter(quarters: Iterable[str]) -> str:
    """Trimestre le plus récent d'une série."""
    items = list(quarters)
    if not items:
        raise ValueError("aucun trimestre fourni")
    return max(items, key=quarter_index)


def quarter_end(quarter: str) -> tuple[int, int, int]:
    """Date de fin du trimestre sous forme ``(année, mois, jour)``."""
    match = _QUARTER_RE.match(quarter)
    if not match:
        raise ValueError(f"Trimestre invalide : {quarter!r}")
    year, q = int(match.group(1)), int(match.group(2))
    month, day = {1: (3, 31), 2: (6, 30), 3: (9, 30), 4: (12, 31)}[q]
    return year, month, day


def mean(values: Sequence[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def stdev(values: Sequence[float], *, sample: bool = True) -> float:
    """Écart-type ; renvoie 0 si l'échantillon est trop petit ou constant."""
    n = len(values)
    if n < 2:
        return 0.0
    mu = mean(values)
    denom = n - 1 if sample else n
    return math.sqrt(sum((v - mu) ** 2 for v in values) / denom)


def zscore(values: Sequence[float]) -> list[float]:
    """Centre-réduit une série. Une série constante devient une série de zéros."""
    sigma = stdev(values, sample=False)
    if sigma == 0.0:
        return [0.0] * len(values)
    mu = mean(values)
    return [(v - mu) / sigma for v in values]


def zscore_map(values: dict[str, float]) -> dict[str, float]:
    """Version dictionnaire de :func:`zscore`, l'ordre des clés est préservé."""
    keys = list(values)
    scores = zscore([values[k] for k in keys])
    return dict(zip(keys, scores, strict=True))


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def herfindahl(weights: Sequence[float]) -> float:
    """Indice de Herfindahl-Hirschman sur des poids en pourcentage.

    Renvoie une valeur dans [0, 1] : 1 = tout dans une seule ligne,
    ~0 = parfaitement dispersé. Les poids sont normalisés au préalable.
    """
    total = sum(weights)
    if total <= 0:
        return 0.0
    return sum((w / total) ** 2 for w in weights)


def effective_positions(weights: Sequence[float]) -> float:
    """Nombre effectif de lignes (inverse du HHI) : la diversification réelle."""
    hhi = herfindahl(weights)
    return 1.0 / hhi if hhi > 0 else 0.0
