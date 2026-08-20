import type { Config } from './config.ts';
import { DEFAULT_CONFIG } from './config.ts';
import { detectAnnouncement } from './features/announcement.ts';
import type { Announcement } from './features/announcement.ts';
import type { SeenStore } from './store.ts';
import type { Author, Chain, MarketSnapshot, Tweet } from './types.ts';
import { findWatched } from './watchlist.ts';
import type { WatchedAccount } from './watchlist.ts';
import { clamp } from './util/math.ts';

/**
 * Piste « annonces » : surveiller des comptes précis plutôt que compter des mentions.
 *
 * Les deux pistes ne détectent pas la même chose et ne peuvent pas être fusionnées :
 *  - la piste sociale mesure une vague déjà partie, avec une baseline et une vélocité ;
 *  - la piste annonce détecte l'événement fondateur, sur un token qui n'a encore
 *    ni historique, ni volume, ni parfois même de pool.
 */
export type AnnouncementProviders = {
  /** Derniers tweets d'un compte surveillé. */
  timeline: (userId: string, since: number) => Promise<{ tweets: Tweet[]; authors: Map<string, Author> }>;
  /** Recherche de pools par ticker ou par nom. */
  searchToken: (query: string) => Promise<MarketSnapshot[]>;
  /** Données de marché d'une adresse précise. */
  market: (address: string) => Promise<MarketSnapshot | null>;
};

export type TokenTrust =
  /** L'adresse vient du tweet du compte surveillé lui-même. */
  | 'CONFIRME_PAR_LA_SOURCE'
  /** Le token correspond au ticker annoncé, mais rien ne prouve que ce soit le bon. */
  | 'CANDIDAT_NON_VERIFIE';

export type TokenMatch = {
  market: MarketSnapshot;
  confidence: number;
  trust: TokenTrust;
  reasons: string[];
};

export type AnnouncementStatus =
  | 'TOKEN_CONFIRME'
  | 'CLONES_MULTIPLES'
  | 'TOKEN_A_VERIFIER'
  | 'PAS_ENCORE_DE_TOKEN'
  | 'IGNOREE';

export type AnnouncementAlert = {
  announcement: Announcement;
  status: AnnouncementStatus;
  matches: TokenMatch[];
  advice: string;
};

export type WatchAnnouncementsOptions = {
  providers: AnnouncementProviders;
  watchlist: WatchedAccount[];
  seen: SeenStore;
  config?: Config;
  now?: number;
  /** Fenêtre de remontée des timelines. */
  lookbackMs?: number;
  /** Force minimale pour émettre une alerte. */
  minStrength?: number;
  /**
   * Tweets récoltés hors watchlist (recherche par mots-clés).
   *
   * Sans eux, les contrôles anti-usurpation ne serviraient à rien : les faux
   * comptes ne sont évidemment pas dans la watchlist, et c'est pourtant eux qui
   * publient les faux contrats dans les minutes suivant une vraie annonce.
   */
  extraTweets?: { tweets: Tweet[]; authors: Map<string, Author> };
  onProgress?: (message: string) => void;
};

