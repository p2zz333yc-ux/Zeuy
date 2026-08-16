"""Photographies 13F encodées à la main, avec leurs sources.

Portée : dépôts du T2 2026 (échéance SEC du 14 août 2026) lorsqu'ils sont
disponibles, sinon le dernier dépôt publié — le trimestre est indiqué sur
chaque portefeuille et le moteur applique une décote de fraîcheur.

Deux niveaux de fiabilité coexistent :

* ``Confidence.REPORTED``  — le pourcentage vient directement d'un dépôt ou
  d'un agrégateur qui le publie.
* ``Confidence.ESTIMATED`` — le pourcentage est reconstitué (montant en
  dollars rapporté à la taille du portefeuille, ou report du trimestre
  précédent). Il est utilisable pour le classement, pas pour un rapport
  réglementaire.

Nous n'encodons pas les 3 763 lignes de Renaissance ni les 993 de
Bridgewater : seules les principales positions et les mouvements notables
figurent ici. ``Portfolio.covered_weight`` mesure ce que l'on voit
réellement de chaque portefeuille.
"""

from __future__ import annotations

from .models import Action, Confidence, Holding, Portfolio

_EST = Confidence.ESTIMATED
_DERIVED = "poids reconstitué à partir du montant publié"
_CARRIED = "poids reporté du trimestre précédent, non republié"
_FLOOR = "poids non publié — estimation plancher"

