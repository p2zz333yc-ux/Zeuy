import type { Author, Signal, Tweet } from '../types.ts';
import type { WatchedAccount, WatchTier } from '../watchlist.ts';
import { clamp, logScale } from '../util/math.ts';
import { extractAddresses, extractCashtags } from '../sources/x.ts';

/**
 * Détection d'annonces.
 *
 * C'est la piste qui compte vraiment pour les cas type TRUMP : le token n'a pas
 * d'historique de mentions, pas de baseline, souvent même pas encore de pool.
 * Le signal n'est pas « beaucoup de gens en parlent » mais « CE compte-là vient
 * de dire ÇA ». Compter des mentions ne détecte cet événement qu'après coup.
 */
export type AnnouncementKind = 'CA_DROP' | 'LAUNCH' | 'TICKER_TEASE' | 'ENDORSEMENT' | 'NONE';

export type Announcement = {
  tweet: Tweet;
  author: Author;
  kind: AnnouncementKind;
  /** Force de l'annonce, 0..1. */
  strength: number;
  /** Cashtags cités. */
  tickers: string[];
  /** Adresses de contrat citées dans le tweet lui-même. */
  addresses: string[];
  /** Niveau de confiance de la source, si le compte est sur la watchlist. */
  tier: WatchTier | null;
  signals: Signal[];
  /** Alertes anti-arnaque. Une entrée fatale annule la force de l'annonce. */
  warnings: Warning[];
};

export type Warning = { key: string; message: string; fatal: boolean };

const KIND_WEIGHT: Record<AnnouncementKind, number> = {
  CA_DROP: 1,
  LAUNCH: 0.9,
  TICKER_TEASE: 0.6,
  ENDORSEMENT: 0.4,
  NONE: 0,
};

const TIER_WEIGHT: Record<WatchTier, number> = {
  OFFICIAL: 1,
  KOL: 0.75,
  COMMUNITY: 0.5,
};

/** Marqueurs d'adresse explicite : « CA: », « contrat : », « mint »... */
const CA_MARKERS = /\b(ca|contract|contrat|mint|token address|adresse du contrat)\s*[:=]/i;

/** Vocabulaire de lancement, français et anglais. */
const LAUNCH_WORDS =
  /\b(officially|official|introducing|launch(ed|ing)?|now live|we are live|is live|just deployed|deployed|drops? now|mint is live|officiel|officielle|lancement|lance|lançons|vient de sortir|est en ligne|disponible maintenant)\b/i;

/** Vocabulaire d'annonce à venir. */
const TEASE_WORDS =
  /\b(coming soon|soon|tomorrow|tonight|announcement|announcing|big news|stay tuned|bient[oô]t|demain|ce soir|annonce|restez connect)/i;

/** Marqueurs généraux de conversation crypto, pour mesurer l'habitude d'un compte. */
const CRYPTO_MARKERS =
  /\b(crypto|token|coin|memecoin|solana|ethereum|pumpfun|pump\.fun|blockchain|airdrop|nft|defi|dex|liquidity|liquidit[eé]|wallet|onchain|on-chain)\b|\$[A-Za-z]{2,10}\b|0x[a-fA-F0-9]{40}/i;

/** Retire les accents pour que « lancé » et « lance » se comportent pareil. */
const normalize = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const classifyKind = (text: string): AnnouncementKind => {
  const t = normalize(text);
  const hasAddress = extractAddresses(text).length > 0;
  const hasTicker = extractCashtags(text).length > 0;

  // Une adresse de contrat est l'annonce la plus actionnable qui soit :
  // elle est immédiatement tradable, sans intermédiaire ni interprétation.
  if (hasAddress || CA_MARKERS.test(t)) return 'CA_DROP';
  if (LAUNCH_WORDS.test(t) && (hasTicker || CRYPTO_MARKERS.test(t))) return 'LAUNCH';
  if (TEASE_WORDS.test(t) && (hasTicker || CRYPTO_MARKERS.test(t))) return 'TICKER_TEASE';
  if (hasTicker) return 'ENDORSEMENT';
  return 'NONE';
};

/**
 * Part des tweets récents d'un compte qui parlent de crypto.
 *
 * Signal le plus discriminant de tout le module. Un influenceur qui pousse un
 * token par jour a une affinité proche de 1 : sa énième annonce n'apprend rien.
 * Un compte qui n'a jamais parlé de crypto et qui poste soudain un contrat est
 * l'événement rare qui déplace réellement un marché. On récompense la surprise,
 * pas le volume.
 */
export const cryptoAffinity = (recentTweets: Tweet[]): number => {
  if (recentTweets.length < 3) return 0.5; // trop peu d'historique pour conclure
  const hits = recentTweets.filter((t) => CRYPTO_MARKERS.test(t.text)).length;
  return hits / recentTweets.length;
};

