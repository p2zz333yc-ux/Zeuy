import type { Config } from '../config.ts';
import type { HistoryPoint, MarketSnapshot, Signal } from '../types.ts';
import type { OnchainAnalysis } from './onchain.ts';
import type { SocialAnalysis } from './social.ts';
import { clamp, logistic } from '../util/math.ts';

export type CoherenceAnalysis = {
  signals: Signal[];
  score: number;
  /** Avance du social sur le volume, en ms. Positif = le social mène. */
  leadMs: number;
  /** Étiquette qualitative de la relation social ↔ on-chain. */
  regime: 'CONFIRME' | 'SOCIAL_SEUL' | 'ONCHAIN_SEUL' | 'ATONE';
};

/**
 * Le cœur de la valeur ajoutée du moteur.
 *
 * Un pic social sans volume = campagne payée ou ferme de bots.
 * Du volume sans pic social = accumulation d'initiés (intéressant, mais autre thèse).
 * Le signal qui précède les vrais moves : le social MÈNE le volume de 5 à 30 min.
 */
export const analyzeCoherence = (
  social: SocialAnalysis,
  onchain: OnchainAnalysis,
  history: HistoryPoint[],
  cfg: Config,
): CoherenceAnalysis => {
  const socialHot = social.score > 0.45;
  const onchainHot = onchain.score > 0.45;

  const regime: CoherenceAnalysis['regime'] = socialHot && onchainHot
    ? 'CONFIRME'
    : socialHot
      ? 'SOCIAL_SEUL'
      : onchainHot
        ? 'ONCHAIN_SEUL'
        : 'ATONE';

  const leadMs = estimateLead(history, cfg);

  // Un social qui mène de 5 à 30 min est la fenêtre d'entrée idéale :
  // assez tôt pour ne pas payer le move, assez tard pour être confirmé.
  const leadScore =
    leadMs <= 0
      ? 0.25
      : leadMs <= 30 * 60_000
        ? 1
        : clamp(1 - (leadMs - 30 * 60_000) / (90 * 60_000), 0.2, 1);

  const regimeScore =
    regime === 'CONFIRME' ? 0.95 : regime === 'ONCHAIN_SEUL' ? 0.45 : regime === 'SOCIAL_SEUL' ? 0.2 : 0.05;

  // Ratio d'efficience : combien de volume est généré par unité d'attention.
  // Beaucoup de bruit pour peu de volume = attention creuse.
  const efficiency = social.mentionsNow === 0 ? 0 : onchain.volumeAccel / Math.log1p(social.mentionsNow);
  const efficiencyScore = logistic(efficiency, 0.8, 1.5);

  const signals: Signal[] = [
    { key: 'coherence.regime', raw: regimeScore, score: regimeScore, detail: `régime ${regime}` },
    {
      key: 'coherence.lead',
      raw: leadMs,
      score: leadScore,
      detail: leadMs > 0 ? `le social précède le volume de ${Math.round(leadMs / 60_000)} min` : 'pas d’avance sociale mesurable',
    },
    {
      key: 'coherence.efficiency',
      raw: efficiency,
      score: efficiencyScore,
      detail: `${efficiency.toFixed(2)} de volume relatif par unité d’attention`,
    },
  ];

  return {
    signals,
    score: clamp(0.5 * regimeScore + 0.3 * leadScore + 0.2 * efficiencyScore),
    leadMs,
    regime,
  };
};

/**
 * Décalage entre le moment où les mentions décollent et celui où le volume décolle.
 * On cherche le premier point qui dépasse la moitié du maximum de chaque série,
 * ce qui est plus stable qu'une corrélation croisée sur des séries très courtes.
 */
export const estimateLead = (history: HistoryPoint[], cfg: Config): number => {
  if (history.length < 4) return 0;
  const sorted = [...history].sort((a, b) => a.at - b.at);
  const onset = (values: number[]): number => {
    const max = Math.max(...values);
    if (max <= 0) return -1;
    return values.findIndex((v) => v >= max / 2);
  };
  const iSocial = onset(sorted.map((h) => h.mentions));
  const iVolume = onset(sorted.map((h) => h.volumeM5));
  if (iSocial < 0 || iVolume < 0) return 0;
  return (sorted[iVolume].at - sorted[iSocial].at) || (iVolume - iSocial) * cfg.bucketMs;
};

export type TimingAnalysis = { signals: Signal[]; score: number };

/**
 * Le timing ne mesure pas la qualité du token mais la qualité du MOMENT.
 * Un excellent token détecté 6 h trop tard est un mauvais trade.
 */
export const analyzeTiming = (
  m: MarketSnapshot,
  social: SocialAnalysis,
  history: HistoryPoint[],
): TimingAnalysis => {
  // 1. Âge du pool : la fenêtre utile va de quelques minutes à environ 12 h.
  const ageH = m.pairAgeMs / 3_600_000;
  const ageScore = ageH < 0.05 ? 0.2 : ageH < 12 ? 1 - ageH / 24 : clamp(0.5 - (ageH - 12) / 48);

  // 2. Prix déjà parcouru depuis le début de la vague sociale.
  //    Au-delà de +300 % sur 1 h, on n'achète plus une ignition, on achète une sortie.
  const run = m.priceChangePct.h1;
  const runScore = run <= 0 ? 0.4 : run < 80 ? 1 : run < 300 ? 0.6 : 0.15;

  // 3. L'accélération sociale tient-elle encore, ou est-elle déjà retombée ?
  const stillAccelerating = social.acceleration >= 1;
  const accelScore = stillAccelerating ? 0.9 : 0.25;

  // 4. Le score FOMO lui-même monte-t-il ? Une série descendante = train manqué.
  const trend = fomoTrend(history);
  const trendScore = trend > 0 ? 0.9 : trend === 0 ? 0.5 : 0.2;

  const signals: Signal[] = [
    { key: 'timing.pairAge', raw: ageH, score: ageScore, detail: `pool âgé de ${ageH < 1 ? `${Math.round(ageH * 60)} min` : `${ageH.toFixed(1)} h`}` },
    { key: 'timing.run', raw: run, score: runScore, detail: `${run.toFixed(0)}% déjà parcourus sur 1 h` },
    { key: 'timing.stillAccelerating', raw: social.acceleration, score: accelScore, detail: stillAccelerating ? 'accélération sociale intacte' : 'accélération sociale retombée' },
    { key: 'timing.trend', raw: trend, score: trendScore, detail: trend > 0 ? 'score FOMO en hausse' : trend < 0 ? 'score FOMO en baisse' : 'score FOMO stable' },
  ];

  return {
    signals,
    score: clamp(0.25 * ageScore + 0.3 * runScore + 0.25 * accelScore + 0.2 * trendScore),
  };
};

const fomoTrend = (history: HistoryPoint[]): number => {
  const scores = history
    .filter((h) => h.fomo != null)
    .sort((a, b) => a.at - b.at)
    .slice(-3)
    .map((h) => h.fomo as number);
  if (scores.length < 2) return 0;
  const delta = scores[scores.length - 1] - scores[0];
  return Math.abs(delta) < 3 ? 0 : Math.sign(delta);
};
