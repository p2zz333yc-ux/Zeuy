# Scanner FOMO — détection d'allumage de memecoins

Moteur de détection à **deux pistes**, toutes deux branchées sur X (Twitter) :

1. **Piste annonces** — surveille des comptes précis et détecte l'annonce elle-même,
   souvent *avant* que le token existe. C'est le mécanisme des cas type TRUMP.
2. **Piste sociale** — mesure l'accélération de l'attention sur les tokens déjà en
   circulation, et la croise avec la confirmation on-chain.

Les deux se terminent par les mêmes verrous de sécurité, qui éliminent les contrats
piégés et les faux contrats publiés dans le sillage des vraies annonces.

```bash
npm run fomo:demo       # démonstration complète, sans aucune clé
npm run fomo:announce   # piste annonces seule
npm run fomo:test       # 44 tests
```

---

## Ce que ça fait, et ce que ça ne fait pas

**Ça ne prédit pas** qu'un token va faire ×100. Personne ne le peut : le prix d'un
memecoin dépend d'événements exogènes (un tweet d'une célébrité, un listing) qui ne
sont pas contenus dans les données passées. Un modèle qui prétend le contraire fait
du surapprentissage sur une poignée de cas survivants.

**Ça détecte** la signature statistique qui *précède* les moves paraboliques, et qui
elle est observable :

1. une accélération de l'attention portée par des comptes **distincts et réels**,
2. une confirmation **on-chain** (volume, pression acheteuse, croissance des holders)
   qui arrive **après** le signal social, avec 5 à 30 minutes de décalage,
3. un contrat qui ne permet pas au déployeur de tout reprendre.

Ces trois conditions réunies ne garantissent rien. Elles réduisent l'univers de
plusieurs milliers de lancements quotidiens à une poignée de candidats — et surtout,
elles écartent mécaniquement les rugs et les fermes de bots, qui sont la cause de la
grande majorité des pertes.

---

## Architecture

```
PISTE ANNONCES
timelines des comptes surveillés  ->  détection d'annonce  ->  rattachement à un token
                                       (type, portée,           (adresse confirmée ?
                                        surprise, anti-usurpation)  clones ?)
                                                    |
                                                    v  injection en « graine »
PISTE SOCIALE
découverte  ->  présélection  ->  enrichissement  ->  score  ->  phase  ->  alerte
(X + DEX)      (gratuit)          (X + audit)        (0-100)    (7 états)
```

| Fichier | Rôle |
|---|---|
| `src/watchlist.ts` | Comptes surveillés, résolution pseudonyme -> identifiant |
| `src/features/announcement.ts` | Détection d'annonce, surprise, contrôles anti-usurpation |
| `src/announcements.ts` | Piste annonces : timelines -> annonce -> token |
| `src/sources/x.ts` | Client X API v2 : recherche, timelines, résolution de comptes |
| `src/sources/dexscreener.ts` | Prix, liquidité, FDV, volumes, transactions |
| `src/sources/security.ts` | Audit contrat : rugcheck (Solana), GoPlus (EVM) |
| `src/features/social.ts` | 9 signaux sociaux + détection de bots |
| `src/features/onchain.ts` | 7 signaux de marché |
| `src/features/risk.ts` | Verrous de sécurité (multiplicateurs) |
| `src/features/coherence.ts` | Relation social ↔ on-chain, avance temporelle, timing |
| `src/score.ts` | Composition du score final |
| `src/phase.ts` | Classification en 7 phases |
| `src/pipeline.ts` | Orchestration d'une passe complète |
| `src/store.ts` | Historique persisté (indispensable aux vitesses) |

---

## Piste 1 — les annonces

C'est là que se joue le cas TRUMP, et c'est précisément ce qu'un compteur de mentions
ne peut pas voir : au moment de l'annonce, le token n'a **aucun historique**, donc
aucune baseline, aucune vélocité, souvent même pas de pool. Le signal n'est pas
« beaucoup de gens en parlent » mais **« ce compte-là vient de dire ça »**.