export const watchAnnouncements = async (
  opts: WatchAnnouncementsOptions,
): Promise<AnnouncementAlert[]> => {
  const cfg = opts.config ?? DEFAULT_CONFIG;
  const now = opts.now ?? Date.now();
  const lookback = opts.lookbackMs ?? 30 * 60_000;
  const minStrength = opts.minStrength ?? 0.35;
  const log = opts.onProgress ?? (() => {});

  const alerts: AnnouncementAlert[] = [];

  for (const account of opts.watchlist) {
    if (!account.id) {
      log(`@${account.username} : identifiant non résolu, compte ignoré`);
      continue;
    }

    // On remonte plus loin que la fenêtre d'alerte : les tweets antérieurs
    // servent à mesurer l'habitude du compte, pas à déclencher une alerte.
    const { tweets, authors } = await opts.providers.timeline(account.id, now - 7 * 86_400_000);
    const author = authors.get(account.id);
    if (!author) continue;

    const recent = tweets.filter((t) => t.createdAt >= now - lookback);

    for (const tweet of recent) {
      if (opts.seen.has(tweet.id)) continue;
      opts.seen.mark(tweet.id, now);

      const announcement = detectAnnouncement({
        tweet,
        author,
        now,
        watched: findWatched(opts.watchlist, tweet.authorId),
        watchlist: opts.watchlist,
        // On exclut le tweet analysé de son propre historique de référence.
        authorRecentTweets: tweets.filter((t) => t.id !== tweet.id),
      });

      if (announcement.kind === 'NONE' || announcement.strength < minStrength) continue;

      const matches = await matchTokens(announcement, opts.providers, cfg, now);
      alerts.push(buildAlert(announcement, matches));
    }
  }

  // Deuxième source : tout ce que la recherche a ramené, comptes inconnus inclus.
  if (opts.extraTweets) {
    const { tweets, authors } = opts.extraTweets;
    for (const tweet of tweets) {
      if (tweet.createdAt < now - lookback) continue;
      if (opts.seen.has(tweet.id)) continue;
      const author = authors.get(tweet.authorId);
      if (!author) continue;
      opts.seen.mark(tweet.id, now);

      const announcement = detectAnnouncement({
        tweet,
        author,
        now,
        watched: findWatched(opts.watchlist, tweet.authorId),
        watchlist: opts.watchlist,
        authorRecentTweets: tweets.filter((t) => t.authorId === tweet.authorId && t.id !== tweet.id),
      });

      // Les annonces usurpées sont conservées volontairement : une alerte qui
      // dit « ce compte imite untel » vaut mieux qu'un silence, puisque
      // l'utilisateur, lui, va croiser ce tweet.
      const fatal = announcement.warnings.some((w) => w.fatal);
      if (announcement.kind === 'NONE') continue;
      if (!fatal && announcement.strength < minStrength) continue;

      const matches = fatal ? [] : await matchTokens(announcement, opts.providers, cfg, now);
      alerts.push(buildAlert(announcement, matches));
    }
  }

  opts.seen.prune(now);
  return alerts.sort((a, b) => b.announcement.strength - a.announcement.strength);
};

/** Adresses exploitables issues d'un lot d'alertes, pour les injecter dans le scanner. */
export const alertsToSeeds = (
  alerts: AnnouncementAlert[],
): Array<{ address: string; chain: Chain; strength: number; label: string }> => {
  const out = new Map<string, { address: string; chain: Chain; strength: number; label: string }>();
  for (const a of alerts) {
    if (a.status === 'IGNOREE' || a.status === 'PAS_ENCORE_DE_TOKEN') continue;
    for (const m of a.matches) {
      // Une correspondance non vérifiée entre dans le scanner avec une force
      // réduite : elle mérite d'être analysée, pas d'être crue sur parole.
      const factor = m.trust === 'CONFIRME_PAR_LA_SOURCE' ? 1 : 0.5;
      const strength = a.announcement.strength * m.confidence * factor;
      const existing = out.get(m.market.address);
      if (existing && existing.strength >= strength) continue;
      out.set(m.market.address, {
        address: m.market.address,
        chain: m.market.chain,
        strength,
        label: `annonce ${a.announcement.kind} de @${a.announcement.author.username} (${m.trust === 'CONFIRME_PAR_LA_SOURCE' ? 'source confirmée' : 'correspondance non vérifiée'})`,
      });
    }
  }
  return [...out.values()];
};

/**
 * Relie une annonce à un token réel.
 *
 * Deux chemins très inégaux :
 *  - l'adresse figure dans le tweet du compte surveillé : aucune ambiguïté ;
 *  - seul un ticker est cité : il faut chercher, et n'importe qui peut déployer
 *    un token portant exactement le même symbole dans la minute qui suit. C'est
 *    le mécanisme d'arnaque le plus courant autour des annonces, d'où le
 *    marquage explicite de la confiance sur chaque correspondance.
 */
export const matchTokens = async (
  announcement: Announcement,
  providers: AnnouncementProviders,
  cfg: Config,
  now: number,
): Promise<TokenMatch[]> => {
  // Chemin 1 — adresse donnée par la source elle-même.
  if (announcement.addresses.length === 1 && announcement.tier !== null) {
    const market = await providers.market(announcement.addresses[0]);
    if (market) {
      return [
        {
          market,
          confidence: 1,
          trust: 'CONFIRME_PAR_LA_SOURCE',
          reasons: ['adresse publiée directement par le compte surveillé'],
        },
      ];
    }
    return [];
  }

  // Chemin 2 — recherche par ticker, puis levée d'ambiguïté.
  const found = new Map<string, MarketSnapshot>();
  for (const ticker of announcement.tickers.slice(0, 3)) {
    for (const m of await providers.searchToken(ticker)) found.set(m.address, m);
  }

  const matches: TokenMatch[] = [];
  for (const market of found.values()) {
    const scored = scoreMatch(market, announcement, cfg, now);
    if (scored.confidence > 0.3) matches.push(scored);
  }

  return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
};

