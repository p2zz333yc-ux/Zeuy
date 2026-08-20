import type { Config } from './config.ts';
import { DEFAULT_CONFIG } from './config.ts';
import { analyzeCoherence, analyzeTiming } from './features/coherence.ts';
import { analyzeOnchain } from './features/onchain.ts';
import { analyzeRisk } from './features/risk.ts';
import { analyzeSocial } from './features/social.ts';
import type { AnnouncementContext } from './features/social.ts';
import { classifyPhase } from './phase.ts';
import type {
  Candidate,
  Evaluation,
  HistoryPoint,
  MarketSnapshot,
  SecurityReport,
  SocialBundle,
} from './types.ts';
import { clamp } from './util/math.ts';

export type EvaluationInput = {
  candidate: Candidate;
  market: MarketSnapshot;
  security: SecurityReport | null;
  social: SocialBundle;
  history: HistoryPoint[];
  now: number;
  /** Annonce récente d'un compte surveillé portant sur ce token, si elle existe. */
  announcement?: AnnouncementContext;
};

/**
 * Score FOMO = (moyenne pondérée des quatre blocs) × (produit des verrous de sécurité).
 *
 * La forme de la formule compte autant que les poids :
 *  - additif entre blocs, parce qu'un bloc faible doit pouvoir être compensé ;
 *  - multiplicatif pour la sécurité et l'authenticité, parce qu'un rug ou une
 *    ferme de bots ne se compense JAMAIS par un bon score ailleurs.
 */
export const evaluate = (input: EvaluationInput, cfg: Config = DEFAULT_CONFIG): Evaluation => {
  const { candidate, market, security, social: bundle, history, now } = input;

  const social = analyzeSocial(bundle, now, cfg, input.announcement);
  const onchain = analyzeOnchain(market, cfg);
  const risk = analyzeRisk(market, security, cfg);
  const coherence = analyzeCoherence(social, onchain, history, cfg);
  const timing = analyzeTiming(market, social, history);

  const w = cfg.weights;
  const base =
    w.social * social.score +
    w.onchain * onchain.score +
    w.coherence * coherence.score +
    w.timing * timing.score;

  const fomo = clamp(base * risk.multiplier) * 100;

  // La confiance dit à quel point le score est fiable, indépendamment de sa valeur.
  // Un 80/100 calculé sur des données trouées ne vaut pas un 80/100 complet.
  const confidence = clamp(
    0.4 * social.coverage + 0.25 * onchain.coverage + 0.25 * risk.coverage + 0.1 * (history.length >= 4 ? 1 : history.length / 4),
  );

  return {
    candidate,
    evaluatedAt: now,
    fomo: Math.round(fomo * 10) / 10,
    blocks: {
      social: round(social.score),
      onchain: round(onchain.score),
      coherence: round(coherence.score),
      timing: round(timing.score),
    },
    confidence: round(confidence),
    phase: classifyPhase(market, social, onchain, coherence),
    signals: [...social.signals, ...onchain.signals, ...coherence.signals, ...timing.signals],
    gates: risk.gates,
    vetoes: risk.vetoes,
  };
};

/**
 * Tri de la watchlist. On ne trie pas sur le score seul : un score élevé mais
 * peu fiable passe derrière un score correct et bien documenté.
 */
export const rank = (evals: Evaluation[]): Evaluation[] =>
  [...evals].sort((a, b) => b.fomo * (0.5 + 0.5 * b.confidence) - a.fomo * (0.5 + 0.5 * a.confidence));

const round = (x: number): number => Math.round(x * 1000) / 1000;
