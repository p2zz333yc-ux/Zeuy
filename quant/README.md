# superinvestors — analyse des portefeuilles des grands gérants et algorithme de réplication sélective

Ce module fait trois choses :

1. il **encode** les portefeuilles 13F des plus grands gérants mondiaux
   (Berkshire, TCI, Pershing Square, Appaloosa, Duquesne, Third Point, Tiger
   Global, Baupost, Greenlight… et ceux qu'il faut écarter : Bridgewater,
   Renaissance, Icahn, Scion), avec la source de chaque chiffre ;
2. il **explique** pourquoi ces titres sont détenus — concentration, consensus,
   recouvrements, paris macro sous-jacents, thèse par titre ;
3. il **construit un portefeuille** à partir de ces informations, sous
   contraintes de risque explicites, et en mesure honnêtement le résultat
   possible.

L'analyse rédigée se trouve dans **[ANALYSE.md](ANALYSE.md)**.

> ### Ce module ne garantit aucun gain
> Aucun algorithme ne le peut. La demande initiale était « un algorithme qui
> assure des gains » ; la réponse honnête est qu'un tel objet n'existe pas, et
> que toute personne qui l'affirme vend autre chose. Ce qui est réellement
> contrôlable — taille des positions, exposition, frais, qualité de la source,
> mesure du risque — est implémenté ici. Le reste est une distribution de
> probabilités, affichée comme telle. Voir la section 7 de l'analyse.

---

## Démarrer

Aucune dépendance : Python 3.10 ou plus récent suffit.

```bash
cd quant
python3 -m superinvestors.cli gerants        # qui est suivi, qui est écarté et pourquoi
python3 -m superinvestors.cli analyse        # concentration, consensus, recouvrements, paris macro
python3 -m superinvestors.cli pourquoi GOOGL # thèse d'un titre et liste des détenteurs
python3 -m superinvestors.cli score --top 20 # classement des titres
python3 -m superinvestors.cli portefeuille   # portefeuille cible sous contraintes de risque
python3 -m superinvestors.cli simuler        # distribution des résultats possibles
python3 -m superinvestors.cli marches      # dispositif de risque sur S&P 500 et or
python3 -m superinvestors.cli export --sortie positions.csv
```

Tests :

```bash
python3 -m unittest discover -s tests -t .
```

En bibliothèque :

```python
from superinvestors import load_universe, score_universe, build_target_portfolio

universe = load_universe()
scores = score_universe(universe)
cible = build_target_portfolio(universe, scores, n_positions=15)

for position in cible.positions:
    print(position.ticker, f"{position.weight_pct:.1f}%", position.reason)
```

---

## L'algorithme, en cinq étapes

### 1. Filtrer les gérants (l'étape la plus importante)

Un gérant n'est retenu que si son 13F **contient réellement** ce qui produit sa
performance, et si son horizon de détention dépasse le délai de publication de
45 jours. Sont écartés, avec motif :

| Gérant | Motif d'exclusion |
|---|---|
| Renaissance | Rotation plus rapide que le délai de publication : les positions vues sont déjà soldées. |
| Bridgewater | L'essentiel du risque passe par des instruments non déclarés ; le 13F ne montre que du bêta. |
| Icahn | Positions de contrôle dans ses propres affiliés : incopiables par un minoritaire. |
| Scion | Plus aucun dépôt depuis novembre 2025, portefeuille optionnel dont le notionnel n'est pas le risque. |

Les gérants retenus reçoivent un poids de confiance (`quality`, de 0 à 1) fondé
sur la durée du palmarès, la stabilité du processus et la réplicabilité.

### 2. Noter chaque titre — cinq facteurs

| Facteur | Poids | Ce qu'il mesure |
|---|---|---|
| Conviction | 0,35 | Poids moyen accordé au titre, plafonné à 15 % par gérant |
| Consensus | 0,25 | Somme des confiances des gérants détenteurs |
| Diversité des styles | 0,15 | Nombre d'écoles d'investissement distinctes représentées |
| Flux | 0,20 | Ouvertures et renforcements moins allègements et sorties du trimestre |
| Persistance | 0,05 | Part des détenteurs qui n'ont pas touché à la ligne |

