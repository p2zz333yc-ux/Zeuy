import { readFile, writeFile } from 'node:fs/promises';
import type { XClient } from './sources/x.ts';

/**
 * Liste des comptes surveillés.
 *
 * C'est le paramètre le plus déterminant de tout le système : le moteur ne peut
 * détecter que les annonces des comptes qu'on lui a demandé de regarder. Une
 * watchlist médiocre produit un scanner médiocre, quels que soient les poids.
 */
export type WatchTier =
  /** Compte officiel d'une personnalité, d'une marque, d'une institution. */
  | 'OFFICIAL'
  /** Influenceur crypto établi. */
  | 'KOL'
  /** Compte communautaire ou agrégateur de lancements. */
  | 'COMMUNITY';

export type WatchedAccount = {
  /** Identifiant numérique X. Résolu une fois, puis conservé. */
  id?: string;
  username: string;
  tier: WatchTier;
  /** Libellé libre affiché dans les alertes. */
  label?: string;
};

export type Watchlist = { accounts: WatchedAccount[] };

export const loadWatchlist = async (path: string): Promise<WatchedAccount[]> => {
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as Watchlist | WatchedAccount[];
    const accounts = Array.isArray(parsed) ? parsed : parsed.accounts;
    return accounts.map((a) => ({ ...a, username: a.username.replace(/^@/, '') }));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
};

export const saveWatchlist = async (path: string, accounts: WatchedAccount[]): Promise<void> => {
  await writeFile(path, `${JSON.stringify({ accounts }, null, 2)}\n`, 'utf8');
};

/**
 * Complète les identifiants manquants via l'API, puis réécrit le fichier.
 *
 * On stocke l'identifiant et pas seulement le pseudonyme, parce qu'un pseudonyme
 * se change en deux clics : un compte suivi qui se renomme, ou qui est revendu,
 * ferait suivre au scanner quelqu'un d'autre sans que rien ne le signale.
 */
export const resolveWatchlist = async (
  client: XClient,
  accounts: WatchedAccount[],
): Promise<WatchedAccount[]> => {
  const missing = accounts.filter((a) => !a.id);
  if (missing.length === 0) return accounts;

  const resolved = await client.getUsersByUsernames(missing.map((a) => a.username));
  const byName = new Map(resolved.map((u) => [u.username.toLowerCase(), u.id]));

  return accounts.map((a) => ({ ...a, id: a.id ?? byName.get(a.username.toLowerCase()) }));
};

export const findWatched = (
  accounts: WatchedAccount[],
  authorId: string,
): WatchedAccount | null => accounts.find((a) => a.id === authorId) ?? null;

/**
 * Watchlist d'amorçage volontairement vide : y inscrire des comptes réels serait
 * suggérer que ces personnes lancent des tokens. À remplir selon votre thèse.
 */
export const EMPTY_WATCHLIST: WatchedAccount[] = [];
