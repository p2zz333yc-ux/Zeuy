import type { Chain, SecurityReport } from '../types.ts';

/**
 * Audits de sécurité. Deux fournisseurs selon la chaîne :
 *  - Solana  : rugcheck.xyz (autorités mint/freeze, LP, concentration)
 *  - EVM     : GoPlus Labs (honeypot, taxes, propriétaire, holders)
 *
 * Les deux peuvent renvoyer des champs manquants : on les remonte à `null`
 * plutôt qu'à une valeur par défaut, pour que le calcul de confiance sache
 * distinguer « vérifié bon » de « non vérifié ».
 */
export type SecurityOptions = { fetchImpl?: typeof fetch };

export const fetchSecurity = async (
  address: string,
  chain: Chain,
  opts: SecurityOptions = {},
): Promise<SecurityReport | null> =>
  chain === 'solana' ? fetchRugcheck(address, opts) : fetchGoPlus(address, chain, opts);

export const fetchRugcheck = async (
  address: string,
  opts: SecurityOptions = {},
): Promise<SecurityReport | null> => {
  const doFetch = opts.fetchImpl ?? fetch;
  const res = await doFetch(`https://api.rugcheck.xyz/v1/tokens/${address}/report`);
  if (!res.ok) return null;
  const b = (await res.json()) as RugcheckReport;
  return parseRugcheck(address, b);
};

export const parseRugcheck = (address: string, b: RugcheckReport): SecurityReport => {
  // Rugcheck marque les comptes de pool/LP : ils ne sont pas une menace de
  // dumping, contrairement à un portefeuille individuel de même taille.
  const holders = (b.topHolders ?? []).filter((h) => !h.pool);
  const top10 = holders.slice(0, 10).reduce((a, h) => a + (h.pct ?? 0), 0) / 100;

  return {
    address,
    chain: 'solana',
    mintRevoked: b.token?.mintAuthority == null ? true : b.token.mintAuthority === '',
    freezeRevoked: b.token?.freezeAuthority == null ? true : b.token.freezeAuthority === '',
    lpBurnedPct: b.markets?.[0]?.lp?.lpLockedPct != null ? b.markets[0].lp.lpLockedPct / 100 : null,
    top10Pct: holders.length > 0 ? top10 : null,
    devHoldingPct: b.creatorBalance != null && b.token?.supply ? b.creatorBalance / b.token.supply : null,
    devSold: null,
    sellTaxPct: null,
    honeypot: null,
  };
};

const GOPLUS_CHAIN_IDS: Partial<Record<Chain, string>> = {
  ethereum: '1',
  bsc: '56',
  base: '8453',
  arbitrum: '42161',
};

export const fetchGoPlus = async (
  address: string,
  chain: Chain,
  opts: SecurityOptions = {},
): Promise<SecurityReport | null> => {
  const chainId = GOPLUS_CHAIN_IDS[chain];
  if (!chainId) return null;
  const doFetch = opts.fetchImpl ?? fetch;
  const res = await doFetch(
    `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`,
  );
  if (!res.ok) return null;
  const body = (await res.json()) as { result?: Record<string, GoPlusToken> };
  const raw = body.result?.[address.toLowerCase()];
  return raw ? parseGoPlus(address, chain, raw) : null;
};

export const parseGoPlus = (address: string, chain: Chain, t: GoPlusToken): SecurityReport => {
  const num = (v?: string): number | null => (v == null || v === '' ? null : Number(v));
  const bool = (v?: string): boolean | null => (v == null || v === '' ? null : v === '1');

  const holders = t.holders ?? [];
  const top10 =
    holders.length > 0
      ? holders
          .filter((h) => h.is_locked !== 1 && h.is_contract !== 1)
          .slice(0, 10)
          .reduce((a, h) => a + Number(h.percent ?? 0), 0)
      : null;

  return {
    address,
    chain,
    // Sur EVM, l'équivalent du mint non révoqué est une fonction de mint accessible.
    mintRevoked: bool(t.is_mintable) == null ? null : !bool(t.is_mintable),
    freezeRevoked: bool(t.transfer_pausable) == null ? null : !bool(t.transfer_pausable),
    lpBurnedPct: num(t.lp_holder_count) === 0 ? null : lpLocked(t),
    top10Pct: top10,
    devHoldingPct: num(t.creator_percent),
    devSold: null,
    sellTaxPct: num(t.sell_tax),
    honeypot: bool(t.is_honeypot),
  };
};

const lpLocked = (t: GoPlusToken): number | null => {
  const holders = t.lp_holders ?? [];
  if (holders.length === 0) return null;
  return holders
    .filter((h) => h.is_locked === 1 || /dead|0x0{10,}/i.test(h.address ?? ''))
    .reduce((a, h) => a + Number(h.percent ?? 0), 0);
};

export type RugcheckReport = {
  token?: { mintAuthority?: string | null; freezeAuthority?: string | null; supply?: number };
  creatorBalance?: number;
  topHolders?: Array<{ owner?: string; pct?: number; insider?: boolean; pool?: boolean }>;
  markets?: Array<{ lp?: { lpLockedPct?: number } }>;
};

export type GoPlusToken = {
  is_honeypot?: string;
  sell_tax?: string;
  is_mintable?: string;
  transfer_pausable?: string;
  creator_percent?: string;
  lp_holder_count?: string;
  lp_holders?: Array<{ address?: string; percent?: string; is_locked?: number }>;
  holders?: Array<{ percent?: string; is_locked?: number; is_contract?: number }>;
};