PORTFOLIOS: tuple[Portfolio, ...] = (
    Portfolio(
        manager_key="berkshire",
        quarter="2026Q2",
        filed_on="2026-08-14",
        total_value_usd=299_300_000_000,
        positions_reported=29,
        source="https://13f.info/13f/000119312526352200-berkshire-hathaway-inc-q2-2026",
        holdings=(
            Holding("AAPL", 22.0, Action.HOLD),
            Holding("AXP", 17.1, Action.HOLD),
            Holding("KO", 10.9, Action.HOLD),
            Holding("GOOGL", 9.4, Action.ADD),
            Holding("BAC", 9.2, Action.TRIM),
            Holding("CVX", 4.7, Action.HOLD),
            Holding("OXY", 4.3, Action.HOLD),
            Holding("CB", 3.9, Action.HOLD),
            Holding("MCO", 3.7, Action.HOLD),
            Holding("GOOG", 3.2, Action.HOLD),
            Holding("DAL", 0.8, Action.ADD, _EST, _FLOOR),
            Holding("LEN", 0.8, Action.ADD, _EST, _FLOOR),
            Holding("M", 0.4, Action.ADD, _EST, _FLOOR),
            Holding("NYT", 0.4, Action.ADD, _EST, _FLOOR),
            Holding("DVA", 1.0, Action.TRIM, _EST, _FLOOR),
            Holding("KR", 0.8, Action.TRIM, _EST, _FLOOR),
            Holding("ALLY", 0.5, Action.TRIM, _EST, _FLOOR),
            Holding("COF", 0.9, Action.TRIM, _EST, _FLOOR),
        ),
    ),
    Portfolio(
        manager_key="tci",
        quarter="2026Q2",
        filed_on="2026-08-14",
        total_value_usd=52_769_884_406,
        positions_reported=11,
        source="https://valuesider.com/guru/chris-hohn-tci-fund-management/portfolio",
        holdings=(
            Holding("GE", 33.59, Action.HOLD),
            Holding("V", 19.83, Action.HOLD),
            Holding("MCO", 12.30, Action.HOLD),
            Holding("SPGI", 10.87, Action.HOLD),
            Holding("CP", 7.44, Action.HOLD),
        ),
    ),
    Portfolio(
        manager_key="baupost",
        quarter="2026Q2",
        filed_on="2026-08-14",
        total_value_usd=5_420_000_000,
        positions_reported=23,
        source="https://valuesider.com/guru/seth-klarman-baupost-group/portfolio",
        holdings=(
            Holding("AMZN", 16.48, Action.ADD),
            Holding("ELV", 9.11, Action.HOLD),
            Holding("QSR", 9.04, Action.HOLD),
            Holding("GOOGL", 8.95, Action.ADD),
            Holding("FERG", 6.36, Action.ADD),
            Holding("CME", 2.0, Action.NEW, _EST, _FLOOR),
            Holding("PS", 2.0, Action.NEW, _EST, _FLOOR),
            Holding("GPC", 1.5, Action.ADD, _EST, _FLOOR),
            Holding("NCLH", 1.5, Action.ADD, _EST, _FLOOR),
            Holding("WTW", 0.0, Action.EXIT),
        ),
    ),
    Portfolio(
        manager_key="pershing",
        quarter="2026Q2",
        filed_on="2026-08-14",
        total_value_usd=13_700_000_000,
        positions_reported=12,
        source="https://finance.yahoo.com/markets/stocks/articles/bill-ackmans-pershing-square-buys-115159065.html",
        holdings=(
            Holding("BN", 17.6, Action.HOLD, _EST, _CARRIED),
            Holding("AMZN", 17.4, Action.HOLD, _EST, _CARRIED),
            Holding("UBER", 15.7, Action.HOLD, _EST, _CARRIED),
            Holding("MSFT", 15.3, Action.HOLD, _EST, _CARRIED),
            Holding("QSR", 12.2, Action.HOLD, _EST, _CARRIED),
            Holding("NFLX", 4.9, Action.NEW),
            Holding("V", 3.0, Action.NEW, _EST, _FLOOR),
            Holding("MA", 3.0, Action.NEW, _EST, _FLOOR),
            Holding("SPGI", 3.0, Action.NEW, _EST, _FLOOR),
        ),
    ),
    Portfolio(
        manager_key="appaloosa",
        quarter="2026Q2",
        filed_on="2026-08-14",
        total_value_usd=8_000_000_000,
        positions_reported=27,
        source="https://valuesider.com/guru/david-tepper-appaloosa-management/portfolio",
        holdings=(
            Holding("AMZN", 15.95, Action.ADD),
            Holding("MU", 15.06, Action.HOLD),
            Holding("TSM", 10.55, Action.ADD),
            Holding("GOOGL", 8.75, Action.ADD),
            Holding("UBER", 7.43, Action.ADD),
            Holding("EWY", 1.0, Action.ADD, _EST, _FLOOR),
        ),
    ),
    Portfolio(
        manager_key="duquesne",
        quarter="2026Q2",
        filed_on="2026-08-14",
        total_value_usd=5_210_000_000,
        positions_reported=95,
        source="https://13f.info/13f/000153641126000006-duquesne-family-office-llc-q2-2026",
        holdings=(
            Holding("NTRA", 16.6, Action.ADD),
            Holding("INSM", 5.7, Action.ADD),
            Holding("TSM", 5.4, Action.ADD),
            Holding("IBIT", 5.1, Action.NEW),
            Holding("AMZN", 4.6, Action.ADD),
            Holding("STM", 2.7, Action.ADD, _EST, _DERIVED),
            Holding("CDW", 2.7, Action.NEW, _EST, _DERIVED),
            Holding("GOOGL", 2.3, Action.NEW, _EST, _DERIVED),
        ),
    ),
    Portfolio(
        manager_key="thirdpoint",
        quarter="2026Q2",
        filed_on="2026-08-14",
        total_value_usd=8_600_000_000,
        positions_reported=60,
        source="https://www.gurufocus.com/news/9035905/daniel-loebs-top-q2-2026-move-warner-bros-discovery-inc-at-an-1141-portfolio-impact",
        holdings=(
            Holding("WBD", 11.41, Action.NEW),
            Holding("AMZN", 8.93, Action.HOLD),
            Holding("GOOGL", 7.84, Action.HOLD),
            Holding("CRH", 5.03, Action.HOLD),
            Holding("TDS", 4.97, Action.HOLD),
        ),
    ),
    Portfolio(
        manager_key="tigerglobal",
        quarter="2026Q2",
        filed_on="2026-08-14",
        total_value_usd=23_980_000_000,
        positions_reported=46,
        source="https://seekingalpha.com/news/4633477-tiger-global-adds-cerebras-exits-webull-boosted-intel-stake-among-top-q2-trades",
        holdings=(
            Holding("GOOGL", 10.0, Action.TRIM, _EST, _FLOOR),
            Holding("NVDA", 9.0, Action.TRIM, _EST, _FLOOR),
            Holding("AMZN", 8.0, Action.TRIM, _EST, _FLOOR),
            Holding("TSM", 7.0, Action.TRIM, _EST, _FLOOR),
            Holding("META", 6.0, Action.TRIM, _EST, _FLOOR),
            Holding("CBRS", 2.75, Action.NEW, _EST, _DERIVED),
            Holding("AMD", 1.63, Action.NEW, _EST, _DERIVED),
            Holding("INTC", 1.2, Action.ADD, _EST, _FLOOR),
            Holding("STX", 1.0, Action.NEW, _EST, _FLOOR),
            Holding("V", 1.0, Action.NEW, _EST, _FLOOR),
            Holding("APLD", 1.0, Action.NEW, _EST, _FLOOR),
            Holding("APP", 0.0, Action.EXIT),
            Holding("Z", 0.0, Action.EXIT),
            Holding("ZS", 0.0, Action.EXIT),
        ),
    ),
    Portfolio(
        manager_key="greenlight",
        quarter="2026Q1",
        filed_on="2026-05-15",
        total_value_usd=3_190_735_190,
        positions_reported=45,
        source="https://valuesider.com/guru/david-einhorn-greenlight-capital/portfolio",
        holdings=(
            Holding("GRBK", 19.12, Action.HOLD),
            Holding("FLR", 6.94, Action.HOLD),
            Holding("CNR", 6.10, Action.HOLD),
            Holding("BHF", 5.33, Action.HOLD),
            Holding("PCG", 3.65, Action.HOLD),
        ),
    ),
    # --- Gérants exclus du signal, conservés pour l'analyse ------------------
    Portfolio(
        manager_key="bridgewater",
        quarter="2026Q1",
        filed_on="2026-05-14",
        total_value_usd=22_400_000_000,
        positions_reported=993,
        source="https://www.insidearbitrage.com/holdings/0001350694/bridgewater-associates-lp/",
        holdings=(
            Holding("SPY", 12.67, Action.HOLD),
            Holding("IVV", 7.81, Action.TRIM),
            Holding("AMZN", 2.5, Action.ADD, _EST, _FLOOR),
            Holding("NVDA", 2.0, Action.ADD, _EST, _FLOOR),
            Holding("GOOGL", 1.8, Action.HOLD, _EST, _FLOOR),
            Holding("TSM", 1.6, Action.ADD, _EST, _FLOOR),
            Holding("AVGO", 1.0, Action.ADD, _EST, _FLOOR),
            Holding("MU", 0.9, Action.ADD, _EST, _FLOOR),
        ),
    ),
    Portfolio(
        manager_key="renaissance",
        quarter="2026Q1",
        filed_on="2026-05-14",
        total_value_usd=63_970_000_000,
        positions_reported=3763,
        source="https://www.holdingschannel.com/13f/renaissance-technologies-llc-top-holdings/",
        holdings=(
            Holding("UTHR", 1.7, Action.HOLD),
            Holding("PLTR", 1.4, Action.HOLD, _EST, _FLOOR),
            Holding("AAPL", 1.3, Action.HOLD, _EST, _FLOOR),
            Holding("KGC", 1.1, Action.HOLD, _EST, _FLOOR),
            Holding("MU", 1.0, Action.HOLD, _EST, _FLOOR),
        ),
    ),
    Portfolio(
        manager_key="icahn",
        quarter="2026Q2",
        filed_on="2026-08-14",
        total_value_usd=10_000_000_000,
        positions_reported=12,
        source="https://www.holdingschannel.com/13f/icahn-carl-c-top-holdings/",
        holdings=(
            Holding("IEP", 48.5, Action.HOLD),
            Holding("CVI", 28.0, Action.ADD),
            Holding("UAN", 4.0, Action.HOLD, _EST, _FLOOR),
            Holding("CTRI", 3.0, Action.HOLD, _EST, _FLOOR),
            Holding("IFF", 2.0, Action.HOLD, _EST, _FLOOR),
        ),
    ),
    Portfolio(
        manager_key="scion",
        quarter="2025Q3",
        filed_on="2025-11-14",
        total_value_usd=1_380_000_000,
        positions_reported=8,
        source="https://hedgefollow.com/funds/Scion+Asset+Management",
        holdings=(
            Holding("PLTR", 40.0, Action.NEW, _EST, "PUTS — pari baissier, notionnel et non risque réel"),
            Holding("NVDA", 35.0, Action.NEW, _EST, "PUTS — pari baissier, notionnel et non risque réel"),
            Holding("PFE", 8.0, Action.NEW, _EST, "CALLS — notionnel"),
            Holding("HAL", 6.0, Action.NEW, _EST, "CALLS — notionnel"),
            Holding("MOH", 5.0, Action.HOLD, _EST, _FLOOR),
        ),
    ),
)
