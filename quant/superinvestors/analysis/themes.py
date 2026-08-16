"""Exposition thématique et sectorielle des gérants.

Un portefeuille de dix lignes qui semble diversifié peut en réalité porter
un seul pari. Ce module traduit les titres en expositions économiques.
"""

from __future__ import annotations

from dataclasses import dataclass

from ..data.models import Portfolio, Universe

# Regroupement des thèmes fins en macro-paris : c'est à ce niveau que le
# risque de corrélation se matérialise réellement.
MACRO_BUCKETS: dict[str, str] = {
    "infrastructure_ia": "chaîne de valeur IA",
    "semis_industriels": "chaîne de valeur IA",
    "cloud_ia": "chaîne de valeur IA",
    "logiciel_ia": "chaîne de valeur IA",
    "publicite_ia": "chaîne de valeur IA",
    "plateforme_grand_public": "plateformes établies",
    "streaming": "plateformes établies",
    "logiciel": "plateformes établies",
    "integration_it": "plateformes établies",
    "cybersecurite": "plateformes établies",
    "peage_paiements": "péages financiers",
    "oligopole_donnees": "péages financiers",
    "infrastructure_marche": "péages financiers",
    "credit_premium": "crédit et banque",
    "banque_universelle": "crédit et banque",
    "credit_consommation": "crédit et banque",
    "banque_digitale_latam": "crédit et banque",
    "assurance_float": "assurance",
    "assurance_decote": "assurance",
    "courtage_assurance": "assurance",
    "energie_integree": "énergie et matières",
    "petrole_schiste": "énergie et matières",
    "raffinage": "énergie et matières",
    "services_petroliers": "énergie et matières",
    "charbon": "énergie et matières",
    "engrais": "énergie et matières",
    "or": "énergie et matières",
    "ingredients": "énergie et matières",
    "obesite_glp1": "santé",
    "diagnostic_genomique": "santé",
    "biotech_pulmonaire": "santé",
    "assurance_sante": "santé",
    "pharma_large": "santé",
    "dialyse": "santé",
    "marque_mondiale": "consommation",
    "marque_alimentaire": "consommation",
    "distribution_alimentaire": "consommation",
    "distribution_pieces": "consommation",
    "franchise_restauration": "consommation",
    "distribution_decote": "consommation",
    "voyage_loisirs": "consommation",
    "plateforme_mobilite": "consommation",
    "transport_aerien": "consommation",
    "construction_residentielle": "cycle réel et infrastructure",
    "infrastructure_construction": "cycle réel et infrastructure",
    "distribution_batiment": "cycle réel et infrastructure",
    "ingenierie_construction": "cycle réel et infrastructure",
    "aeronautique_apres_vente": "cycle réel et infrastructure",
    "electrification": "cycle réel et infrastructure",
    "rail_amerique_nord": "cycle réel et infrastructure",
    "services_reseaux": "cycle réel et infrastructure",
    "actifs_reels": "cycle réel et infrastructure",
    "utility_restructuree": "cycle réel et infrastructure",
    "media_operations_ma": "médias et situations spéciales",
    "media_abonnement": "médias et situations spéciales",
    "telecom_decote_actifs": "médias et situations spéciales",
    "plateforme_immobilier": "médias et situations spéciales",
    "vehicule_gerant": "véhicules et indices",
    "beta_marche": "véhicules et indices",
    "beta_pays": "véhicules et indices",
    "bitcoin": "actifs alternatifs",
}


def macro_bucket(theme: str) -> str:
    return MACRO_BUCKETS.get(theme, "autre")


@dataclass(frozen=True)
class Exposure:
    """Poids d'une catégorie dans un portefeuille (en % du portefeuille encodé)."""

    label: str
    weight: float
    tickers: tuple[str, ...]


def _exposures(universe: Universe, portfolio: Portfolio, key: str) -> list[Exposure]:
    buckets: dict[str, list[tuple[str, float]]] = {}
    for holding in portfolio.active:
        asset = universe.asset(holding.ticker)
        label = {
            "sector": asset.sector,
            "theme": asset.theme,
            "macro": macro_bucket(asset.theme),
        }[key]
        buckets.setdefault(label, []).append((holding.ticker, holding.weight_pct))

    return sorted(
        (
            Exposure(
                label=label,
                weight=sum(w for _, w in items),
                tickers=tuple(t for t, _ in sorted(items, key=lambda i: -i[1])),
            )
            for label, items in buckets.items()
        ),
        key=lambda e: -e.weight,
    )


def sector_exposure(universe: Universe, portfolio: Portfolio) -> list[Exposure]:
    return _exposures(universe, portfolio, "sector")


def macro_exposure(universe: Universe, portfolio: Portfolio) -> list[Exposure]:
    """Exposition aux macro-paris : la vue qui révèle les corrélations cachées."""
    return _exposures(universe, portfolio, "macro")


def aggregate_macro_exposure(universe: Universe, *, signal_only: bool = True) -> list[Exposure]:
    """Exposition macro moyenne de l'ensemble des gérants retenus.

    Chaque gérant compte pour un, quelle que soit sa taille : on mesure un
    consensus d'opinions, pas un consensus de capitaux.
    """
    portfolios = universe.signal_portfolios() if signal_only else universe.portfolios
    if not portfolios:
        return []

    totals: dict[str, float] = {}
    tickers: dict[str, list[str]] = {}
    for portfolio in portfolios:
        covered = portfolio.covered_weight or 1.0
        for exposure in macro_exposure(universe, portfolio):
            # normalisé sur la part encodée pour comparer des portefeuilles
            # dont la couverture diffère
            totals[exposure.label] = totals.get(exposure.label, 0.0) + (
                100.0 * exposure.weight / covered / len(portfolios)
            )
            for ticker in exposure.tickers:
                if ticker not in tickers.setdefault(exposure.label, []):
                    tickers[exposure.label].append(ticker)

    return sorted(
        (Exposure(label, weight, tuple(tickers[label])) for label, weight in totals.items()),
        key=lambda e: -e.weight,
    )
