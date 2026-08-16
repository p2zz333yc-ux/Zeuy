"""Télécharge des séries de prix publiques et les met au format du backtest.

Sources retenues, toutes publiques, versionnées et mises à jour par
intégration continue :

* **S&P 500** — https://github.com/datasets/s-and-p-500
  Série mensuelle de Robert Shiller, prolongée après juin 2023 par les
  données S&P 500 de la Réserve fédérale. ⚠️ Il s'agit d'une **moyenne
  mensuelle des cours quotidiens**, pas d'un cours de fin de mois : cela
  lisse mécaniquement la volatilité mesurée.
* **Or (XAU/USD)** — https://github.com/datasets/gold-prices
  Prix mensuel en dollars par once troy, source Banque mondiale
  (Commodity Markets), équivalent au fixing de Londres.
* **Nasdaq** — aucune source gratuite, à jour et accessible en lecture
  directe n'a pu être trouvée. Fournissez votre propre fichier avec
  ``--nasdaq mon_fichier.csv`` (colonnes ``date,close`` ou
  ``Date,Close``) ; il sera intégré sous le symbole ``NDX``.

Usage :

    python3 outils/telecharger_series.py
    python3 outils/telecharger_series.py --nasdaq ~/nasdaq_mensuel.csv
"""

from __future__ import annotations

import argparse
import csv
import io
import sys
import urllib.request
from datetime import date
from pathlib import Path

SP500_URL = "https://raw.githubusercontent.com/datasets/s-and-p-500/main/data/data.csv"
GOLD_URL = "https://raw.githubusercontent.com/datasets/gold-prices/main/data/monthly.csv"

RACINE = Path(__file__).resolve().parent.parent
SORTIE = RACINE / "donnees" / "marches_mensuels.csv"


def _telecharger(url: str) -> str:
    with urllib.request.urlopen(url, timeout=60) as reponse:  # noqa: S310 — URL en dur
        return reponse.read().decode("utf-8")


def _mois(valeur: str) -> str:
    """Normalise une date en ``AAAA-MM``."""
    return valeur.strip()[:7]


def charger_sp500(texte: str) -> dict[str, float]:
    return {
        _mois(ligne["Date"]): float(ligne["SP500"])
        for ligne in csv.DictReader(io.StringIO(texte))
        if ligne.get("SP500")
    }


def charger_or(texte: str) -> dict[str, float]:
    return {
        _mois(ligne["Date"]): float(ligne["Price"])
        for ligne in csv.DictReader(io.StringIO(texte))
        if ligne.get("Price")
    }


def charger_fichier_local(chemin: Path) -> dict[str, float]:
    """Lit un CSV utilisateur : deux colonnes date et clôture, quelle que soit la casse."""
    series: dict[str, float] = {}
    with chemin.open(newline="", encoding="utf-8") as handle:
        lecteur = csv.DictReader(handle)
        if not lecteur.fieldnames:
            raise ValueError(f"{chemin} : fichier vide")
        colonnes = {nom.lower().strip(): nom for nom in lecteur.fieldnames}
        col_date = colonnes.get("date")
        col_close = colonnes.get("close") or colonnes.get("cloture") or colonnes.get("clôture")
        if not col_date or not col_close:
            raise ValueError(
                f"{chemin} : colonnes 'date' et 'close' attendues, trouvé {lecteur.fieldnames}"
            )
        for ligne in lecteur:
            valeur = (ligne[col_close] or "").replace(",", "").strip()
            if valeur:
                series[_mois(ligne[col_date])] = float(valeur)
    return series


def construire(series: dict[str, dict[str, float]], depuis: str) -> list[tuple[str, str, float]]:
    """Aligne les séries sur les mois communs et renvoie des lignes date/ticker/close."""
    communs = sorted(set.intersection(*(set(s) for s in series.values())))
    communs = [m for m in communs if m >= depuis]
    if not communs:
        raise ValueError("aucun mois commun à toutes les séries sur la période demandée")
    return [
        (f"{mois}-01", ticker, valeurs[mois])
        for mois in communs
        for ticker, valeurs in series.items()
    ]


def main(argv: list[str] | None = None) -> int:
    analyseur = argparse.ArgumentParser(description=__doc__)
    analyseur.add_argument("--annees", type=int, default=3, help="profondeur d'historique")
    analyseur.add_argument("--nasdaq", help="CSV local pour le Nasdaq (date,close)")
    analyseur.add_argument("--sortie", default=str(SORTIE))
    args = analyseur.parse_args(argv)

    aujourdhui = date.today()
    depuis = f"{aujourdhui.year - args.annees:04d}-{aujourdhui.month:02d}"

    series: dict[str, dict[str, float]] = {}
    try:
        print(f"Téléchargement S&P 500 … {SP500_URL}")
        series["SPX"] = charger_sp500(_telecharger(SP500_URL))
        print(f"Téléchargement or      … {GOLD_URL}")
        series["XAUUSD"] = charger_or(_telecharger(GOLD_URL))
    except OSError as erreur:
        print(f"Échec du téléchargement : {erreur}", file=sys.stderr)
        return 1

    if args.nasdaq:
        chemin = Path(args.nasdaq).expanduser()
        print(f"Lecture Nasdaq         … {chemin}")
        series["NDX"] = charger_fichier_local(chemin)
    else:
        print(
            "Nasdaq                 … non inclus (aucune source publique accessible ; "
            "utilisez --nasdaq)"
        )

    lignes = construire(series, depuis)
    sortie = Path(args.sortie)
    sortie.parent.mkdir(parents=True, exist_ok=True)
    with sortie.open("w", newline="", encoding="utf-8") as handle:
        redacteur = csv.writer(handle)
        redacteur.writerow(["date", "ticker", "close"])
        redacteur.writerows((d, t, f"{v:.4f}") for d, t, v in lignes)

    mois = sorted({d for d, _, _ in lignes})
    print(
        f"\n{len(lignes)} lignes écrites dans {sortie}\n"
        f"{len(series)} séries · {len(mois)} mois · {mois[0]} → {mois[-1]}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
