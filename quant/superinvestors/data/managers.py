"""Les gérants suivis : identité, style, thèse et éligibilité au signal.

Le champ `quality` est un poids de confiance, pas une note de sympathie. Il
combine trois choses vérifiables : la longueur du palmarès, la stabilité du
processus, et surtout la **réplicabilité** — un gérant génial mais dont le
13F ne montre pas ce qu'il fait vraiment (dérivés, ventes à découvert,
rotation quotidienne) reçoit un poids faible ou nul.
"""

from __future__ import annotations

from .models import Horizon, Manager, Style

MANAGERS: dict[str, Manager] = {
    "berkshire": Manager(
        key="berkshire",
        name="Warren Buffett / Greg Abel",
        firm="Berkshire Hathaway",
        cik="0001067983",
        style=Style.QUALITY_COMPOUNDER,
        horizon=Horizon.LONG,
        track_record="≈20 % par an composé sur 60 ans (1965-2025)",
        thesis=(
            "Acheter des franchises au pouvoir de fixation des prix durable, à un prix "
            "raisonnable, et ne rien faire pendant des décennies. Le portefeuille est "
            "financé par le float d'assurance : un levier gratuit et non rappelable, ce "
            "qui autorise une concentration impossible pour un fonds soumis aux rachats. "
            "Sous Greg Abel, la logique ne change pas mais le rythme oui : après 14 "
            "trimestres de ventes nettes, 19,8 Md$ d'achats nets au T2 2026."
        ),
        quality=1.0,
        sources=(
            "https://13f.info/13f/000119312526352200-berkshire-hathaway-inc-q2-2026",
            "https://www.benzinga.com/trading-ideas/long-ideas/26/08/61187293/berkshire-hathaway-13f-preview-what-stock-moves-did-buffett-successor-greg-abel-make",
        ),
    ),
    "tci": Manager(
        key="tci",
        name="Chris Hohn",
        firm="TCI Fund Management",
        cik="0001647251",
        style=Style.QUALITY_COMPOUNDER,
        horizon=Horizon.LONG,
        track_record="≈18 % par an depuis 2004, très faible rotation",
        thesis=(
            "Onze lignes pour 52,8 Md$. Hohn ne cherche pas des actions bon marché mais "
            "des monopoles réglementaires ou structurels : notation de crédit, indices, "
            "réseaux de paiement, rail transfrontalier, après-vente aéronautique. Des "
            "entreprises dont les revenus sont des péages indexés sur l'inflation."
        ),
        quality=0.95,
        sources=("https://valuesider.com/guru/chris-hohn-tci-fund-management/portfolio",),
    ),
    "baupost": Manager(
        key="baupost",
        name="Seth Klarman",
        firm="The Baupost Group",
        cik="0001061768",
        style=Style.DEEP_VALUE,
        horizon=Horizon.LONG,
        track_record="≈20 % par an sur quatre décennies, avec de longues périodes en liquidités",
        thesis=(
            "La marge de sécurité avant le rendement. Baupost accepte de détenir du cash "
            "en attendant une dislocation, et se concentre sur des situations où la valeur "
            "ne dépend pas d'une prévision macroéconomique. Au T2 2026, le fonds a "
            "toutefois renforcé Amazon et Alphabet : même l'école de la décote considère "
            "désormais les mégacaps comme des actifs à flux prévisibles."
        ),
        quality=0.90,
        sources=(
            "https://valuesider.com/guru/seth-klarman-baupost-group/portfolio",
            "https://seekingalpha.com/news/4632894-seth-klarmans-baupost-adds-pershing-square-in-q2-boosts-amazon-alphabet",
        ),
    ),
    "pershing": Manager(
        key="pershing",
        name="Bill Ackman",
        firm="Pershing Square Capital Management",
        cik="0001336528",
        style=Style.ACTIVIST,
        horizon=Horizon.LONG,
        track_record="≈27,7 % brut par an de 2004 à 2014, plus volatil ensuite",
        thesis=(
            "Dix à douze lignes, jamais plus. Ackman cherche des sociétés simples, "
            "prévisibles, à flux de trésorerie libre récurrent, où un changement de "
            "gouvernance ou de structure peut débloquer la valeur. La vague T2 2026 "
            "(Netflix, Visa, Mastercard, S&P Global) confirme le glissement vers les "
            "péages et l'abonnement plutôt que vers l'activisme frontal."
        ),
        quality=0.85,
        sources=(
            "https://finance.yahoo.com/markets/stocks/articles/bill-ackmans-pershing-square-buys-115159065.html",
            "https://valuesider.com/guru/bill-ackman-pershing-square-capital-management/portfolio",
        ),
    ),
    "appaloosa": Manager(
        key="appaloosa",
        name="David Tepper",
        firm="Appaloosa Management",
        cik="0001656456",
        style=Style.GLOBAL_MACRO,
        horizon=Horizon.MEDIUM,
        track_record="≈25 % par an depuis 1993, spécialiste des points de retournement",
        thesis=(
            "Tepper achète quand le risque est mal payé par la peur. Sa version 2026 : "
            "concentration sur la chaîne de valeur du calcul (Micron, TSMC) et sur les "
            "plateformes qui monétisent l'IA (Amazon, Alphabet, Uber), avec une rotation "
            "assumée — 12 sorties complètes sur 27 lignes au T2 2026."
        ),
        quality=0.80,
        sources=("https://valuesider.com/guru/david-tepper-appaloosa-management/portfolio",),
    ),
    "duquesne": Manager(
        key="duquesne",
        name="Stanley Druckenmiller",
        firm="Duquesne Family Office",
        cik="0001536411",
        style=Style.GLOBAL_MACRO,
        horizon=Horizon.MEDIUM,
        track_record="≈30 % par an pendant 30 ans, aucune année négative",
        thesis=(
            "« Ce n'est pas d'avoir raison qui compte, c'est combien vous gagnez quand "
            "vous avez raison. » Druckenmiller construit des paris concentrés sur un "
            "scénario macro (ici : biotech à catalyseur, semi-conducteurs, bitcoin) et les "
            "coupe sans état d'âme. Natera pèse 16,6 % du portefeuille au T2 2026."
        ),
        quality=0.80,
        sources=(
            "https://13f.info/13f/000153641126000006-duquesne-family-office-llc-q2-2026",
            "https://stockcircle.com/portfolio/stanley-druckenmiller",
        ),
    ),
    "thirdpoint": Manager(
        key="thirdpoint",
        name="Daniel Loeb",
        firm="Third Point",
        cik="0001040273",
        style=Style.EVENT_DRIVEN,
        horizon=Horizon.MEDIUM,
        track_record="≈15 % par an depuis 1995, spécialiste des situations spéciales",
        thesis=(
            "Acheter la complexité que le marché refuse de modéliser : scissions, "
            "restructurations, changements de direction. Le pari T2 2026 sur Warner Bros. "
            "Discovery (11,4 % du portefeuille) est un pari sur la séparation des actifs "
            "câble et streaming, pas sur les audiences."
        ),
        quality=0.75,
        sources=(
            "https://www.gurufocus.com/news/9035905/daniel-loebs-top-q2-2026-move-warner-bros-discovery-inc-at-an-1141-portfolio-impact",
        ),
    ),
    "tigerglobal": Manager(
        key="tigerglobal",
        name="Chase Coleman",
        firm="Tiger Global Management",
        cik="0001167483",
        style=Style.GROWTH,
        horizon=Horizon.MEDIUM,
        track_record="≈20 % par an sur 20 ans, mais -56 % en 2022",
        thesis=(
            "Payer cher une croissance dont la durée est sous-estimée. Au T2 2026 le fonds "
            "réduit *toutes* ses dix premières lignes pour financer la génération suivante "
            "d'infrastructure IA (Cerebras, AMD, Applied Digital) : un arbitrage entre les "
            "gagnants établis et les challengers."
        ),
        quality=0.70,
        sources=(
            "https://seekingalpha.com/news/4633477-tiger-global-adds-cerebras-exits-webull-boosted-intel-stake-among-top-q2-trades",
        ),
    ),
    "greenlight": Manager(
        key="greenlight",
        name="David Einhorn",
        firm="Greenlight Capital",
        cik="0001079114",
        style=Style.DEEP_VALUE,
        horizon=Horizon.LONG,
        track_record="≈13 % par an depuis 1996, très contrariant depuis 2015",
        thesis=(
            "Einhorn considère que le marché ne rémunère plus la recherche fondamentale : "
            "il n'achète donc que des actifs si décotés qu'ils se rémunèrent seuls par les "
            "rachats d'actions et les dividendes (Green Brick, charbon, assurance-vie "
            "décotée), sans dépendre d'une revalorisation par les autres investisseurs."
        ),
        quality=0.70,
        sources=("https://valuesider.com/guru/david-einhorn-greenlight-capital/portfolio",),
    ),
    "bridgewater": Manager(
        key="bridgewater",
        name="Ray Dalio (fondateur) / co-CIO",
        firm="Bridgewater Associates",
        cik="0001350694",
        style=Style.GLOBAL_MACRO,
        horizon=Horizon.SHORT,
        track_record="Pure Alpha : ≈11 % par an depuis 1991 sur un mandat mondial multi-actifs",
        thesis=(
            "La performance de Bridgewater vient des taux, des devises et des matières "
            "premières — invisibles dans un 13F. Ce que l'on voit (SPY, IVV) est une brique "
            "de bêta à l'intérieur d'un portefeuille équilibré en risque."
        ),
        quality=0.15,
        include_in_signal=False,
        exclusion_reason=(
            "Le 13F ne montre qu'une fraction du risque : l'essentiel passe par des "
            "instruments non déclarés. Copier ses lignes actions revient à copier son "
            "exposition indicielle, pas son alpha."
        ),
        sources=("https://www.insidearbitrage.com/holdings/0001350694/bridgewater-associates-lp/",),
    ),
    "renaissance": Manager(
        key="renaissance",
        name="Jim Simons (fondateur) / Renaissance",
        firm="Renaissance Technologies",
        cik="0001037389",
        style=Style.QUANT,
        horizon=Horizon.ULTRA_SHORT,
        track_record="Medallion : ≈39 % net par an depuis 1988 (fonds fermé aux tiers)",
        thesis=(
            "Des milliers de micro-paris statistiques à durée de vie courte, 3 763 lignes "
            "au dernier dépôt, six seulement au-dessus de 1 %. Le signal est dans la "
            "structure du portefeuille, pas dans les titres."
        ),
        quality=0.10,
        include_in_signal=False,
        exclusion_reason=(
            "Horizon de détention plus court que le délai de publication de 45 jours : "
            "les positions vues sont déjà soldées. Le meilleur palmarès du monde n'est "
            "pas réplicable via un 13F."
        ),
        sources=("https://www.holdingschannel.com/13f/renaissance-technologies-llc-top-holdings/",),
    ),
    "icahn": Manager(
        key="icahn",
        name="Carl Icahn",
        firm="Icahn Enterprises",
        cik="0000921669",
        style=Style.CONTROL,
        horizon=Horizon.LONG,
        track_record="Palmarès historique exceptionnel, performance du véhicule coté négative depuis 2017",
        thesis=(
            "Le portefeuille est composé à ~76 % de son propre véhicule coté (IEP) et de "
            "CVR Energy, détenue à 71 %. Ce sont des positions de contrôle industriel, pas "
            "des idées d'investissement transposables."
        ),
        quality=0.20,
        include_in_signal=False,
        exclusion_reason=(
            "Positions de contrôle dans des sociétés affiliées : un investisseur minoritaire "
            "achète le même titre sans le pouvoir qui en fait la valeur."
        ),
        sources=("https://www.holdingschannel.com/13f/icahn-carl-c-top-holdings/",),
    ),
    "scion": Manager(
        key="scion",
        name="Michael Burry",
        firm="Scion Asset Management",
        cik="0001649339",
        style=Style.DEEP_VALUE,
        horizon=Horizon.MEDIUM,
        track_record="Célèbre pour 2005-2008 ; performances récentes non auditées publiquement",
        thesis=(
            "Dernier 13F au T3 2025 : puts sur Nvidia et Palantir, calls sur Pfizer et "
            "Halliburton — un pari baissier sur la valorisation de l'IA financé par des "
            "options. Scion s'est désenregistré auprès de la SEC en novembre 2025 ; les "
            "positions communiquées depuis le sont volontairement, hors cadre réglementaire."
        ),
        quality=0.30,
        include_in_signal=False,
        exclusion_reason=(
            "Plus aucun dépôt réglementaire depuis novembre 2025, et un portefeuille "
            "essentiellement optionnel dont le 13F affichait la valeur notionnelle et non "
            "le risque réel. Conservé dans l'analyse comme cas d'école des limites du 13F."
        ),
        sources=(
            "https://www.insidermonkey.com/hedge-fund/scion+asset+management/894/",
            "https://hedgefollow.com/funds/Scion+Asset+Management",
        ),
    ),
}