export const scoreMatch = (
  market: MarketSnapshot,
  announcement: Announcement,
  cfg: Config,
  now: number,
): TokenMatch => {
  const reasons: string[] = [];
  let confidence = 0;

  const tickers = announcement.tickers.map((t) => t.toUpperCase());
  if (tickers.includes(market.symbol.toUpperCase())) {
    confidence += 0.45;
    reasons.push(`symbole ${market.symbol} identique au ticker annoncé`);
  } else if (tickers.some((t) => market.name.toUpperCase().includes(t))) {
    confidence += 0.2;
    reasons.push('ticker retrouvé dans le nom du token');
  }

  // Le discriminant décisif : un pool créé APRÈS l'annonce est le seul candidat
  // plausible. Un token du même nom qui existait déjà est presque toujours un
  // homonyme sans rapport, quand ce n'est pas un piège tendu à l'avance.
  const createdAt = now - market.pairAgeMs;
  const delta = createdAt - announcement.tweet.createdAt;
  if (delta > -10 * 60_000 && delta < 6 * 3_600_000) {
    confidence += 0.35;
    reasons.push(
      delta >= 0
        ? `pool créé ${Math.round(delta / 60_000)} min après l'annonce`
        : `pool créé ${Math.round(-delta / 60_000)} min avant l'annonce`,
    );
  } else if (market.pairAgeMs > 7 * 86_400_000) {
    confidence -= 0.25;
    reasons.push('pool antérieur de plus d’une semaine : homonyme probable');
  }

  if (market.liquidityUsd >= cfg.onchain.minLiquidityUsd) {
    confidence += 0.1;
    reasons.push('liquidité suffisante pour être tradable');
  }

  if (announcement.addresses.includes(market.address)) {
    confidence += 0.3;
    reasons.push('adresse citée dans le tweet');
  }

  return {
    market,
    confidence: clamp(confidence),
    trust: announcement.addresses.includes(market.address) && announcement.tier !== null
      ? 'CONFIRME_PAR_LA_SOURCE'
      : 'CANDIDAT_NON_VERIFIE',
    reasons,
  };
};

const buildAlert = (announcement: Announcement, matches: TokenMatch[]): AnnouncementAlert => {
  const fatal = announcement.warnings.filter((w) => w.fatal);
  if (fatal.length > 0) {
    return {
      announcement,
      status: 'IGNOREE',
      matches: [],
      advice: `Annonce écartée : ${fatal.map((w) => w.message).join(' · ')}`,
    };
  }

  const confirmed = matches.filter((m) => m.trust === 'CONFIRME_PAR_LA_SOURCE');
  if (confirmed.length > 0) {
    return {
      announcement,
      status: 'TOKEN_CONFIRME',
      matches: confirmed,
      advice: "Adresse confirmée par la source. Passer le token au scanner complet avant toute décision : une annonce authentique ne dit rien de la structure du contrat.",
    };
  }

  // Plusieurs tokens portent le ticker annoncé : c'est la situation normale
  // trente secondes après une annonce, et celle où l'on se fait piéger.
  const plausible = matches.filter((m) => m.confidence >= 0.5);
  if (plausible.length > 1) {
    return {
      announcement,
      status: 'CLONES_MULTIPLES',
      matches: plausible,
      advice: `${plausible.length} tokens portent ce ticker. Aucun ne peut être retenu sans une adresse publiée par la source elle-même.`,
    };
  }

  if (plausible.length === 1) {
    return {
      announcement,
      status: 'TOKEN_A_VERIFIER',
      matches: plausible,
      advice: "Un seul candidat plausible, mais son adresse n'a pas été publiée par la source. À vérifier manuellement avant tout engagement.",
    };
  }

  return {
    announcement,
    status: 'PAS_ENCORE_DE_TOKEN',
    matches: [],
    advice: "Annonce détectée sans token correspondant. C'est le signal le plus précoce possible — et le plus exposé aux faux contrats qui vont apparaître dans les minutes qui suivent.",
  };
};
