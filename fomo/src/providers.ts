import type { Config } from './config.ts';
import { fetchBoostedTokens, fetchTokenSnapshot } from './sources/dexscreener.ts';
import { fetchSecurity } from './sources/security.ts';
import { XClient, buildTokenQuery, extractAddresses } from './sources/x.ts';
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
 * Providers hors ligne, alimentés par un fichier de fixtures.
 * Sert aux tests, à la calibration et à la démonstration sans clé d'API.
 */
export type Fixture = {
  now: number;
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