Chaque facteur est centré-réduit sur l'univers, puis combiné. Les dépôts anciens
sont décotés de 40 % par trimestre de retard, les pondérations reconstituées de
15 %. La contribution de chaque facteur est conservée : `score` affiche toujours
le facteur dominant de chaque ligne.

Sont écartés : les ETF indiciels et véhicules du gérant lui-même (aucune
information à copier), les positions soldées, et les titres détenus par un seul
gérant à moins de 10 % de son portefeuille.

### 3. Dimensionner sous contraintes

- pondération inverse à la volatilité — à conviction égale, on préfère le titre
  le moins agité ;
- décote d'encombrement : un titre détenu par tout le monde est aussi celui que
  tout le monde vendra le même jour ;
- plafonds : **10 % par ligne, 30 % par secteur, 40 % par macro-pari** (ce
  dernier est essentiel : sans lui, le portefeuille serait un pari unique sur
  l'IA, voir l'analyse) ;
- ce que les plafonds interdisent d'investir reste en liquidités — les
  contraintes priment sur l'envie d'être investi.

### 4. Doser l'exposition

Le panier est mis à l'échelle pour viser une volatilité annualisée de 12 %
(paramétrable). Avec les données actuelles, le panier ressort autour de 20 % de
volatilité : l'exposition est donc ramenée à ≈60 %, le solde en liquidités.
**Aucun effet de levier n'est possible** (`max_gross_exposure = 1.0`). En cas de
perte, l'exposition est réduite progressivement à partir de −10 %, jusqu'à 40 %
de l'exposition initiale au-delà de −20 %.

### 5. Mesurer honnêtement

- `simuler` projette le portefeuille sur des milliers de marchés possibles
  (modèle à facteurs marché/secteur/idiosyncrasique) et affiche la **probabilité
  de gain**, l'intervalle 5-95 %, la perte maximale médiane et la perte moyenne
  des 5 % pires scénarios. **L'alpha supposé est nul par défaut** : la simulation
  ne suppose pas la conclusion qu'elle teste. `--alpha 0.038` permet de tester
  l'hypothèse de la littérature académique.
- `backtest` rejoue la stratégie sur *vos* données de prix, avec achat au plus
  tôt à la date de publication (fin de trimestre + 45 jours) et frais de
  transaction. Il ne fabrique jamais de données.
- `marches` teste le dispositif de risque sur de vraies séries de marché
  (voir ci-dessous).

---

## Backtest sur marchés réels

```bash
python3 outils/telecharger_series.py     # S&P 500 + or, sources publiques
python3 -m superinvestors.cli marches
```

Ce que cette commande mesure : **le dispositif de risque**, qui est agnostique
à l'actif — cible de volatilité, coupe-circuit sur perte, frais de rotation,
le tout dimensionné avec la seule information disponible avant chaque période.

Résultats sur août 2023 – juillet 2026 (36 points mensuels, dispositif actif
sur les 24 derniers mois) :

| Marché | TCAC brut | TCAC net | Vol brute | Vol nette | Perte max brute | Perte max nette |
|---|---:|---:|---:|---:|---:|---:|
| S&P 500 | +17,7 % | +16,5 % | 11,5 % | 11,0 % | −11,1 % | −11,1 % |
| Or (XAU/USD) | +29,8 % | +33,4 % | 16,7 % | 15,0 % | −18,9 % | −13,1 % |

Sur l'or, le dispositif a conservé 114 % de la hausse en évitant 31 % de la
perte maximale ; sur le S&P 500, il a coûté 1,2 point de performance sans rien
éviter — un marché qui monte régulièrement ne récompense pas la prudence. Le
panier équipondéré des deux, lui, tombe à 9,6 % de volatilité (corrélation
mesurée : **−0,11**), sous la cible : le dispositif n'a alors rien à réduire.
**La diversification a fait plus pour le risque que le pilotage de
l'exposition.**

Ce que cette commande **ne** mesure **pas** : la sélection de titres issue des
13F. La tester sur trois ans exigerait douze photographies trimestrielles par
gérant ; nous n'en avons qu'une. Appliquer le portefeuille de 2026 aux années
2023-2025 reviendrait à acheter des titres choisis après coup.