export type DetectOptions = {
  tweet: Tweet;
  author: Author;
  now: number;
  /** Compte de la watchlist correspondant à l'auteur, si connu. */
  watched: WatchedAccount | null;
  /** Watchlist complète, pour détecter les comptes usurpateurs. */
  watchlist: WatchedAccount[];
  /** Tweets récents de l'auteur, pour mesurer sa surprise. */
  authorRecentTweets?: Tweet[];
};

export const detectAnnouncement = (opts: DetectOptions): Announcement => {
  const { tweet, author, now, watched } = opts;
  const kind = classifyKind(tweet.text);
  const tickers = extractCashtags(tweet.text);
  const addresses = extractAddresses(tweet.text);
  const warnings = checkWarnings(opts, addresses);

  const tier = watched?.tier ?? null;
  const tierScore = tier ? TIER_WEIGHT[tier] : 0.3;
  const kindScore = KIND_WEIGHT[kind];
  const reachScore = logScale(author.followers, 5_000_000);
  const affinity = cryptoAffinity(opts.authorRecentTweets ?? []);
  const surpriseScore = 1 - affinity;

  // Une annonce fraîche perd vite sa valeur : à quinze minutes, le marché a lu.
  const ageMin = Math.max(0, (now - tweet.createdAt) / 60_000);
  const freshness = clamp(1 - ageMin / 30);

  const signals: Signal[] = [
    { key: 'annonce.type', raw: kindScore, score: kindScore, detail: `type ${kind}` },
    { key: 'annonce.source', raw: tierScore, score: tierScore, detail: tier ? `compte ${tier} (@${author.username})` : `compte hors watchlist (@${author.username})` },
    { key: 'annonce.portee', raw: author.followers, score: reachScore, detail: `${fmt(author.followers)} abonnés` },
    { key: 'annonce.surprise', raw: affinity, score: surpriseScore, detail: opts.authorRecentTweets?.length ? `${Math.round(affinity * 100)}% de ses tweets récents parlent de crypto` : 'habitudes du compte inconnues' },
    { key: 'annonce.fraicheur', raw: ageMin, score: freshness, detail: `publiée il y a ${Math.round(ageMin)} min` },
  ];

  const fatal = warnings.some((w) => w.fatal);
  const strength = fatal
    ? 0
    : clamp(
        kindScore *
          (0.35 * tierScore + 0.25 * reachScore + 0.25 * surpriseScore + 0.15 * freshness) *
          (kind === 'NONE' ? 0 : 1),
      );

  return { tweet, author, kind, strength, tickers, addresses, tier, signals, warnings };
};

/**
 * Contrôles anti-arnaque.
 *
 * Suivre les annonces expose à un risque très concret : autour de chaque vraie
 * annonce se crée instantanément une nappe de faux comptes et de faux contrats.
 * Sans ces contrôles, un détecteur d'annonces devient un détecteur d'arnaques.
 */
const checkWarnings = (opts: DetectOptions, addresses: string[]): Warning[] => {
  const { author, watched, watchlist, now } = opts;
  const out: Warning[] = [];

  // Usurpation : pseudonyme proche d'un compte suivi, mais identifiant différent.
  if (!watched) {
    const target = watchlist.find((w) => isLookalike(w.username, author.username));
    if (target) {
      out.push({
        key: 'usurpation',
        message: `@${author.username} imite @${target.username} sans être le compte suivi`,
        fatal: true,
      });
    }
  }

  // Plusieurs adresses dans un même tweet : appât classique.
  if (addresses.length > 1) {
    out.push({
      key: 'adresses_multiples',
      message: `${addresses.length} adresses différentes dans le même tweet`,
      fatal: true,
    });
  }

  // Adresse publiée par un compte hors watchlist : rien ne prouve son origine.
  if (addresses.length > 0 && !watched) {
    out.push({
      key: 'adresse_non_verifiee',
      message: "adresse publiée par un compte hors watchlist : origine invérifiable",
      fatal: false,
    });
  }

  if (now - author.createdAt < 30 * 86_400_000) {
    out.push({
      key: 'compte_recent',
      message: `compte créé il y a ${Math.round((now - author.createdAt) / 86_400_000)} jours`,
      fatal: !watched,
    });
  }

  return out;
};

/**
 * Deux pseudonymes se ressemblent-ils au point d'être confondus ?
 * Couvre les substitutions visuelles (0/o, 1/l/i, rn/m) et les suffixes ajoutés.
 */
export const isLookalike = (reference: string, candidate: string): boolean => {
  const a = skeleton(reference);
  const b = skeleton(candidate);
  if (a === b) return true;
  // Suffixe ou préfixe collé : « elonmusk » vs « elonmusk_official ».
  if (b.length > a.length && (b.startsWith(a) || b.endsWith(a))) return true;
  return a.length >= 5 && levenshtein(a, b) <= 1;
};

const skeleton = (s: string): string =>
  s
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[_\-.]/g, '')
    .replace(/rn/g, 'm')
    .replace(/[01]/g, (c) => (c === '0' ? 'o' : 'l'))
    .replace(/[il]/g, 'l');

export const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const cur = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
};

const fmt = (n: number): string =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}k` : String(n);
