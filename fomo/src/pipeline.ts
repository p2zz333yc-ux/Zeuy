import type { Config } from './config.ts';
import { DEFAULT_CONFIG } from './config.ts';
import { ACTIONABLE_PHASES } from './phase.ts';
import { evaluate, rank } from './score.ts';
import type { HistoryStore } from './store.ts';
import type {
  Author,
  Candidate,
  Chain,
  Evaluation,
  MarketSnapshot,
  SecurityReport,
  Tweet,
} from './types.ts';

/**
 * Fournisseurs de données, injectés plutôt qu'importés en dur : le pipeline
 * doit pouvoir tourner sur des fixtures hors ligne, sinon il est intestable
 * et donc incalibrable.
 */
export type Providers = {
  /** Découvre des adresses candidates (X, tokens promus, nouveaux pools...). */
  discover: (now: number) => Promise<Array<{ address: string; chain: Chain }>>;
  /** Données de marché pour une adresse. */
  market: (address: string, chain: Chain) => Promise<MarketSnapshot | null>;
  /** Audit de sécurité. */
  security: (address: string, chain: Chain) => Promise<SecurityReport | null>;
  /** Tweets et auteurs mentionnant le token sur la fenêtre d'analyse. */
  social: (
    address: string,
    symbol: string,
    since: number,
  ) => Promise<{ tweets: Tweet[]; authors: Map<string, Author> }>;
};

export type ScanOptions = {
  providers: Providers;
  store: HistoryStore;
  config?: Config;
  /** Identifiants X des comptes d'influence suivis. */
  kolIds?: Set<string>;
  now?: number;
  /** Nombre maximum de candidats enrichis par passe (budget d'appels API). */
  maxCandidates?: number;
  /** Journalisation optionnelle. */
  onProgress?: (message: string) => void;
};

export type ScanResult = {
  scannedAt: number;
  evaluated: Evaluation[];
  alerts: Evaluation[];
  /** Candidats écartés avant enrichissement complet, avec la raison. */
  skipped: Array<{ address: string; reason: string }>;
};

/**
 * Une passe complète : découverte → présélection → enrichissement → score → alertes.
 *
 * La présélection est ce qui rend le scanner soutenable : l'API X est facturée
 * à la requête, on ne peut pas interroger le social de 4 000 tokens par heure.
 * On filtre donc d'abord sur des données gratuites (liquidité, âge, volume).
 */
export const scan = async (opts: ScanOptions): Promise<ScanResult> => {
  const cfg = opts.config ?? DEFAULT_CONFIG;
  const now = opts.now ?? Date.now();
  const maxCandidates = opts.maxCandidates ?? 25;
  const log = opts.onProgress ?? (() => {});
  const skipped: Array<{ address: string; reason: string }> = [];

  const discovered = await opts.providers.discover(now);
  // On re-scanne aussi ce qu'on suivait déjà : un token peut s'allumer une heure
  // après sa découverte, et on perdrait son historique en l'oubliant.
  const tracked = opts.store.addresses().map((address) => ({ address, chain: 'unknown' as Chain }));
  const unique = new Map<string, Chain>();
  for (const d of [...discovered, ...tracked]) {
    if (!unique.has(d.address)) unique.set(d.address, d.chain);
  }
  log(`${unique.size} adresses à examiner (${discovered.length} découvertes, ${tracked.length} suivies)`);

  // Étape 1 — présélection sur données de marché uniquement (gratuites, rapides).
  const preselected: Array<{ market: MarketSnapshot }> = [];
  for (const [address, chain] of unique) {
    const market = await opts.providers.market(address, chain);
    if (!market) {
      skipped.push({ address, reason: 'aucun pool trouvé' });
      continue;
    }
    if (!cfg.chains.includes(market.chain)) {
      skipped.push({ address, reason: `chaîne ${market.chain} non surveillée` });
      continue;
    }
    if (market.liquidityUsd < cfg.onchain.minLiquidityUsd) {
      skipped.push({ address, reason: `liquidité insuffisante (${Math.round(market.liquidityUsd)} $)` });
      continue;
    }
    if (market.volume.h1 <= 0) {
      skipped.push({ address, reason: 'aucun volume sur 1 h' });
      continue;
    }
    if (market.fdvUsd > cfg.onchain.fdvLateUsd) {
      skipped.push({ address, reason: 'FDV déjà trop élevée' });
      continue;
    }
    preselected.push({ market });
  }

  // Étape 2 — on classe la présélection par intensité brute et on ne dépense
  // le budget social que sur la tête de liste.
  preselected.sort((a, b) => heat(b.market) - heat(a.market));
  const shortlist = preselected.slice(0, maxCandidates);
  for (const p of preselected.slice(maxCandidates)) {
    skipped.push({ address: p.market.address, reason: 'hors budget de la passe' });
  }
  log(`${shortlist.length} candidats enrichis sur ${preselected.length} présélectionnés`);

  // Étape 3 — enrichissement complet et scoring.
  const evaluated: Evaluation[] = [];
  for (const { market } of shortlist) {
    const [security, socialData] = await Promise.all([
      opts.providers.security(market.address, market.chain),
      opts.providers.social(market.address, market.symbol, now - cfg.lookbackMs),
    ]);

    const history = opts.store.get(market.address);
    const firstSeen = opts.store.firstSeen(market.address) ?? now;

    const candidate: Candidate = {
      address: market.address,
      chain: market.chain,
      symbol: market.symbol,
      name: market.name,
      firstSeenAt: firstSeen,
    };

    const evaluation = evaluate(
      {
        candidate,
        market,
        security,
        social: {
          address: market.address,
          tweets: socialData.tweets,
          authors: socialData.authors,
          kolIds: opts.kolIds ?? new Set(),
        },
        history,
        now,
      },
      cfg,
    );

    // L'historique est écrit APRÈS le scoring : sinon le point courant polluerait
    // sa propre baseline et écraserait mécaniquement la vélocité.
    opts.store.push(market.address, {
      at: now,
      mentions: socialData.tweets.filter((t) => now - t.createdAt < cfg.bucketMs).length,
      uniqueAuthors: new Set(
        socialData.tweets.filter((t) => now - t.createdAt < cfg.bucketMs).map((t) => t.authorId),
      ).size,
      priceUsd: market.priceUsd,
      volumeM5: market.volume.m5,
      holders: market.holders,
      fomo: evaluation.fomo,
    });

    evaluated.push(evaluation);
  }

  opts.store.prune(now);
  const ranked = rank(evaluated);

  return {
    scannedAt: now,
    evaluated: ranked,
    alerts: ranked.filter(
      (e) => e.fomo >= cfg.alertThreshold && ACTIONABLE_PHASES.includes(e.phase) && e.confidence >= 0.4,
    ),
    skipped,
  };
};

/**
 * Score de « chaleur » très grossier, uniquement destiné à trier la présélection.
 * Volontairement naïf : c'est un filtre de budget, pas une décision.
 */
export const heat = (m: MarketSnapshot): number => {
  const accel = m.volume.m5 / Math.max(m.volume.h1 / 12, 1);
  const buys = m.txns.m5.buys + m.txns.m5.sells;
  const young = m.pairAgeMs < 24 * 3_600_000 ? 1.5 : 1;
  return accel * Math.log1p(buys) * young;
};
