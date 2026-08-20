/**
 * Types du moteur FOMO.
 *
 * Convention : toutes les durées sont en millisecondes, tous les montants en USD,
 * tous les timestamps en epoch ms UTC.
 */

/** Tweet normalisé (indépendant de la source : X API v2, scraper, dump...). */
export type Tweet = {
  id: string;
  authorId: string;
  createdAt: number;
  text: string;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  /** true si le tweet est un RT pur (pas de texte ajouté). */
  isRetweet: boolean;
  lang?: string;
};

/** Profil d'un auteur, utilisé pour pondérer la portée et détecter les fermes de bots. */
export type Author = {
  id: string;
  username: string;
  followers: number;
  following: number;
  tweetCount: number;
  /** Date de création du compte (epoch ms). */
  createdAt: number;
  verified: boolean;
  hasDefaultAvatar: boolean;
};

/** Un « candidat » = un token repéré, avec son contexte social et on-chain. */
export type Candidate = {
  /** Adresse du contrat / mint. Clé d'identité réelle du token. */
  address: string;
  chain: Chain;
  symbol: string;
  name: string;
  /** Première fois que le moteur a vu ce token mentionné (epoch ms). */
  firstSeenAt: number;
};

export type Chain = 'solana' | 'ethereum' | 'base' | 'bsc' | 'arbitrum' | 'unknown';

/** Snapshot de marché à un instant t (typiquement fourni par Dexscreener). */
export type MarketSnapshot = {
  address: string;
  chain: Chain;
  symbol: string;
  name: string;
  fetchedAt: number;
  priceUsd: number;
  /** Age du pool de liquidité (ms). */
  pairAgeMs: number;
  liquidityUsd: number;
  fdvUsd: number;
  marketCapUsd: number;
  volume: Windowed;
  priceChangePct: Windowed;
  txns: {
    m5: TxCount;
    h1: TxCount;
    h6: TxCount;
    h24: TxCount;
  };
  /** Nombre de holders si la source le fournit. */
  holders?: number;
  /** Nombre de holders au snapshot précédent, pour dériver la croissance. */
  holdersPrev?: number;
};

export type Windowed = {
  m5: number;
  h1: number;
  h6: number;
  h24: number;
};

export type TxCount = { buys: number; sells: number };

/** Audit de sécurité du token (rugcheck, goplus, honeypot.is...). */
export type SecurityReport = {
  address: string;
  chain: Chain;
  /** Autorité de mint révoquée (Solana) / pas de fonction mint (EVM). */
  mintRevoked: boolean | null;
  /** Autorité de freeze révoquée. */
  freezeRevoked: boolean | null;
  /** Part de la LP brûlée ou verrouillée, 0..1. */
  lpBurnedPct: number | null;
  /** Part cumulée des 10 plus gros holders hors LP/burn/CEX, 0..1. */
  top10Pct: number | null;
  /** Part détenue par le déployeur, 0..1. */
  devHoldingPct: number | null;
  /** true si le dev a déjà vendu tout ou partie de son allocation. */
  devSold: boolean | null;
  /** Taxe à la vente, 0..1. Un honeypot ressort à 1. */
  sellTaxPct: number | null;
  /** true si la simulation de vente échoue. */
  honeypot: boolean | null;
};

/** Ensemble des tweets + auteurs rattachés à un candidat sur la fenêtre d'analyse. */
export type SocialBundle = {
  address: string;
  tweets: Tweet[];
  authors: Map<string, Author>;
  /** Comptes d'influence suivis manuellement (KOL, célébrités, comptes officiels). */
  kolIds: Set<string>;
};

/** Un signal élémentaire : valeur brute + score normalisé 0..1 + explication. */
export type Signal = {
  key: string;
  /** Valeur brute mesurée, pour l'audit et les logs. */
  raw: number;
  /** Score normalisé dans [0, 1]. */
  score: number;
  /** Explication lisible, affichée dans le rapport. */
  detail: string;
};

/** Un verrou de sécurité : multiplicateur dans [0, 1] appliqué au score final. */
export type Gate = {
  key: string;
  multiplier: number;
  reason: string;
  /** true si le multiplicateur est 0 (disqualification pure et simple). */
  fatal: boolean;
};

export const PHASES = [
  'DORMANT',
  'IGNITION',
  'BREAKOUT',
  'EUPHORIA',
  'DISTRIBUTION',
  'BOT_FARM',
  'INSIDER',
] as const;

export type Phase = (typeof PHASES)[number];

/** Résultat complet de l'évaluation d'un candidat. */
export type Evaluation = {
  candidate: Candidate;
  evaluatedAt: number;
  /** Score FOMO final, 0..100. */
  fomo: number;
  /** Sous-scores par bloc, 0..1. */
  blocks: {
    social: number;
    onchain: number;
    coherence: number;
    timing: number;
  };
  /** Confiance dans le score, 0..1 : pénalise les données manquantes. */
  confidence: number;
  phase: Phase;
  signals: Signal[];
  gates: Gate[];
  /** Raisons fatales éventuelles (score forcé à 0). */
  vetoes: string[];
};

/** Point d'historique conservé pour calculer vitesses et accélérations. */
export type HistoryPoint = {
  at: number;
  mentions: number;
  uniqueAuthors: number;
  priceUsd: number;
  volumeM5: number;
  holders?: number;
  fomo?: number;
};
