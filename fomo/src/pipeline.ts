import type { Config } from './config.ts';
import { DEFAULT_CONFIG } from './config.ts';
import { ACTIONABLE_PHASES } from './phase.ts';
import { evaluate, rank } from './score.ts';
import type { HistoryStore } from './store.ts';
import type { AnnouncementContext } from './features/social.ts';
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
  /**
   * Adresses injectées d'office dans la passe, sans passer par la découverte.
   * Sert à faire entrer un token repéré par la piste « annonces » : il n'a
   * souvent ni volume ni classement, donc aucune chance d'être découvert seul.
   */
  seeds?: Array<{ address: string; chain: Chain }>;
  /** Annonces rattachées à des adresses, indexées par adresse. */
  announcements?: Map<string, AnnouncementContext>;
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
  const seeds = opts.seeds ?? [];
  const unique = new Map<string, Chain>();
  for (const d of [...seeds, ...discovered, ...tracked]) {
    if (!unique.has(d.address)) unique.set(d.address, d.chain);
  }
  log(
    `${unique.size} adresses à examiner (${seeds.length} annoncées, ${discovered.length} découvertes, ${tracked.length} suivies)`,
  );

  // Étape 1 — présélection sur données de marché uniquement (gratuites, rapides).
  const seedAddresses = new Set(seeds.map((s) => s.address));
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
    // La liquidité reste éliminatoire même pour un token annoncé : sans elle,
    // la position est intenable quelle que soit la qualité du signal.
    if (market.liquidityUsd < cfg.onchain.minLiquidityUsd) {
      skipped.push({ address, reason: `liquidité insuffisante (${Math.round(market.liquidityUsd)} $)` });
      continue;
    }
    // Les deux filtres suivants supposent un token déjà en circulation. Un token
    // annoncé il y a quatre-vingt-dix secondes n'a pas encore d'heure de volume :
    // les lui appliquer reviendrait à jeter exactement ce qu'on cherche.
    const isSeed = seedAddresses.has(address);
    if (!isSeed && market.volume.h1 <= 0) {
      skipped.push({ address, reason: 'aucun volume sur 1 h' });
      continue;
    }
    if (!isSeed && market.fdvUsd > cfg.onchain.fdvLateUsd) {
      skipped.push({ address, reason: 'FDV déjà trop élevée' });
      continue;
    }
    preselected.push({ market });
  }

  // Étape 2 — on classe la présélection par intensité brute et on ne dépense
  // le budget social que sur la tête de liste.
  // Un token issu d'une annonce n'a par construction ni volume ni classement :
  // le trier sur sa « chaleur » le renverrait systématiquement en fin de liste,
  // c'est-à-dire hors budget, et la piste annonces ne servirait à rien.
  const seeded = preselected.filter((p) => seedAddresses.has(p.market.address));
  const rest = preselected.filter((p) => !seedAddresses.has(p.market.address));
  rest.sort((a, b) => heat(b.market) - heat(a.market));

  const budget = Math.max(0, maxCandidates - seeded.length);
  const shortlist = [...seeded, ...rest.slice(0, budget)];
  for (const p of rest.slice(budget)) {
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
        announcement: opts.announcements?.get(market.address),
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
