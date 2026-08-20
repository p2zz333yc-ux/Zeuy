import type { Fixture } from '../src/providers.ts';
import type { WatchedAccount } from '../src/watchlist.ts';
import type { Author, Tweet } from '../src/types.ts';

const HOPE_CA = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
const CLONE_CA = 'CLoneHopeFake9999999999999999999999999999999';

/**
 * Quatre scénarios synthétiques qui couvrent les cas que le moteur doit savoir
 * séparer. Ils servent de tests de non-régression : si une modification des
 * poids fait passer le rug devant l'ignition, le test échoue.
 */
export const demoFixture = (now: number): Fixture => ({
  now,
  tokens: [
    ignitionToken(now),
    botFarmToken(now),
    rugToken(now),
    euphoriaToken(now),
    cloneToken(now),
  ],
  timelines: { 'kol-1': officialTimeline(now) },
});

/** Watchlist de démonstration : un seul compte, de niveau OFFICIAL. */
export const demoWatchlist = (): WatchedAccount[] => [
  { id: 'kol-1', username: 'compte_officiel', tier: 'OFFICIAL', label: 'Compte officiel (démo)' },
];

/**
 * Tweets récoltés hors watchlist.
 *
 * Deux minutes après une vraie annonce, c'est ce flux-là qui se remplit de faux
 * comptes et de faux contrats : c'est donc lui qui doit être filtré, pas la
 * watchlist qui est sûre par construction.
 */
export const demoExtraTweets = (now: number): { tweets: Tweet[]; authors: Map<string, Author> } => {
  // Usurpateur : « 0 » à la place du « o » dans le pseudonyme.
  const impostor = author('fake-1', 'compte_0fficiel', 8_400, 30, now - 4 * 864e5);
  // Opportuniste : compte réel mais sans autorité, qui relaie un contrat clone.
  const opportunist = author('opp-1', 'alpha_calls', 12_000, 900, now - 600 * 864e5);

  return {
    tweets: [
      tweet(
        'fake-tweet',
        'fake-1',
        now - 6 * MIN,
        `officiel : $HOPE est lancé, le contrat est ${CLONE_CA}`,
        900, 300, 40, 12,
      ),
      tweet(
        'opp-tweet',
        'opp-1',
        now - 5 * MIN,
        `$HOPE vient d'être annoncé, le contrat circule déjà ${CLONE_CA}`,
        400, 90, 30, 8,
      ),
    ],
    authors: new Map([
      [impostor.id, impostor],
      [opportunist.id, opportunist],
    ]),
  };
};

/**
 * Timeline du compte officiel : huit tweets sans rapport avec la crypto, puis
 * l'annonce. C'est ce contraste que mesure le signal de surprise — un compte
 * qui pousse un token par jour n'apprend rien à personne.
 */
const officialTimeline = (now: number): { tweets: Tweet[]; author: Author } => {
  const ordinary = [
    'merci à toutes les équipes pour le travail de cette semaine',
    'belle soirée hier, beaucoup de monde et une ambiance excellente',
    'nous publierons le calendrier complet dans les prochains jours',
    'interview demain matin, les détails suivront',
    'félicitations à l’équipe pour ce résultat',
    'quelques photos des coulisses de la journée',
    'le déplacement de la semaine prochaine est confirmé',
    'répondrai aux questions les plus fréquentes bientôt',
  ].map((text, i) => tweet(`tl-${i}`, 'kol-1', now - (i + 1) * 12 * 3_600_000, text, 12_000, 2_000, 900, 200));

  return {
    author: OFFICIAL,
    tweets: [
      ...ordinary,
      tweet(
        'annonce-officielle',
        'kol-1',
        now - 9 * MIN,
        `$HOPE est officiellement lancé. CA : ${HOPE_CA}`,
        41_000, 12_000, 8_400, 3_100,
      ),
    ],
  };
};

/**
 * Le token clone : même symbole, déployé dans la foulée de l'annonce, liquidité
 * dérisoire. Il n'existe que pour capter les acheteurs qui cherchent « $HOPE ».
 */
