import type { Author, Tweet } from '../types.ts';

/**
 * Client X (Twitter) API v2 — endpoint `tweets/search/recent`.
 *
 * Rappel réglementaire important : l'accès aux tweets passe obligatoirement par
 * l'API officielle et un token d'application. Le scraping du site est contraire
 * aux CGU et fait bannir l'IP en quelques minutes. Le palier gratuit ne donne
 * pas accès à la recherche : il faut au minimum le palier Basic.
 */
export type XClientOptions = {
  bearerToken: string;
  baseUrl?: string;
  /** Nombre maximum de pages parcourues par requête (100 tweets par page). */
  maxPages?: number;
  fetchImpl?: typeof fetch;
};

export type SearchResult = { tweets: Tweet[]; authors: Map<string, Author> };

const TWEET_FIELDS = 'created_at,public_metrics,author_id,lang,referenced_tweets';
const USER_FIELDS = 'created_at,public_metrics,verified,profile_image_url';

export class XClient {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly maxPages: number;
  private readonly doFetch: typeof fetch;
  /** Epoch ms avant lequel toute requête est inutile (429 en cours). */
  private rateLimitedUntil = 0;

  constructor(opts: XClientOptions) {
    this.token = opts.bearerToken;
    this.baseUrl = opts.baseUrl ?? 'https://api.x.com/2';
    this.maxPages = opts.maxPages ?? 3;
    this.doFetch = opts.fetchImpl ?? fetch;
  }

  /**
   * Recherche les tweets récents correspondant à `query`.
   * `startTime` est un epoch ms ; l'API n'accepte que les 7 derniers jours.
   */
  async searchRecent(query: string, startTime: number): Promise<SearchResult> {
    const tweets: Tweet[] = [];
    const authors = new Map<string, Author>();

    if (Date.now() < this.rateLimitedUntil) return { tweets, authors };

    let nextToken: string | undefined;
    for (let page = 0; page < this.maxPages; page++) {
      const url = new URL(`${this.baseUrl}/tweets/search/recent`);
      url.searchParams.set('query', query);
      url.searchParams.set('max_results', '100');
      url.searchParams.set('tweet.fields', TWEET_FIELDS);
      url.searchParams.set('expansions', 'author_id');
      url.searchParams.set('user.fields', USER_FIELDS);
      url.searchParams.set('start_time', new Date(startTime).toISOString());
      if (nextToken) url.searchParams.set('next_token', nextToken);

      const res = await this.doFetch(url, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (res.status === 429) {
        // On respecte la fenêtre annoncée plutôt que de marteler l'API.
        const reset = Number(res.headers.get('x-rate-limit-reset') ?? 0);
        this.rateLimitedUntil = reset > 0 ? reset * 1000 : Date.now() + 60_000;
        break;
      }
      if (!res.ok) {
        throw new Error(`X API ${res.status}: ${await res.text().catch(() => res.statusText)}`);
      }

      const body = (await res.json()) as XSearchResponse;
      for (const u of body.includes?.users ?? []) authors.set(u.id, toAuthor(u));
      for (const t of body.data ?? []) tweets.push(toTweet(t));

      nextToken = body.meta?.next_token;
      if (!nextToken) break;
    }

    return { tweets, authors };
  }
}

/**
 * Construit une requête de recherche pour un token.
 * On cherche l'adresse du contrat ET le cashtag : l'adresse est un identifiant
 * non ambigu (impossible à confondre avec un autre projet), le cashtag capte
 * la conversation de ceux qui ne collent pas l'adresse.
 */
export const buildTokenQuery = (address: string, symbol: string): string => {
  const clean = symbol.replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
  const parts = [`"${address}"`];
  if (clean.length >= 2) parts.push(`$${clean}`, `#${clean}`);
  return `(${parts.join(' OR ')}) -is:retweet`;
};

/** Extrait les adresses de contrat plausibles d'un texte de tweet. */
export const extractAddresses = (text: string): string[] => {
  const out = new Set<string>();
  // EVM : 0x + 40 hex.
  for (const m of text.matchAll(/0x[a-fA-F0-9]{40}/g)) out.add(m[0]);
  // Solana : base58 de 32 à 44 caractères, sans 0 O I l.
  for (const m of text.matchAll(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g)) {
    // Filtre grossier : une adresse mélange chiffres et lettres, casse mixte.
    if (/\d/.test(m[0]) && /[A-Z]/.test(m[0]) && /[a-z]/.test(m[0])) out.add(m[0]);
  }
  return [...out];
};

/** Extrait les cashtags ($PEPE) d'un texte. */
export const extractCashtags = (text: string): string[] =>
  [...text.matchAll(/\$([A-Za-z][A-Za-z0-9]{1,15})\b/g)].map((m) => m[1].toUpperCase());

type XSearchResponse = {
  data?: RawTweet[];
  includes?: { users?: RawUser[] };
  meta?: { next_token?: string };
};

type RawTweet = {
  id: string;
  author_id: string;
  created_at: string;
  text: string;
  lang?: string;
  public_metrics?: {
    like_count?: number;
    retweet_count?: number;
    reply_count?: number;
    quote_count?: number;
  };
  referenced_tweets?: Array<{ type: string }>;
};

type RawUser = {
  id: string;
  username: string;
  created_at?: string;
  verified?: boolean;
  profile_image_url?: string;
  public_metrics?: {
    followers_count?: number;
    following_count?: number;
    tweet_count?: number;
  };
};

export const toTweet = (t: RawTweet): Tweet => ({
  id: t.id,
  authorId: t.author_id,
  createdAt: Date.parse(t.created_at),
  text: t.text,
  likes: t.public_metrics?.like_count ?? 0,
  retweets: t.public_metrics?.retweet_count ?? 0,
  replies: t.public_metrics?.reply_count ?? 0,
  quotes: t.public_metrics?.quote_count ?? 0,
  isRetweet: (t.referenced_tweets ?? []).some((r) => r.type === 'retweeted'),
  lang: t.lang,
});

export const toAuthor = (u: RawUser): Author => ({
  id: u.id,
  username: u.username,
  followers: u.public_metrics?.followers_count ?? 0,
  following: u.public_metrics?.following_count ?? 0,
  tweetCount: u.public_metrics?.tweet_count ?? 0,
  createdAt: u.created_at ? Date.parse(u.created_at) : Date.now(),
  verified: u.verified ?? false,
  hasDefaultAvatar: (u.profile_image_url ?? '').includes('default_profile'),
});
