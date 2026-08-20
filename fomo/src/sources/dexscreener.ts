import type { Chain, MarketSnapshot } from '../types.ts';

/**
 * Source de marché : Dexscreener (API publique, sans clé, ~300 req/min).
 * Elle donne prix, liquidité, FDV, volumes et comptes de transactions par
 * fenêtre — soit tout ce dont le bloc on-chain a besoin, sauf les holders.
 */
const BASE = 'https://api.dexscreener.com';

export type DexOptions = { fetchImpl?: typeof fetch; baseUrl?: string };

export const fetchTokenSnapshot = async (
  address: string,
  opts: DexOptions = {},
): Promise<MarketSnapshot | null> => {
  const doFetch = opts.fetchImpl ?? fetch;
  const res = await doFetch(`${opts.baseUrl ?? BASE}/latest/dex/tokens/${address}`);
  if (!res.ok) return null;
  const body = (await res.json()) as { pairs?: RawPair[] | null };
  return snapshotFromPairs(body.pairs ?? [], address);
};

/** Tokens fraîchement promus : la source la plus rapide pour découvrir des candidats. */
export const fetchBoostedTokens = async (opts: DexOptions = {}): Promise<
  Array<{ address: string; chain: Chain }>
> => {
  const doFetch = opts.fetchImpl ?? fetch;
  const res = await doFetch(`${opts.baseUrl ?? BASE}/token-boosts/latest/v1`);
  if (!res.ok) return [];
  const body = (await res.json()) as Array<{ tokenAddress?: string; chainId?: string }>;
  return (Array.isArray(body) ? body : [])
    .filter((b) => b.tokenAddress)
    .map((b) => ({ address: b.tokenAddress as string, chain: toChain(b.chainId) }));
};

/**
 * Recherche de pools par texte libre (ticker, nom, adresse).
 *
 * C'est le pont entre une annonce et un token réel : quand un compte annonce
 * « $TICKER », le pool n'existe parfois que depuis quelques secondes et n'est
 * dans aucun classement. La recherche par symbole est le seul moyen de le
 * retrouver — au prix d'une ambiguïté qu'il faut ensuite lever, car n'importe
 * qui peut déployer un token portant exactement le même symbole.
 */
export const searchPairs = async (
  query: string,
  opts: DexOptions = {},
): Promise<MarketSnapshot[]> => {
  const doFetch = opts.fetchImpl ?? fetch;
  const url = `${opts.baseUrl ?? BASE}/latest/dex/search?q=${encodeURIComponent(query)}`;
  const res = await doFetch(url);
  if (!res.ok) return [];
  const body = (await res.json()) as { pairs?: RawPair[] | null };

  // Un token = une adresse ; on regroupe les pools par adresse de base.
  const byAddress = new Map<string, RawPair[]>();
  for (const p of body.pairs ?? []) {
    const addr = p.baseToken?.address;
    if (!addr) continue;
    const list = byAddress.get(addr);
    if (list) list.push(p);
    else byAddress.set(addr, [p]);
  }

  const out: MarketSnapshot[] = [];
  for (const [addr, pairs] of byAddress) {
    const snap = snapshotFromPairs(pairs, addr);
    if (snap) out.push(snap);
  }
  return out;
};

/**
 * Un token peut avoir plusieurs pools. On retient celui qui porte la liquidité :
 * c'est lui qui détermine le prix réellement exécutable.
 */
export const snapshotFromPairs = (pairs: RawPair[], address: string): MarketSnapshot | null => {
  const relevant = pairs.filter(
    (p) => p.baseToken?.address?.toLowerCase() === address.toLowerCase(),
  );
  if (relevant.length === 0) return null;

  const main = relevant.reduce((best, p) =>
    (p.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) ? p : best,
  );

  // La liquidité totale compte tous les pools, le reste vient du pool principal.
  const liquidityUsd = relevant.reduce((a, p) => a + (p.liquidity?.usd ?? 0), 0);
  const now = Date.now();

  return {
    address,
    chain: toChain(main.chainId),
    symbol: main.baseToken?.symbol ?? '???',
    name: main.baseToken?.name ?? 'inconnu',
    fetchedAt: now,
    priceUsd: Number(main.priceUsd ?? 0),
    pairAgeMs: main.pairCreatedAt ? now - main.pairCreatedAt : 0,
    liquidityUsd,
    fdvUsd: main.fdv ?? 0,
    marketCapUsd: main.marketCap ?? main.fdv ?? 0,
    volume: {
      m5: main.volume?.m5 ?? 0,
      h1: main.volume?.h1 ?? 0,
      h6: main.volume?.h6 ?? 0,
      h24: main.volume?.h24 ?? 0,
    },
    priceChangePct: {
      m5: main.priceChange?.m5 ?? 0,
      h1: main.priceChange?.h1 ?? 0,
      h6: main.priceChange?.h6 ?? 0,
      h24: main.priceChange?.h24 ?? 0,
    },
    txns: {
      m5: txn(main.txns?.m5),
      h1: txn(main.txns?.h1),
      h6: txn(main.txns?.h6),
      h24: txn(main.txns?.h24),
    },
  };
};

const txn = (t?: { buys?: number; sells?: number }) => ({
  buys: t?.buys ?? 0,
  sells: t?.sells ?? 0,
});

export const toChain = (id?: string): Chain => {
  switch ((id ?? '').toLowerCase()) {
    case 'solana':
      return 'solana';
    case 'ethereum':
      return 'ethereum';
    case 'base':
      return 'base';
    case 'bsc':
      return 'bsc';
    case 'arbitrum':
      return 'arbitrum';
    default:
      return 'unknown';
  }
};

export type RawPair = {
  chainId?: string;
  pairCreatedAt?: number;
  priceUsd?: string;
  fdv?: number;
  marketCap?: number;
  baseToken?: { address?: string; symbol?: string; name?: string };
  liquidity?: { usd?: number };
  volume?: { m5?: number; h1?: number; h6?: number; h24?: number };
  priceChange?: { m5?: number; h1?: number; h6?: number; h24?: number };
  txns?: Record<string, { buys?: number; sells?: number }>;
};