### Ce qui fait la force d'une annonce

| Signal | Poids | Pourquoi |
|---|---|---|
| **type** | ×1 | `CA_DROP` (adresse publiée) > `LAUNCH` > `TICKER_TEASE` > `ENDORSEMENT`. Une adresse est immédiatement tradable, sans interprétation. |
| **source** | 0.35 | Niveau du compte dans la watchlist : `OFFICIAL` 1.0, `KOL` 0.75, `COMMUNITY` 0.5, hors liste 0.3. |
| **portée** | 0.25 | log(abonnés). |
| **surprise** | 0.25 | **Le signal le plus discriminant.** Part des tweets récents du compte qui parlent de crypto. Un influenceur qui pousse un token par jour a une affinité proche de 1 : sa énième annonce n'apprend rien. Un compte qui n'en a jamais parlé et qui poste soudain un contrat est l'événement rare qui déplace un marché. |
| **fraîcheur** | 0.15 | À quinze minutes, le marché a lu. |

La détection couvre le vocabulaire français et anglais (« officiellement lancé »,
« now live », « CA : », « bientôt », « just deployed »...).

### Relier l'annonce au bon token

Deux chemins très inégaux :

- **l'adresse figure dans le tweet du compte surveillé** — aucune ambiguïté,
  `TOKEN_CONFIRME` ;
- **seul un ticker est cité** — il faut chercher, et n'importe qui peut déployer un
  token portant exactement le même symbole dans la minute qui suit.

Le discriminant décisif est **la date de création du pool** : un pool né après
l'annonce est le seul candidat plausible ; un token du même nom antérieur d'une
semaine est un homonyme, quand ce n'est pas un piège tendu d'avance.

| Statut | Signification |
|---|---|
| `TOKEN_CONFIRME` | adresse publiée par la source elle-même |
| `CLONES_MULTIPLES` | plusieurs tokens portent le ticker : **aucun** n'est retenu |
| `TOKEN_A_VERIFIER` | un seul candidat, mais son adresse ne vient pas de la source |
| `PAS_ENCORE_DE_TOKEN` | signal le plus précoce possible, et le plus exposé |
| `IGNOREE` | annonce bloquée par un contrôle anti-arnaque |

### Contrôles anti-arnaque

Suivre les annonces expose à un risque très concret : autour de chaque vraie annonce
se crée instantanément une nappe de faux comptes et de faux contrats. **Sans ces
contrôles, un détecteur d'annonces devient un détecteur d'arnaques.**

| Contrôle | Effet |
|---|---|
| pseudonyme imitant un compte suivi (`compte_0fficiel` vs `compte_officiel`) | **bloquant** |
| plusieurs adresses différentes dans le même tweet | **bloquant** |
| compte de moins de 30 jours, hors watchlist | **bloquant** |
| adresse publiée par un compte hors watchlist | signalé, non bloquant |

La détection d'usurpation normalise les substitutions visuelles (`0`/`o`, `1`/`l`/`i`,
`rn`/`m`), les suffixes ajoutés, et tolère une distance d'édition de 1.

### Ce que l'annonce change pour le scanner

Un token confirmé est injecté en **graine** dans la piste sociale : il contourne les
filtres de présélection qui supposent un token déjà en circulation (pas d'heure de
volume, pas de classement) — sinon on jetterait exactement ce qu'on cherche. Seule la
liquidité reste éliminatoire, parce qu'une position intenable reste intenable.

L'annonce devient alors un dixième signal social (`social.annonce`, poids 0.25), dont
la force **décroît par demi-vie d'une heure** sur six heures : une annonce n'est
traitée qu'une fois, mais ses effets durent bien au-delà de la passe qui l'a vue.

---

## Piste 2 — l'algorithme social + on-chain

### Forme de la formule

```
FOMO = 100 × (0.40·Social + 0.35·OnChain + 0.15·Cohérence + 0.10·Timing) × Π(verrous)
```

