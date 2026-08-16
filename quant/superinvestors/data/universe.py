"""Caractéristiques des titres : secteur, thème, risque.

⚠️ Les volatilités et bêtas ci-dessous sont des **ordres de grandeur**
saisis à la main, pas des mesures. Ils servent de valeurs par défaut au
modèle de risque quand aucune série de prix n'est fournie. Dès que vous
passez un fichier de prix (`--prix historique.csv`), le moteur recalcule
volatilités et bêtas sur données réelles et ignore ces valeurs.
"""

from __future__ import annotations

from .models import Asset

# ticker: (nom, secteur, thème, vol annualisée, bêta)
_RAW: dict[str, tuple[str, str, str, float, float]] = {
    # --- Mégacaps technologiques / IA ---------------------------------------
    "AAPL": ("Apple", "technologie", "plateforme_grand_public", 0.26, 1.05),
    "MSFT": ("Microsoft", "technologie", "cloud_ia", 0.25, 0.95),
    "GOOGL": ("Alphabet A", "communication", "publicite_ia", 0.30, 1.05),
    "GOOG": ("Alphabet C", "communication", "publicite_ia", 0.30, 1.05),
    "AMZN": ("Amazon", "conso_discretionnaire", "cloud_ia", 0.30, 1.15),
    "META": ("Meta Platforms", "communication", "publicite_ia", 0.35, 1.20),
    "NFLX": ("Netflix", "communication", "streaming", 0.35, 1.10),
    "NVDA": ("NVIDIA", "technologie", "infrastructure_ia", 0.45, 1.55),
    "AVGO": ("Broadcom", "technologie", "infrastructure_ia", 0.38, 1.30),
    "AMD": ("AMD", "technologie", "infrastructure_ia", 0.45, 1.45),
    "INTC": ("Intel", "technologie", "infrastructure_ia", 0.45, 1.20),
    "TSM": ("TSMC", "technologie", "infrastructure_ia", 0.35, 1.20),
    "MU": ("Micron", "technologie", "infrastructure_ia", 0.50, 1.50),
    "LRCX": ("Lam Research", "technologie", "infrastructure_ia", 0.45, 1.40),
    "STM": ("STMicroelectronics", "technologie", "semis_industriels", 0.35, 1.15),
    "CBRS": ("Cerebras Systems", "technologie", "infrastructure_ia", 0.70, 1.80),
    "APLD": ("Applied Digital", "technologie", "infrastructure_ia", 0.80, 1.90),
    "STX": ("Seagate", "technologie", "infrastructure_ia", 0.40, 1.30),
    "CDW": ("CDW Corp", "technologie", "integration_it", 0.28, 1.05),
    "ADBE": ("Adobe", "technologie", "logiciel", 0.32, 1.10),
    "PLTR": ("Palantir", "technologie", "logiciel_ia", 0.55, 1.60),
    "ZS": ("Zscaler", "technologie", "cybersecurite", 0.45, 1.25),
    "APP": ("AppLovin", "technologie", "publicite_ia", 0.55, 1.50),

    # --- Paiements, données, places de marché --------------------------------
    "V": ("Visa", "finance", "peage_paiements", 0.20, 0.95),
    "MA": ("Mastercard", "finance", "peage_paiements", 0.21, 0.98),
    "SPGI": ("S&P Global", "finance", "oligopole_donnees", 0.22, 1.00),
    "MCO": ("Moody's", "finance", "oligopole_donnees", 0.24, 1.05),
    "ICE": ("Intercontinental Exchange", "finance", "infrastructure_marche", 0.20, 0.90),
    "CME": ("CME Group", "finance", "infrastructure_marche", 0.18, 0.70),
    "PS": ("Pershing Square (coté)", "finance", "vehicule_gerant", 0.25, 0.95),

    # --- Finance traditionnelle et assurance ---------------------------------
    "AXP": ("American Express", "finance", "credit_premium", 0.26, 1.15),
    "BAC": ("Bank of America", "finance", "banque_universelle", 0.28, 1.20),
    "COF": ("Capital One", "finance", "credit_consommation", 0.32, 1.30),
    "ALLY": ("Ally Financial", "finance", "credit_consommation", 0.35, 1.35),
    "CB": ("Chubb", "finance", "assurance_float", 0.18, 0.65),
    "BHF": ("Brighthouse Financial", "finance", "assurance_decote", 0.35, 1.10),
    "BN": ("Brookfield Corp", "finance", "actifs_reels", 0.28, 1.20),

    # --- Énergie et matières --------------------------------------------------
    "CVX": ("Chevron", "energie", "energie_integree", 0.25, 0.75),
    "OXY": ("Occidental Petroleum", "energie", "petrole_schiste", 0.32, 0.95),
    "CVI": ("CVR Energy", "energie", "raffinage", 0.40, 1.00),
    "UAN": ("CVR Partners", "materiaux", "engrais", 0.40, 0.85),
    "HAL": ("Halliburton", "energie", "services_petroliers", 0.35, 1.15),
    "CNR": ("Core Natural Resources", "energie", "charbon", 0.45, 1.00),
    "KGC": ("Kinross Gold", "materiaux", "or", 0.40, 0.60),
    "CRH": ("CRH plc", "materiaux", "infrastructure_construction", 0.25, 1.05),
    "IFF": ("Intl Flavors & Fragrances", "materiaux", "ingredients", 0.30, 0.95),

    # --- Santé ----------------------------------------------------------------
    "LLY": ("Eli Lilly", "sante", "obesite_glp1", 0.28, 0.75),
    "NTRA": ("Natera", "sante", "diagnostic_genomique", 0.55, 1.15),
    "INSM": ("Insmed", "sante", "biotech_pulmonaire", 0.60, 1.10),
    "UTHR": ("United Therapeutics", "sante", "biotech_pulmonaire", 0.35, 0.70),
    "ELV": ("Elevance Health", "sante", "assurance_sante", 0.30, 0.75),
    "MOH": ("Molina Healthcare", "sante", "assurance_sante", 0.35, 0.70),
    "PFE": ("Pfizer", "sante", "pharma_large", 0.25, 0.65),
    "DVA": ("DaVita", "sante", "dialyse", 0.30, 0.85),

    # --- Consommation et distribution ----------------------------------------
    "KO": ("Coca-Cola", "conso_base", "marque_mondiale", 0.15, 0.55),
    "KHC": ("Kraft Heinz", "conso_base", "marque_alimentaire", 0.22, 0.65),
    "KR": ("Kroger", "conso_base", "distribution_alimentaire", 0.22, 0.55),
    "GPC": ("Genuine Parts", "conso_discretionnaire", "distribution_pieces", 0.25, 0.90),
    "QSR": ("Restaurant Brands", "conso_discretionnaire", "franchise_restauration", 0.20, 0.90),
    "M": ("Macy's", "conso_discretionnaire", "distribution_decote", 0.45, 1.30),
    "NCLH": ("Norwegian Cruise Line", "conso_discretionnaire", "voyage_loisirs", 0.45, 1.55),
    "UBER": ("Uber Technologies", "industrie", "plateforme_mobilite", 0.38, 1.25),
    "DAL": ("Delta Air Lines", "industrie", "transport_aerien", 0.35, 1.25),
    "BKNG": ("Booking Holdings", "conso_discretionnaire", "voyage_loisirs", 0.28, 1.10),

    # --- Industrie, immobilier, services -------------------------------------
    "GE": ("GE Aerospace", "industrie", "aeronautique_apres_vente", 0.28, 1.10),
    "GEV": ("GE Vernova", "industrie", "electrification", 0.40, 1.30),
    "CP": ("Canadian Pacific Kansas City", "industrie", "rail_amerique_nord", 0.22, 0.95),
    "FERG": ("Ferguson", "industrie", "distribution_batiment", 0.26, 1.10),
    "FLR": ("Fluor", "industrie", "ingenierie_construction", 0.40, 1.25),
    "LEN": ("Lennar", "conso_discretionnaire", "construction_residentielle", 0.32, 1.20),
    "GRBK": ("Green Brick Partners", "conso_discretionnaire", "construction_residentielle", 0.40, 1.25),
    "PCG": ("PG&E", "services_publics", "utility_restructuree", 0.35, 0.75),
    "CTRI": ("Centuri Holdings", "industrie", "services_reseaux", 0.45, 1.15),
    "WTW": ("Willis Towers Watson", "finance", "courtage_assurance", 0.22, 0.85),

    # --- Médias et télécoms ---------------------------------------------------
    "WBD": ("Warner Bros. Discovery", "communication", "media_operations_ma", 0.45, 1.25),
    "NYT": ("New York Times", "communication", "media_abonnement", 0.28, 0.85),
    "TDS": ("Telephone & Data Systems", "communication", "telecom_decote_actifs", 0.40, 0.95),
    "Z": ("Zillow", "communication", "plateforme_immobilier", 0.45, 1.35),

    # --- Véhicules, ETF, cryptoactifs ----------------------------------------
    "SPY": ("SPDR S&P 500 ETF", "indice", "beta_marche", 0.15, 1.00),
    "IVV": ("iShares Core S&P 500", "indice", "beta_marche", 0.15, 1.00),
    "EWY": ("iShares MSCI South Korea", "indice", "beta_pays", 0.28, 1.10),
    "IBIT": ("iShares Bitcoin Trust", "cryptoactif", "bitcoin", 0.50, 1.40),
    "IEP": ("Icahn Enterprises", "finance", "vehicule_gerant", 0.35, 0.95),
    "NU": ("Nu Holdings", "finance", "banque_digitale_latam", 0.45, 1.30),
}

ASSETS: dict[str, Asset] = {
    ticker: Asset(ticker=ticker, name=name, sector=sector, theme=theme, vol=vol, beta=beta)
    for ticker, (name, sector, theme, vol, beta) in _RAW.items()
}

BENCHMARK = "SPY"
