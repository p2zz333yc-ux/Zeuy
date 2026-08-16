# Séries de marché

`marches_mensuels.csv` — format `date,ticker,close`, régénéré par
`python3 outils/telecharger_series.py`.

| Ticker | Marché | Source | Fréquence | Nature du prix |
|---|---|---|---|---|
| `SPX` | S&P 500 | [datasets/s-and-p-500](https://github.com/datasets/s-and-p-500) (Shiller, prolongé par les données S&P 500 de la Fed) | mensuelle | **moyenne mensuelle des cours quotidiens** |
| `XAUUSD` | Or au comptant | [datasets/gold-prices](https://github.com/datasets/gold-prices) (Banque mondiale, *Commodity Markets*) | mensuelle | dollars par once troy |
| `NDX` | Nasdaq | *aucune source publique gratuite, à jour et lisible en accès direct* | — | à fournir |

Fichier actuel : 36 mois, août 2023 → juillet 2026, récupéré le 16 août 2026.

## Deux réserves qui changent la lecture des résultats

1. **La série S&P 500 est une moyenne mensuelle, pas un cours de fin de
   mois.** Moyenner les cours d'un mois annule une partie des mouvements
   intramensuels : la volatilité mesurée (≈11 %) est sensiblement inférieure
   à la volatilité réelle de l'indice sur la période. Un dispositif calé sur
   une cible de volatilité voit donc un marché plus calme qu'il ne l'est et
   reste investi plus longtemps qu'il ne le ferait sur données quotidiennes.
2. **Trente-six points mensuels, ce n'est pas un échantillon.** Sur trois
   ans, un ratio de Sharpe ou un écart de performance annualisé se
   déplacent énormément pour peu de chose. Ces chiffres décrivent ce qui
   s'est produit ; ils ne mesurent pas une espérance.

## Ajouter le Nasdaq

Exportez une série mensuelle (colonnes `date` et `close`) depuis votre
courtier, Yahoo Finance ou toute autre source, puis :

```bash
python3 outils/telecharger_series.py --nasdaq ~/nasdaq_mensuel.csv
python3 -m superinvestors.cli marches
```

Le ticker `NDX` apparaîtra automatiquement dans tous les tableaux.

## Données quotidiennes

Le moteur ne dépend pas de la fréquence. Avec un historique quotidien :

```bash
python3 -m superinvestors.cli marches --prix quotidien.csv --periodes-par-an 252 --lookback 60
```