Le point important n'est pas les poids, c'est **la forme** :

- **additif entre les blocs** — un bloc faible peut être compensé par les autres,
  parce qu'un bon trade n'a pas besoin d'être parfait partout ;
- **multiplicatif pour la sécurité et l'authenticité** — un contrat dont l'autorité
  de mint est active, ou une hype fabriquée par 12 comptes, ne se compensent
  **jamais**. C'est exactement le piège des scanners qui moyennent tout : un rug
  parfaitement pumpé y ressort avec un excellent score.

### Bloc social (40 %)

| Signal | Ce qu'il mesure | Pourquoi |
|---|---|---|
| `volume` | mentions sur 15 min | seuil d'existence |
| `velocity` | z-score robuste vs sa propre baseline 24 h | 40 mentions, c'est énorme pour un inconnu et ridicule pour DOGE |
| `acceleration` | v(t) / v(t−1) | les moves paraboliques sont **convexes** : la dérivée seconde signale avant la première |
| `spread` | auteurs uniques / mentions | 200 tweets de 12 comptes ≠ 200 tweets de 180 comptes |
| `reach` | somme des log(abonnés), amortie par la probabilité de bot | la diffusion, pas le mégaphone |
| `kol` | plus gros compte suivi ayant posté | signal le plus **asymétrique** du moteur : c'est le mécanisme même du cas TRUMP |
| `depth` | (réponses + citations) / likes | les likes s'achètent, une controverse non |
| `authenticity` | 1 − part attribuable aux bots | **multiplicatif**, voir ci-dessous |
| `novelty` | ancienneté de la conversation | être tôt vaut mieux qu'être fort |

**Détection de bots.** Aucun critère n'est décisif seul ; on additionne des indices
faibles : âge du compte, avatar par défaut, ratio abonnés/abonnements, cadence de
publication irréaliste, et surtout **similarité de Jaccard entre les textes** — une
campagne payée recopie le même script sur des dizaines de comptes. Un profil inconnu
vaut 0.5, pas 1 : on ne condamne pas sur une absence de données.

### Bloc on-chain (35 %)

Liquidité (plancher **multiplicatif** : sous 15 k$ on ne peut pas sortir),
accélération du volume 5 min contre le rythme horaire, rotation du pool,
déséquilibre acheteur/vendeur, croissance des holders (la seule métrique
coûteuse à simuler), marge de progression (à 41 M$ de FDV le ×100 est derrière),
et structure de prix (on veut une jambe jeune, pas un rebond de cadavre).

### Bloc cohérence (15 %) — le cœur du système

C'est la relation entre les deux blocs précédents qui porte l'information, pas
leur somme :

| Régime | Lecture |
|---|---|
| **CONFIRMÉ** — social ↑ et volume ↑ | le seul régime vraiment exploitable |
| **SOCIAL SEUL** — bruit sans volume | campagne payée ou ferme de bots |
| **ON-CHAIN SEUL** — volume sans attention | accumulation d'initiés : autre thèse, autre risque |
| **ATONE** | rien |

Le moteur mesure aussi **l'avance du social sur le volume** (`estimateLead`). La
fenêtre idéale se situe entre 5 et 30 minutes : assez tôt pour ne pas payer le
move, assez tard pour qu'il soit confirmé.

### Verrous de sécurité (multiplicateurs)

