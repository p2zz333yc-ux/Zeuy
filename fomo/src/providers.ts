import type { Config } from './config.ts';
import { fetchBoostedTokens, fetchTokenSnapshot, searchPairs } from './sources/dexscreener.ts';
import { fetchSecurity } from './sources/security.ts';
import { XClient, buildTokenQuery, extractAddresses } from './sources/x.ts';
import type { AnnouncementProviders } from './announcements.ts';
import type { Providers } from './pipeline.ts';
import type { Author, Chain, Tweet } from './types.ts';

/**
 * Requêtes de découverte : on ne cherche pas un token précis, on cherche la
 * FORME du message qui accompagne un lancement. Adapter cette liste est le
 * levier le plus rentable du système — c'est elle qui décide de ce que le
 * scanner peut voir.
 */
export const DISCOVERY_QUERIES = [
  '("CA:" OR "contract:" OR "just launched") (solana OR pumpfun OR base) -is:retweet lang:en',
  '(memecoin OR "meme coin") ("new" OR "launch" OR "stealth") -is:retweet',
];

export type LiveOptions = {
  xBearerToken?: string;
  config: Config;
  /** Comptes dont les tweets déclenchent une découverte prioritaire. */
  watchedAccounts?: string[];
};

export const buildLiveProviders = (opts: LiveOptions): Providers => {
  const x = opts.xBearerToken ? new XClient({ bearerToken: opts.xBearerToken }) : null;

  return {
    discover: async (now) => {
      const found = new Map<string, Chain>();

      // Source 1 — tokens promus sur Dexscreener : gratuit, sans clé, très réactif.
      for (const b of await fetchBoostedTokens()) {
        if (!found.has(b.address)) found.set(b.address, b.chain);
      }

      // Source 2 — adresses collées dans les tweets récents. C'est la voie qui
      // permet d'attraper un lancement AVANT qu'il n'apparaisse dans les classements.
      if (x) {
        const since = now - 30 * 60 * 1000;
        const queries = [...DISCOVERY_QUERIES];
        if (opts.watchedAccounts?.length) {
          const from = opts.watchedAccounts.map((u) => `from:${u}`).join(' OR ');
          queries.unshift(`(${from}) -is:retweet`);
        }
        for (const q of queries) {
          try {
            const { tweets } = await x.searchRecent(q, since);
            for (const t of tweets) {
              for (const addr of extractAddresses(t.text)) {
                if (!found.has(addr)) found.set(addr, 'unknown');
              }
            }
          } catch {
            // Une requête de découverte qui échoue ne doit pas casser la passe.
          }
        }
      }

      return [...found].map(([address, chain]) => ({ address, chain }));
    },

    market: (address) => fetchTokenSnapshot(address),

    security: (address, chain) => fetchSecurity(address, chain).catch(() => null),

    social: async (address, symbol, since) => {
      if (!x) return { tweets: [] as Tweet[], authors: new Map<string, Author>() };
      try {
        return await x.searchRecent(buildTokenQuery(address, symbol), since);
      } catch {
        return { tweets: [] as Tweet[], authors: new Map<string, Author>() };
      }
    },
  };
};

/**
 * Providers de la piste « annonces ».
 *
 * Séparés de ceux du scanner : ils interrogent des timelines de comptes précis
 * et la recherche de pools par ticker, là où le scanner interroge la recherche
 * par mots-clés et les classements. Ce ne sont ni les mêmes endpoints, ni les
 * mêmes quotas.
 */
export const buildLiveAnnouncementProviders = (bearerToken: string): AnnouncementProviders => {
  const x = new XClient({ bearerToken });
  return {
    timeline: (userId, since) => x.getUserTweets(userId, since),
    searchToken: (query) => searchPairs(query).catch(() => []),
    market: (address) => fetchTokenSnapshot(address).catch(() => null),
  };
};

/**
 * Providers hors ligne, alimentés par un fichier de fixtures.
 * Sert aux tests, à la calibration et à la démonstration sans clé d'API.
 */
export type Fixture = {
  now: number;
  /** Timelines des comptes surveillés, indexées par identifiant. */
  timelines?: Record<string, { tweets: Tweet[]; author: Author }>;
  tokens: Array<{
    market: Record<string, unknown>;
    security: Record<string, unknown> | null;
    tweets: Tweet[];
    authors: Author[];
    kolIds?: string[];
  }>;
};

export const buildFixtureProviders = (fixture: Fixture): Providers => ({
  discover: async () =>
    fixture.tokens.map((t) => ({
      address: t.market.address as string,
      chain: t.market.chain as Chain,
    })),
  market: async (address) => {
    const t = fixture.tokens.find((x) => x.market.address === address);
    return t ? (t.market as never) : null;
  },
  security: async (address) => {
    const t = fixture.tokens.find((x) => x.market.address === address);
    return t?.security ? (t.security as never) : null;
  },
  social: async (address) => {
    const t = fixture.tokens.find((x) => x.market.address === address);
    return {
      tweets: t?.tweets ?? [],
      authors: new Map((t?.authors ?? []).map((a) => [a.id, a])),
    };
  },
});

export const buildFixtureAnnouncementProviders = (fixture: Fixture): AnnouncementProviders => ({
  timeline: async (userId, since) => {
    const entry = fixture.timelines?.[userId];
    if (!entry) return { tweets: [], authors: new Map<string, Author>() };
    return {
      tweets: entry.tweets.filter((t) => t.createdAt >= since),
      authors: new Map([[entry.author.id, entry.author]]),
    };
  },
  searchToken: async (query) => {
    const q = query.toUpperCase();
    return fixture.tokens
      .filter(
        (t) =>
          String(t.market.symbol).toUpperCase() === q ||
          String(t.market.name).toUpperCase().includes(q),
      )
      .map((t) => t.market as never);
  },
  market: async (address) => {
    const t = fixture.tokens.find((x) => x.market.address === address);
    return t ? (t.market as never) : null;
  },
});