const cloneToken = (now: number) => ({
  market: {
    address: CLONE_CA,
    chain: 'solana',
    symbol: 'HOPE',
    name: 'Hope',
    fetchedAt: now,
    priceUsd: 0.0004,
    pairAgeMs: 7 * MIN,
    liquidityUsd: 6_000,
    fdvUsd: 240_000,
    marketCapUsd: 240_000,
    volume: { m5: 30_000, h1: 30_000, h6: 30_000, h24: 30_000 },
    priceChangePct: { m5: 140, h1: 140, h6: 140, h24: 140 },
    txns: {
      m5: { buys: 300, sells: 20 },
      h1: { buys: 300, sells: 20 },
      h6: { buys: 300, sells: 20 },
      h24: { buys: 300, sells: 20 },
    },
  },
  security: {
    address: CLONE_CA,
    chain: 'solana',
    mintRevoked: true,
    freezeRevoked: true,
    lpBurnedPct: 0,
    top10Pct: 0.78,
    devHoldingPct: 0.4,
    devSold: false,
    sellTaxPct: 0,
    honeypot: false,
  },
  tweets: [],
  authors: [],
  kolIds: [],
});

const MIN = 60_000;

/**
 * Formulations volontairement variées : une conversation réelle ne recopie pas
 * le même message, et c'est précisément ce que mesure le détecteur de doublons.
 */
const ORGANIC_TEXTS = [
  "je viens d'entrer sur $HOPE, la profondeur du carnet tient pour l'instant",
  'quelqu’un a vérifié qui détient la LP avant que ça parte plus haut ?',
  'le compte officiel vient de poster, ça change complètement la donne',
  'prudence quand même, le graphique a déjà fait une belle jambe',
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU voilà le contrat pour ceux qui cherchent',
  'holders en forte hausse depuis vingt minutes, distribution plutôt saine',
  'je garde une partie, je prends mes frais sur le reste comme d’habitude',
  'attention aux faux contrats qui circulent déjà en réponse',
  'volume solide, pas juste des bots qui se renvoient la balle',
  'première fois que je vois autant de comptes différents en parler aussi vite',
];

/** Combinées aux ouvertures, elles donnent assez de variété pour 60 messages distincts. */
const ORGANIC_ENDINGS = [
  'à surveiller de près pendant la prochaine heure',
  'mais je ne mets que ce que je peux perdre',
  'le carnet a l’air moins fin qu’il y a dix minutes',
  'quelqu’un connaît le dev derrière ce projet ?',
  'ça sent la rotation depuis les autres tickers du jour',
  'bref, position ouverte avec un stop mental serré',
];

const organicText = (i: number): string =>
  `${ORGANIC_TEXTS[i % ORGANIC_TEXTS.length]} ${ORGANIC_ENDINGS[Math.floor(i / ORGANIC_TEXTS.length) % ORGANIC_ENDINGS.length]}`;