| Condition | Effet |
|---|---|
| autorité de mint active | **×0** |
| autorité de freeze active | **×0** |
| honeypot / taxe de vente ≥ 10 % | **×0** |
| top 10 des holders ≥ 50 % | **×0** |
| pool de moins de 3 minutes | **×0** (rien n'est vérifiable) |
| LP non brûlée/verrouillée | ×0.25 |
| dev > 15 % de l'offre | ×0.2 |
| aucun audit disponible | ×0.35 |

### Les 7 phases

Deux tokens à 70/100 peuvent être l'un une entrée et l'autre une sortie. La phase
est donc plus actionnable que le score :

| Phase | Lecture |
|---|---|
| `IGNITION` | l'attention accélère, le prix ne l'a pas encore intégrée — **seule phase d'entrée** |
| `BREAKOUT` | confirmé mais entamé — entrée plus risquée |
| `EUPHORIA` | plus d'acheteur marginal disponible — c'est là qu'on sort |
| `DISTRIBUTION` | les gros sortent pendant que le retail achète |
| `BOT_FARM` | attention achetée |
| `INSIDER` | volume sans attention — à surveiller, ce n'est pas un signal FOMO |
| `DORMANT` | rien |

Une alerte n'est émise que si : score ≥ seuil **et** phase actionnable **et**
confiance ≥ 40 %. La **confiance** est un axe distinct du score : un 80/100 calculé
sur des données trouées ne vaut pas un 80/100 complet.

---

## Utilisation

### Démonstration hors ligne

```bash
npm run fomo:demo
```

Quatre scénarios synthétiques que le moteur doit savoir séparer — et qui servent
de tests de non-régression :

```
SCORE  CONF  PHASE         SYMBOLE     FDV
82.7   98%   IGNITION      HOPE        $2.10M     <- allumage authentique porté par un KOL
30.3   85%   BOT_FARM      SAFU        $400.0k    <- 90 tweets, 12 comptes, même script
27.8   90%   EUPHORIA      LATE        $41.00M    <- excellent token... il y a six heures
 0.0   85%   DISQUALIFIE   TRAP        $1.80M     <- signaux parfaits, mint non révoquée
```

(Les scores bougent de quelques points d'une exécution à l'autre : les fixtures sont
ancrées sur l'heure courante, donc le découpage en quarts d'heure se décale.)

`TRAP` est le cas qui justifie toute l'architecture : ses blocs social (0.59) et
on-chain (0.71) sont bons. Seuls les verrous l'éliminent.

La piste annonces sur les mêmes fixtures :

```
[TOKEN_CONFIRME]   CA_DROP — @compte_officiel (force 95/100, 9 min)
  "$HOPE est officiellement lancé. CA : 7xKXtg..."
  -> HOPE solana:7xKXtg... (100% · CONFIRME_PAR_LA_SOURCE)

[CLONES_MULTIPLES] CA_DROP — @alpha_calls (force 51/100, 5 min)
  [PRUDENCE] adresse publiée par un compte hors watchlist : origine invérifiable
  -> HOPE solana:CLoneH... (100% · CANDIDAT_NON_VERIFIE)  liquidité $6.0k
  -> HOPE solana:7xKXtg... ( 55% · CANDIDAT_NON_VERIFIE)  liquidité $180.0k
  => 2 tokens portent ce ticker. Aucun ne peut être retenu sans une adresse
     publiée par la source elle-même.

[IGNOREE]          CA_DROP — @compte_0fficiel (force 0/100, 6 min)
  [BLOQUANT] @compte_0fficiel imite @compte_officiel sans être le compte suivi
  [BLOQUANT] compte créé il y a 4 jours
```

### En réel

**1. Constituer la watchlist.** C'est le paramètre le plus déterminant de tout le
système : le moteur ne peut détecter que les annonces des comptes qu'on lui demande
de regarder.

```bash
cp fomo/fomo-watchlist.example.json fomo-watchlist.json
# éditer le fichier, puis résoudre les pseudonymes en identifiants stables
npm run fomo -- resolve
```

Les identifiants sont conservés dans le fichier, et c'est eux qui font foi : un
pseudonyme se change en deux clics, et un compte revendu ferait sinon suivre au
scanner quelqu'un d'autre sans que rien ne le signale.

**2. Lancer.**

```bash
export X_BEARER_TOKEN="..."                # X API v2, palier Basic minimum
export FOMO_KOL_IDS="1234567890,..."       # identifiants pondérant le signal social

npm run fomo -- watch --interval 300 --html rapport.html --verbose
npm run fomo -- announce                   # piste annonces seule, plus légère en quota
```

| Option | Effet |
|---|---|
| `--interval <s>` | intervalle entre deux passes (défaut 300) |
| `--watchlist <f.json>` | comptes surveillés (défaut `fomo-watchlist.json`) |
| `--config <f.json>` | surcharge des seuils |
| `--store <f.json>` | historique persisté (défaut `.fomo-history.json`) |
| `--seen <f.json>` | annonces déjà traitées, pour ne pas réalerter |
| `--memory <f.json>` | annonces actives rattachées aux tokens |
| `--html <f.html>` | rapport HTML autonome |
| `--max <n>` | candidats enrichis par passe (budget d'appels API) |
| `--no-announce` | désactive la piste annonces |
| `--json` | sortie brute |

### Sources de données

| Source | Clé | Coût | Note |
|---|---|---|---|
| **X API v2** | obligatoire | payant | Le palier gratuit **ne donne pas** accès à `search/recent`. Le scraping du site est contraire aux CGU et fait bannir l'IP en quelques minutes. |
| **X — timelines** | même jeton | même quota | `users/:id/tweets`. Chemin privilégié pour les annonces : la recherche par mots-clés a plusieurs minutes de latence d'indexation, la timeline d'un compte non — et sur ce type d'événement, quelques minutes décident de tout. |
| **Dexscreener** | non | gratuit | ~300 req/min |
| **rugcheck.xyz** | non | gratuit | Solana |
| **GoPlus Labs** | non | gratuit | EVM |

Le budget X est la contrainte structurante : on ne peut pas interroger le social de
4 000 tokens par heure. D'où la **présélection** sur données gratuites (liquidité,
volume, FDV, âge) avant de dépenser la moindre requête X.

---

## Calibration

Les seuils de `src/config.ts` sont des **hypothèses de départ**, pas des vérités.
Avant toute utilisation sérieuse :

1. Faites tourner `watch` en observation pure pendant deux à quatre semaines, en
   conservant `--json` de chaque passe.
2. Étiquetez a posteriori : quels tokens ont fait ×3 dans les 6 h suivantes ?
3. Mesurez la **précision par tranche de score** — si les candidats à 80 ne font pas
   mieux que ceux à 60, les poids ne servent à rien.
4. Ajustez d'abord les seuils (`midMentions`, `midVelocityZ`, `minLiquidityUsd`),
   les poids ensuite.

Sans cette étape, le score est un nombre bien présenté, rien de plus.

---

## Limites réelles

- **Vous n'êtes pas le plus rapide.** Des bots snipent le bloc de création. Ce moteur
  joue sur un horizon de minutes, pas de millisecondes : il ne gagnera jamais la
  course à la latence, il cherche à mieux filtrer.
- **Environnement adverse.** Les signaux de ce document sont publics ; ceux qui
  fabriquent des lancements les connaissent et optimisent contre eux (comptes vieillis,
  textes générés, distribution de holders truquée). Tout modèle figé se dégrade.
- **Biais du survivant.** Pour un TRUMP, des dizaines de milliers de lancements
  meurent sans laisser de trace dans les données que l'on regarde.
- **Les verrous ne couvrent pas tout.** Une LP brûlée n'empêche ni un dev de vendre
  son allocation, ni une équipe d'abandonner le projet.
- **Une annonce authentique ne dit rien du contrat.** Les deux pistes sont
  indépendantes : un compte parfaitement légitime peut annoncer un token dont la
  structure est catastrophique. Un `TOKEN_CONFIRME` doit toujours repasser par le
  scanner complet.
- **Les contrôles anti-usurpation sont un filet, pas une preuve.** Ils attrapent les
  imitations de pseudonyme et les tweets à plusieurs adresses, pas un compte
  authentique réellement compromis.
- **Rien ici n'est un conseil en investissement.** Le taux de perte sur cette classe
  d'actifs est extrêmement élevé, y compris sur des candidats bien notés.
