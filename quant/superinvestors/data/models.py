"""Modèles de données pour les portefeuilles 13F des grands gérants.

Un formulaire 13F-HR est une photographie trimestrielle des positions
*longues* en actions américaines d'un gérant qui dépasse 100 M$ d'actifs.
Ce module décrit cette photographie sans rien y ajouter : chaque position
porte la trace de sa source et de son niveau de fiabilité.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class Action(str, Enum):
    """Mouvement du gérant sur la position pendant le trimestre."""

    NEW = "new"       # ouverture de position
    ADD = "add"       # renforcement
    HOLD = "hold"     # inchangé
    TRIM = "trim"     # allègement
    EXIT = "exit"     # sortie totale (poids nul au 30/06)

    @property
    def flow_score(self) -> float:
        """Score de flux dans [-1, 1] : le sens de l'acte du gérant."""
        return {
            Action.NEW: 1.0,
            Action.ADD: 0.5,
            Action.HOLD: 0.0,
            Action.TRIM: -0.5,
            Action.EXIT: -1.0,
        }[self]


class Confidence(str, Enum):
    """Fiabilité du chiffre de pondération encodé."""

    REPORTED = "reported"    # publié tel quel dans le 13F ou un agrégateur
    ESTIMATED = "estimated"  # reconstitué (trimestre précédent, presse) — à traiter avec prudence


class Style(str, Enum):
    """Famille de raisonnement d'investissement du gérant."""

    QUALITY_COMPOUNDER = "quality_compounder"  # franchises à rendement du capital élevé
    DEEP_VALUE = "deep_value"                  # décote sur actif, marge de sécurité
    ACTIVIST = "activist"                      # prise de participation + influence sur la gouvernance
    GLOBAL_MACRO = "global_macro"              # vue top-down taux/devises/cycle
    GROWTH = "growth"                          # croissance séculaire, technologie
    EVENT_DRIVEN = "event_driven"              # fusions, scissions, restructurations
    QUANT = "quant"                            # signaux statistiques, rotation très rapide
    CONTROL = "control"                        # positions de contrôle dans des sociétés affiliées


class Horizon(str, Enum):
    """Durée de détention typique — critère central d'éligibilité au signal.

    La littérature (Angelini, Iqbal & Jivraj, *Systematic 13F Hedge Fund
    Alpha*) montre que l'alpha réplicable ne survit au décalage de 45 jours
    que chez les gérants à horizon long. Copier un quant à rotation
    quotidienne revient à acheter une position déjà soldée.
    """

    LONG = "long"              # > 2 ans
    MEDIUM = "medium"          # 2 à 8 trimestres
    SHORT = "short"            # < 2 trimestres
    ULTRA_SHORT = "ultra_short"  # intra-trimestre, souvent intra-journée


@dataclass(frozen=True)
class Manager:
    """Métadonnées d'un gérant : qui il est, comment il pense, et s'il est copiable."""

    key: str
    name: str
    firm: str
    cik: str | None
    style: Style
    horizon: Horizon
    track_record: str
    thesis: str
    quality: float                      # poids de confiance dans [0, 1]
    include_in_signal: bool = True
    exclusion_reason: str | None = None
    sources: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        if not 0.0 <= self.quality <= 1.0:
            raise ValueError(f"{self.key}: quality doit être dans [0, 1], reçu {self.quality}")
        if not self.include_in_signal and not self.exclusion_reason:
            raise ValueError(f"{self.key}: une exclusion doit être motivée")


@dataclass(frozen=True)
class Holding:
    """Une ligne de portefeuille."""

    ticker: str
    weight_pct: float
    action: Action = Action.HOLD
    confidence: Confidence = Confidence.REPORTED
    note: str | None = None

    def __post_init__(self) -> None:
        if self.weight_pct < 0:
            raise ValueError(f"{self.ticker}: pondération négative ({self.weight_pct})")
        if self.action is Action.EXIT and self.weight_pct != 0:
            raise ValueError(f"{self.ticker}: une sortie doit avoir une pondération nulle")


@dataclass(frozen=True)
class Portfolio:
    """Photographie 13F d'un gérant pour un trimestre donné."""

    manager_key: str
    quarter: str                  # ex. "2026Q2"
    filed_on: str | None          # date de dépôt SEC (ISO)
    total_value_usd: float        # valeur déclarée du portefeuille 13F
    positions_reported: int       # nombre de lignes du dépôt complet
    holdings: tuple[Holding, ...]
    source: str = ""

    @property
    def active(self) -> tuple[Holding, ...]:
        """Positions encore détenues à la date de photo (hors sorties)."""
        return tuple(h for h in self.holdings if h.action is not Action.EXIT)

    @property
    def covered_weight(self) -> float:
        """Part du portefeuille couverte par les lignes encodées ici.

        Nous n'encodons que les principales positions et les mouvements
        notables : ce ratio dit honnêtement ce que l'on voit du portefeuille.
        """
        return sum(h.weight_pct for h in self.active)

    def weight_of(self, ticker: str) -> float:
        for h in self.active:
            if h.ticker == ticker:
                return h.weight_pct
        return 0.0


@dataclass(frozen=True)
class Asset:
    """Caractéristiques d'un titre utilisées par le modèle de risque."""

    ticker: str
    name: str
    sector: str
    theme: str
    vol: float    # volatilité annualisée estimée
    beta: float   # sensibilité au marché estimée

    def __post_init__(self) -> None:
        if self.vol <= 0:
            raise ValueError(f"{self.ticker}: volatilité doit être > 0")


@dataclass
class Universe:
    """Ensemble cohérent gérants + portefeuilles + caractéristiques de titres."""

    managers: dict[str, Manager] = field(default_factory=dict)
    portfolios: tuple[Portfolio, ...] = ()
    assets: dict[str, Asset] = field(default_factory=dict)

    def signal_portfolios(self) -> tuple[Portfolio, ...]:
        """Portefeuilles des gérants retenus pour le signal."""
        return tuple(
            p for p in self.portfolios
            if self.managers[p.manager_key].include_in_signal
        )

    def manager_of(self, portfolio: Portfolio) -> Manager:
        return self.managers[portfolio.manager_key]

    def asset(self, ticker: str) -> Asset:
        if ticker not in self.assets:
            raise KeyError(
                f"{ticker} absent de l'univers : ajoutez-le dans data/universe.py"
            )
        return self.assets[ticker]

    def tickers(self) -> tuple[str, ...]:
        seen: list[str] = []
        for p in self.portfolios:
            for h in p.holdings:
                if h.ticker not in seen:
                    seen.append(h.ticker)
        return tuple(seen)