/** Scénario 1 — allumage authentique porté par un gros compte. Le cas « TRUMP ». */
const ignitionToken = (now: number) => {
  const authors: Author[] = [
    OFFICIAL,
    ...Array.from({ length: 60 }, (_, i) =>
      author(`org-${i}`, `trader${i}`, 400 + i * 350, 800, now - (200 + i * 5) * 864e5),
    ),
  ];

  const tweets: Tweet[] = [];
  // Bruit de fond réaliste sur 24 h : la baseline sans laquelle la vélocité ne veut rien dire.
  for (let b = 0; b < 92; b++) {
    for (let k = 0; k < 2; k++) {
      tweets.push(
        tweet(`bg-${b}-${k}`, `org-${(b + k) % 60}`, now - (24 * 60 - b * 15) * MIN, `on regarde $HOPE tranquillement ${b}`, 3, 1, 1, 0),
      );
    }
  }
  // Bucket t-1 : ça commence à frémir.
  for (let i = 0; i < 14; i++) {
    tweets.push(tweet(`pre-${i}`, `org-${i}`, now - (16 + i % 5) * MIN, `quelqu'un a vu le volume sur $HOPE ? ${i}`, 12, 3, 4, 1));
  }
  // Bucket courant : le KOL poste, la diffusion explose sur des comptes distincts.
  tweets.push(tweet('kol-tweet', 'kol-1', now - 9 * MIN, 'HOPE. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 41_000, 12_000, 8_400, 3_100));
  for (let i = 0; i < 58; i++) {
    tweets.push(
      tweet(
        `now-${i}`,
        `org-${i}`,
        now - (8 - (i % 8)) * MIN,
        organicText(i),
        30 + i,
        8 + i,
        14 + i,
        5 + i,
      ),
    );
  }

  return {
    market: {
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      chain: 'solana',
      symbol: 'HOPE',
      name: 'Hope',
      fetchedAt: now,
      priceUsd: 0.0021,
      pairAgeMs: 95 * MIN,
      liquidityUsd: 180_000,
      fdvUsd: 2_100_000,
      marketCapUsd: 2_100_000,
      volume: { m5: 240_000, h1: 900_000, h6: 900_000, h24: 900_000 },
      priceChangePct: { m5: 6, h1: 28, h6: 28, h24: 28 },
      txns: {
        m5: { buys: 820, sells: 210 },
        h1: { buys: 4100, sells: 1600 },
        h6: { buys: 4100, sells: 1600 },
        h24: { buys: 4100, sells: 1600 },
      },
      holders: 3100,
      holdersPrev: 2400,
    },
    security: {
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      chain: 'solana',
      mintRevoked: true,
      freezeRevoked: true,
      lpBurnedPct: 1,
      top10Pct: 0.14,
      devHoldingPct: 0.012,
      devSold: false,
      sellTaxPct: 0,
      honeypot: false,
    },
    tweets,
    authors,
    kolIds: ['kol-1'],
  };
};

/** Scénario 2 — beaucoup de bruit, aucun humain derrière. */
const botFarmToken = (now: number) => {
  const authors: Author[] = Array.from({ length: 12 }, (_, i) =>
    author(`bot-${i}`, `x${i}gem`, 18, 1900, now - 3 * 864e5, false, true, 4200),
  );
  const tweets: Tweet[] = [];
  for (let i = 0; i < 90; i++) {
    tweets.push(
      tweet(
        `spam-${i}`,
        `bot-${i % 12}`,
        now - (i % 13) * MIN,
        '$SAFU next 1000x gem dont miss this one huge potential',
        2,
        0,
        0,
        0,
      ),
    );
  }
  return {
    market: {
      address: 'BotFarm1111111111111111111111111111111111111',
      chain: 'solana',
      symbol: 'SAFU',
      name: 'Safu Gem',
      fetchedAt: now,
      priceUsd: 0.00004,
      pairAgeMs: 40 * MIN,
      liquidityUsd: 22_000,
      fdvUsd: 400_000,
      marketCapUsd: 400_000,
      volume: { m5: 900, h1: 14_000, h6: 14_000, h24: 14_000 },
      priceChangePct: { m5: 1, h1: 4, h6: 4, h24: 4 },
      txns: {
        m5: { buys: 9, sells: 8 },
        h1: { buys: 130, sells: 140 },
        h6: { buys: 130, sells: 140 },
        h24: { buys: 130, sells: 140 },
      },
    },
    security: {
      address: 'BotFarm1111111111111111111111111111111111111',
      chain: 'solana',
      mintRevoked: true,
      freezeRevoked: true,
      lpBurnedPct: 1,
      top10Pct: 0.22,
      devHoldingPct: 0.02,
      devSold: false,
      sellTaxPct: 0,
      honeypot: false,
    },
    tweets,
    authors,
    kolIds: [],
  };
};

/** Scénario 3 — signaux sociaux et on-chain corrects, mais le contrat est un piège. */
const rugToken = (now: number) => {
  const authors: Author[] = Array.from({ length: 40 }, (_, i) =>
    author(`r-${i}`, `deg${i}`, 900 + i * 40, 700, now - 400 * 864e5),
  );
  const tweets: Tweet[] = Array.from({ length: 70 }, (_, i) =>
    tweet(`r-${i}`, `r-${i % 40}`, now - (i % 12) * MIN, `$TRAP ça part fort là ${i}`, 40, 12, 9, 3),
  );
  return {
    market: {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chain: 'base',
      symbol: 'TRAP',
      name: 'Trap',
      fetchedAt: now,
      priceUsd: 0.008,
      pairAgeMs: 70 * MIN,
      liquidityUsd: 140_000,
      fdvUsd: 1_800_000,
      marketCapUsd: 1_800_000,
      volume: { m5: 180_000, h1: 700_000, h6: 700_000, h24: 700_000 },
      priceChangePct: { m5: 12, h1: 70, h6: 70, h24: 70 },
      txns: {
        m5: { buys: 600, sells: 90 },
        h1: { buys: 3000, sells: 700 },
        h6: { buys: 3000, sells: 700 },
        h24: { buys: 3000, sells: 700 },
      },
    },
    security: {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chain: 'base',
      // Le dev peut encore émettre à volonté : disqualification immédiate.
      mintRevoked: false,
      freezeRevoked: true,
      lpBurnedPct: 0.1,
      top10Pct: 0.61,
      devHoldingPct: 0.22,
      devSold: false,
      sellTaxPct: 0.12,
      honeypot: false,
    },
    tweets,
    authors,
    kolIds: [],
  };
};

/** Scénario 4 — excellent token... il y a six heures. */
const euphoriaToken = (now: number) => {
  const authors: Author[] = Array.from({ length: 80 }, (_, i) =>
    author(`e-${i}`, `late${i}`, 2000 + i * 90, 500, now - 800 * 864e5),
  );
  const tweets: Tweet[] = [];
  for (let b = 0; b < 40; b++) {
    for (let k = 0; k < 9; k++) {
      tweets.push(tweet(`e-${b}-${k}`, `e-${(b * 3 + k) % 80}`, now - (b * 15 + k) * MIN, `$LATE on est déjà à x40 ${b}`, 90, 30, 20, 8));
    }
  }
  return {
    market: {
      address: 'LateM00n1111111111111111111111111111111111111',
      chain: 'solana',
      symbol: 'LATE',
      name: 'Late Moon',
      fetchedAt: now,
      priceUsd: 0.31,
      pairAgeMs: 11 * 3_600_000,
      liquidityUsd: 2_400_000,
      fdvUsd: 41_000_000,
      marketCapUsd: 41_000_000,
      volume: { m5: 300_000, h1: 6_000_000, h6: 30_000_000, h24: 30_000_000 },
      priceChangePct: { m5: -4, h1: 380, h6: 2400, h24: 2400 },
      txns: {
        m5: { buys: 400, sells: 620 },
        h1: { buys: 9000, sells: 8200 },
        h6: { buys: 40_000, sells: 30_000 },
        h24: { buys: 40_000, sells: 30_000 },
      },
      holders: 41_000,
      holdersPrev: 40_600,
    },
    security: {
      address: 'LateM00n1111111111111111111111111111111111111',
      chain: 'solana',
      mintRevoked: true,
      freezeRevoked: true,
      lpBurnedPct: 1,
      top10Pct: 0.18,
      devHoldingPct: 0.01,
      devSold: false,
      sellTaxPct: 0,
      honeypot: false,
    },
    tweets,
    authors,
    kolIds: [],
  };
};

/** Le compte surveillé de la démonstration, partagé par les deux pistes. */
const OFFICIAL: Author = {
  id: 'kol-1',
  username: 'compte_officiel',
  followers: 3_400_000,
  following: 120,
  tweetCount: 4_800,
  createdAt: Date.now() - 1200 * 864e5,
  verified: true,
  hasDefaultAvatar: false,
};

const tweet = (
  id: string,
  authorId: string,
  createdAt: number,
  text: string,
  likes: number,
  retweets: number,
  replies: number,
  quotes: number,
): Tweet => ({ id, authorId, createdAt, text, likes, retweets, replies, quotes, isRetweet: false, lang: 'fr' });

const author = (
  id: string,
  username: string,
  followers: number,
  following: number,
  createdAt: number,
  verified = false,
  hasDefaultAvatar = false,
  tweetCount = 900,
): Author => ({ id, username, followers, following, tweetCount, createdAt, verified, hasDefaultAvatar });
