"""Pourquoi ces titres se retrouvent-ils dans ces portefeuilles ?

Le 13F dit *quoi*. Il ne dit jamais *pourquoi*. Les thèses ci-dessous sont
reconstituées à partir des lettres aux investisseurs, des interviews et de
la structure même des positions (taille, sens du mouvement, cohérence avec
le style du gérant). Elles sont donc des interprétations documentées, pas
des déclarations des gérants.
"""

from __future__ import annotations

from dataclasses import dataclass

from ..data.models import Universe


@dataclass(frozen=True)
class Thesis:
    """Thèse d'investissement reconstituée pour un titre."""

    summary: str          # la raison en une phrase
    driver: str           # ce qui doit se produire pour que ça marche
    risk: str             # ce qui casse la thèse


THESES: dict[str, Thesis] = {
    "GOOGL": Thesis(
        summary=(
            "Le seul acteur intégré verticalement de l'IA : modèles, puces maison (TPU), "
            "centres de données et distribution via la recherche et YouTube — acheté à un "
            "multiple de bénéfices inférieur à celui de ses pairs."
        ),
        driver="Monétiser l'IA sans laisser fuir la marge publicitaire vers les assistants concurrents.",
        risk="Désintermédiation de la recherche et décisions antitrust sur la distribution.",
    ),
    "AMZN": Thesis(
        summary=(
            "Deux entreprises en une : un commerce à marge faible qui finance AWS, dont la "
            "croissance est directement adossée à la demande de calcul IA."
        ),
        driver="Réaccélération d'AWS et effet de levier opérationnel sur la logistique.",
        risk="Cycle d'investissement en centres de données trop lourd pour les flux de trésorerie.",
    ),
    "MSFT": Thesis(
        summary="Rente logicielle d'entreprise, avec un droit d'accès privilégié à OpenAI.",
        driver="Conversion du parc Office/Azure en abonnements IA facturés par siège.",
        risk="Coût du capital des centres de données et dépendance à un partenaire unique.",
    ),
    "NVDA": Thesis(
        summary="Le péage de l'ère du calcul accéléré : quasi-monopole matériel doublé du verrou logiciel CUDA.",
        driver="Poursuite des dépenses d'investissement des hyperscalers.",
        risk="Puces maison des clients, cyclicité brutale, valorisation qui capitalise la perfection.",
    ),
    "TSM": Thesis(
        summary=(
            "Goulot d'étranglement physique de toute l'industrie : personne ne fabrique en "
            "volume les nœuds avancés à part TSMC."
        ),
        driver="Pouvoir de fixation des prix sur les nœuds de pointe et discipline sur les capacités.",
        risk="Risque géopolitique de Taïwan — un risque que le marché ne sait pas valoriser.",
    ),
    "MU": Thesis(
        summary=(
            "La mémoire haute bande passante est passée d'une commodité cyclique à un "
            "composant rationné, vendu sur contrats pluriannuels."
        ),
        driver="Maintien de la discipline d'offre chez les trois producteurs mondiaux.",
        risk="Retour du cycle : la mémoire a toujours fini par surcapacité.",
    ),
    "AAPL": Thesis(
        summary=(
            "Base installée de deux milliards d'appareils, marge de services en croissance, "
            "et un programme de rachats d'actions qui augmente mécaniquement la part de "
            "chaque actionnaire."
        ),
        driver="Cycle de renouvellement porté par l'IA embarquée et hausse du revenu par utilisateur.",
        risk="Dépendance à la Chine et au paiement d'Alphabet pour la recherche par défaut.",
    ),
    "META": Thesis(
        summary="Le meilleur retour sur investissement publicitaire du marché, financé par des données propriétaires.",
        driver="L'IA améliore le ciblage plus vite qu'elle ne coûte cher.",
        risk="Dépenses d'infrastructure sans contrepartie de revenus mesurable.",
    ),
    "AXP": Thesis(
        summary=(
            "Modèle fermé : American Express prête, encaisse la commission marchande *et* "
            "les cotisations annuelles, sur une clientèle solvable."
        ),
        driver="Montée en gamme de la clientèle et fidélité aux cartes premium.",
        risk="Récession du haut de gamme et concurrence sur les avantages de fidélité.",
    ),
    "V": Thesis(
        summary="Péage sur la consommation mondiale, indexé sur l'inflation, sans risque de crédit.",
        driver="Substitution continue de l'argent liquide par le paiement électronique.",
        risk="Réglementation des commissions d'interchange et paiements en temps réel de banque à banque.",
    ),
    "MA": Thesis(
        summary="Même modèle que Visa, avec un poids relatif plus grand des flux transfrontaliers, plus rémunérateurs.",
        driver="Croissance des paiements internationaux et des services à valeur ajoutée.",
        risk="Concurrence des réseaux publics de paiement instantané.",
    ),
    "SPGI": Thesis(
        summary="Duopole de la notation de crédit + rente des indices : personne n'émet une obligation sans payer S&P.",
        driver="Volume d'émissions obligataires et croissance des actifs indiciels.",
        risk="Fenêtre d'émission fermée en cas de choc de taux.",
    ),
    "MCO": Thesis(
        summary="L'autre moitié du duopole de notation, avec une activité d'analyse de risque en abonnement.",
        driver="Refinancement du mur de dette d'entreprise.",
        risk="Cyclicité des émissions et risque réglementaire post-crise.",
    ),
    "CME": Thesis(
        summary="Monopole de fait sur les dérivés de taux américains : la volatilité est son chiffre d'affaires.",
        driver="Incertitude persistante sur la trajectoire des taux.",
        risk="Retour d'un régime de taux calme.",
    ),
    "GE": Thesis(
        summary=(
            "L'après-vente aéronautique est une rente de 30 ans : les moteurs se vendent à "
            "perte, les pièces et la maintenance se facturent pendant des décennies."
        ),
        driver="Croissance du trafic aérien et parc installé qui vieillit.",
        risk="Choc exogène sur le trafic (pandémie, énergie) et exécution industrielle.",
    ),
    "CP": Thesis(
        summary="Unique réseau ferroviaire reliant Canada, États-Unis et Mexique : un actif non reproductible.",
        driver="Synergies de la fusion et report modal camion vers rail.",
        risk="Cycle des matières premières et réglementation transfrontalière.",
    ),
    "KO": Thesis(
        summary="Marque mondiale, distribution capillaire, besoin en capital quasi nul : la machine à dividendes.",
        driver="Pouvoir de fixation des prix supérieur à l'inflation.",
        risk="Changement d'habitudes de consommation, effet des traitements anti-obésité.",
    ),
    "QSR": Thesis(
        summary="Franchise : les restaurants appartiennent aux franchisés, les redevances à l'actionnaire.",
        driver="Ouvertures internationales et redressement de Burger King aux États-Unis.",
        risk="Santé financière des franchisés et coût des intrants.",
    ),
    "UBER": Thesis(
        summary=(
            "Effet de réseau devenu rentable : Uber génère désormais du flux de trésorerie "
            "libre et rachète ses actions."
        ),
        driver="Croissance de la publicité et de l'abonnement, plateformes de livraison rentables.",
        risk="Requalification des chauffeurs et arrivée du véhicule autonome.",
    ),
    "NFLX": Thesis(
        summary="Gagnant du streaming : la publicité et la lutte contre le partage de comptes ont transformé la marge.",
        driver="Hausse du revenu par abonné sans hausse proportionnelle des coûts de contenu.",
        risk="Saturation des marchés développés et inflation des droits sportifs.",
    ),
    "BN": Thesis(
        summary="Gestionnaire d'actifs réels dont les commissions récurrentes sont peu valorisées face au bilan.",
        driver="Reconnaissance par le marché de la valeur de la société de gestion.",
        risk="Sensibilité aux taux longs et à la valorisation de l'immobilier.",
    ),
    "WBD": Thesis(
        summary="Pari sur la séparation entre les actifs câble en déclin et l'activité streaming/studios.",
        driver="Réalisation de la scission et intérêt d'acquéreurs pour les studios.",
        risk="Endettement élevé si l'opération traîne.",
    ),
    "ELV": Thesis(
        summary="Assureur santé acheté après l'effondrement du secteur, quand le ratio de sinistralité est au plus mal.",
        driver="Repricing des primes Medicaid et Medicare sur les prochains renouvellements.",
        risk="Coûts médicaux durablement au-dessus des tarifs négociés.",
    ),
    "NTRA": Thesis(
        summary="Test génomique devenu standard de soins : chaque test remboursé accroît la base récurrente.",
        driver="Élargissement du remboursement au dépistage du cancer et des rejets de greffe.",
        risk="Position de 16 % du portefeuille sur un dossier binaire — le risque est le dimensionnement.",
    ),
    "IBIT": Thesis(
        summary="Exposition au bitcoin par un véhicule coté : un actif rare détenu comme couverture monétaire.",
        driver="Flux structurels vers les ETF et défiance envers la dette souveraine.",
        risk="Actif sans flux de trésorerie : sa valeur ne dépend que du prochain acheteur.",
    ),
    "CVX": Thesis(
        summary="Baril à bilan solide, dividende couvert : une couverture contre l'inflation et le risque géopolitique.",
        driver="Discipline d'investissement du secteur et prix du pétrole soutenu.",
        risk="Transition énergétique et cycle de l'offre OPEP.",
    ),
    "OXY": Thesis(
        summary="Actifs du bassin permien à bas coût, avec un pari additionnel sur la captation de carbone.",
        driver="Désendettement et prix du pétrole au-dessus du point mort.",
        risk="Levier financier élevé si le baril décroche.",
    ),
    "GRBK": Thesis(
        summary=(
            "Constructeur de maisons acheté sous sa valeur comptable alors qu'il rachète "
            "massivement ses propres actions : la performance ne dépend pas du marché."
        ),
        driver="Déficit structurel de logements aux États-Unis et rachats d'actions relutifs.",
        risk="Taux hypothécaires durablement élevés.",
    ),
    "CBRS": Thesis(
        summary="Challenger matériel face à Nvidia sur l'inférence : pari asymétrique, petite taille de position.",
        driver="Adoption par un hyperscaler d'une architecture alternative.",
        risk="Échec commercial probable — c'est un pari d'option, pas une conviction.",
    ),
}


@dataclass(frozen=True)
class Explanation:
    """Réponse complète à « pourquoi ce titre ? »."""

    ticker: str
    name: str
    sector: str
    theme: str
    thesis: Thesis | None
    holders: tuple[tuple[str, float, str, str], ...]  # (gérant, poids, action, style)

    def holder_count(self) -> int:
        return len(self.holders)


def explain(universe: Universe, ticker: str, *, signal_only: bool = False) -> Explanation:
    """Assemble la thèse documentée et la liste des détenteurs pour un titre."""
    ticker = ticker.upper()
    asset = universe.asset(ticker)
    portfolios = universe.signal_portfolios() if signal_only else universe.portfolios

    holders: list[tuple[str, float, str, str]] = []
    for portfolio in portfolios:
        manager = universe.manager_of(portfolio)
        for holding in portfolio.holdings:
            if holding.ticker == ticker:
                holders.append(
                    (manager.name, holding.weight_pct, holding.action.value, manager.style.value)
                )
    holders.sort(key=lambda h: -h[1])

    return Explanation(
        ticker=ticker,
        name=asset.name,
        sector=asset.sector,
        theme=asset.theme,
        thesis=THESES.get(ticker),
        holders=tuple(holders),
    )