Réserves de méthode et sources détaillées : [`donnees/README.md`](donnees/README.md).

---

## Brancher des données réelles

### Prix

Le backtest attend un CSV au format long :

```csv
date,ticker,close
2024-01-02,SPY,472.65
2024-01-02,AAPL,185.64
```

Exemple de récupération (à exécuter sur votre machine, la dépendance n'est pas
requise par le module) :

```python
import yfinance as yf

tickers = ["SPY", "AMZN", "GOOGL", "V", "TSM", "QSR", "UBER", "AAPL", "AXP", "GE"]
data = yf.download(tickers, start="2019-01-01", auto_adjust=True)["Close"]
data.stack().rename("close").rename_axis(["date", "ticker"]).reset_index().to_csv(
    "historique.csv", index=False
)
```

Puis :

```bash
python3 -m superinvestors.cli backtest --prix historique.csv
```

Les volatilités et bêtas par défaut (`data/universe.py`) sont alors **remplacés
par les valeurs mesurées** sur votre historique.

### Portefeuilles

`data/holdings.py` encode les positions à la main, avec la source et le niveau de
fiabilité de chaque chiffre (`reported` / `estimated`). Pour brancher d'autres
données (extraction EDGAR, agrégateur payant, votre propre portefeuille) :

```bash
python3 -m superinvestors.cli marches      # dispositif de risque sur S&P 500 et or
python3 -m superinvestors.cli export --sortie positions.csv   # format de référence
```

puis rechargez le fichier modifié avec `data.loader.import_holdings_csv`.

---

## Architecture

```
superinvestors/
├── common.py              trimestres, z-scores, indice de Herfindahl
├── data/
│   ├── models.py          Manager, Portfolio, Holding, Asset (invariants validés)
│   ├── managers.py        13 gérants : style, horizon, palmarès, thèse, éligibilité
│   ├── holdings.py        dépôts T2 2026 encodés, avec sources et fiabilité
│   ├── universe.py        secteur, thème, volatilité et bêta par titre
│   └── loader.py          construction, validation, import/export CSV
├── analysis/
│   ├── portfolio_stats.py concentration, recouvrements, table de consensus
│   ├── themes.py          traduction des titres en macro-paris
│   └── rationale.py       thèse documentée par titre (moteur / risque)
├── algo/
│   ├── scoring.py         les cinq facteurs et leurs décotes
│   ├── risk.py            corrélations, plafonds, volatilité cible, coupe-circuit
│   ├── portfolio.py       construction du portefeuille cible
│   ├── market_data.py     import de prix réels, mesure du risque, modèle de marché
│   ├── metrics.py         TCAC, Sharpe, Sortino, perte maximale, percentiles
│   └── backtest.py        simulation prospective et backtest historique
├── algo/overlay.py        dispositif de risque testé sur un marché quelconque
└── cli.py                 interface en ligne de commande
```

71 tests couvrent la cohérence des données, la mécanique du score, le respect des
contraintes de risque et l'absence d'anticipation dans le backtest.

---

## Limites, à lire avant d'utiliser

1. **Les données sont partielles.** Seules les principales lignes de chaque
   gérant sont encodées ; `Portfolio.covered_weight` indique ce qui est
   réellement couvert. Certaines pondérations sont reconstituées
   (`Confidence.ESTIMATED`) et marquées comme telles.
2. **Le 13F ne montre ni ventes à découvert, ni dérivés, ni actifs non
   américains.** Un gérant peut être globalement neutre au marché alors que son
   13F paraît agressivement acheteur.
3. **Les volatilités et bêtas par défaut sont des ordres de grandeur.** Utilisez
   `--prix` pour les mesurer.
4. **Une simulation n'est pas un backtest, et un backtest n'est pas un
   résultat.** Les sorties du mode simulé sont étiquetées comme telles à
   l'écran ; ne les citez jamais hors de ce contexte.
5. **Le consensus des grands gérants est aussi un facteur de risque.** 39 % du
   capital de ces portefeuilles porte sur un seul thème. Le plafond de 40 % par
   macro-pari limite la casse, il ne l'annule pas.

---

*Analyse et outil de recherche. Ne constitue pas un conseil en investissement.*
