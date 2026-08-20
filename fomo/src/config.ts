import type { Chain } from './types.ts';

/**
 * Tous les seuils du moteur sont regroupés ici : ce sont des hypothèses,
 * pas des vérités. Ils doivent être recalibrés sur un backtest de VOTRE
 * univers de tokens (chaîne, taille, période) avant toute utilisation sérieuse.
 */
export type Config = {
  /** Taille d'un bucket temporel pour les séries sociales. */
  bucketMs: number;
  /** Profondeur d'historique utilisée pour calculer la baseline. */
  lookbackMs: number;

  social: {
    /** Nombre de mentions/bucket qui donne 0.5 au signal de volume. */
    midMentions: number;
    /** z-score de vélocité qui donne 0.5. */
    midVelocityZ: number;
    /** Ratio d'accélération (v_t / v_{t-1}) qui donne 0.5. */
    midAcceleration: number;
    /** Followers d'un compte qui saturent le score de portée. */
    maxFollowers: number;
    /** En dessous de cet âge (ms), un compte est considéré comme suspect. */
    freshAccountMs: number;
    /** Seuil de similarité Jaccard au-delà duquel deux tweets sont « le même ». */
    duplicateThreshold: number;
    /** Portée cumulée d'un KOL qui sature le signal d'allumage. */
    maxKolReach: number;
  };

  onchain: {
    /** Liquidité plancher : en dessous, on ne peut ni entrer ni sortir. */
    minLiquidityUsd: number;
    /** Liquidité qui sature le score. */
    goodLiquidityUsd: number;
    /** FDV au-delà de laquelle le potentiel de x est déjà largement consommé. */
    fdvHeadroomUsd: number;
    /** FDV au-delà de laquelle on considère le trade comme « en retard ». */
    fdvLateUsd: number;
    /** Ratio volume 5 min annualisé / volume 1 h qui donne 0.5. */
    midVolumeAccel: number;
  };

  risk: {
    /** Concentration top 10 tolérée avant pénalité. */
    top10Warn: number;
    /** Concentration top 10 au-delà de laquelle on disqualifie. */
    top10Veto: number;
    /** Part dev tolérée. */
    devWarn: number;
    /** Taxe de vente au-delà de laquelle on disqualifie. */
    sellTaxVeto: number;
    /** Age minimum du pool : avant ça, rien n'est vérifiable. */
    minPairAgeMs: number;
  };

  weights: {
    social: number;
    onchain: number;
    coherence: number;
    timing: number;
  };

  /** Seuil de score FOMO déclenchant une alerte. */
  alertThreshold: number;
  /** Chaînes surveillées. */
  chains: Chain[];
};

export const DEFAULT_CONFIG: Config = {
  bucketMs: 15 * 60 * 1000,
  lookbackMs: 24 * 60 * 60 * 1000,

  social: {
    midMentions: 25,
    midVelocityZ: 3,
    midAcceleration: 2.5,
    maxFollowers: 2_000_000,
    freshAccountMs: 30 * 24 * 60 * 60 * 1000,
    duplicateThreshold: 0.8,
    maxKolReach: 5_000_000,
  },

  onchain: {
    minLiquidityUsd: 15_000,
    goodLiquidityUsd: 250_000,
    fdvHeadroomUsd: 3_000_000,
    fdvLateUsd: 50_000_000,
    midVolumeAccel: 3,
  },

  risk: {
    top10Warn: 0.3,
    top10Veto: 0.5,
    devWarn: 0.05,
    sellTaxVeto: 0.1,
    minPairAgeMs: 3 * 60 * 1000,
  },

  weights: {
    social: 0.4,
    onchain: 0.35,
    coherence: 0.15,
    timing: 0.1,
  },

  alertThreshold: 65,
  chains: ['solana', 'base', 'ethereum'],
};

export const mergeConfig = (patch: DeepPartial<Config> = {}): Config => ({
  ...DEFAULT_CONFIG,
  ...patch,
  social: { ...DEFAULT_CONFIG.social, ...patch.social },
  onchain: { ...DEFAULT_CONFIG.onchain, ...patch.onchain },
  risk: { ...DEFAULT_CONFIG.risk, ...patch.risk },
  weights: { ...DEFAULT_CONFIG.weights, ...patch.weights },
  chains: patch.chains ?? DEFAULT_CONFIG.chains,
});

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U> ? U[] : T[K] extends object ? Partial<T[K]> : T[K];
};
