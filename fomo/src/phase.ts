import type { MarketSnapshot, Phase } from './types.ts';
import type { CoherenceAnalysis } from './features/coherence.ts';
import type { OnchainAnalysis } from './features/onchain.ts';
import type { SocialAnalysis } from './features/social.ts';

/**
 * La phase est plus actionnable que le score : deux tokens à 70/100 peuvent
 * être l'un une opportunité d'entrée et l'autre une sortie en cours.
 *
 * Ordre d'évaluation volontairement figé, du plus disqualifiant au plus rare.
 */
export const classifyPhase = (
  m: MarketSnapshot,
  social: SocialAnalysis,
  onchain: OnchainAnalysis,
  coherence: CoherenceAnalysis,
): Phase => {
  // Une ferme de bots se reconnaît à du bruit massif sans diffusion réelle.
  if (social.botRatio > 0.6 && social.mentionsNow > 10) return 'BOT_FARM';

  // Volume et pression acheteuse sans aucune attention : quelqu'un sait quelque chose.
  if (coherence.regime === 'ONCHAIN_SEUL' && onchain.buyPressure > 0.3 && social.mentionsNow < 8) {
    return 'INSIDER';
  }

  const dumping = m.priceChangePct.m5 < -8 || onchain.buyPressure < -0.2;
  const cooling = social.acceleration < 0.7;

  // Distribution : le prix casse pendant que l'attention retombe.
  if (dumping && cooling) return 'DISTRIBUTION';

  // Euphorie : tout est au maximum, ce qui veut dire qu'il n'y a plus d'acheteur marginal.
  if (m.priceChangePct.h1 > 300 || (m.priceChangePct.h1 > 150 && cooling)) return 'EUPHORIA';

  // Breakout : le move est lancé et confirmé des deux côtés.
  if (m.priceChangePct.h1 > 50 && coherence.regime === 'CONFIRME') return 'BREAKOUT';

  // Ignition : c'est la seule phase qui vaut une entrée. L'attention accélère,
  // le volume suit, et le prix n'a pas encore payé la nouvelle.
  if (social.acceleration >= 1.5 && social.score > 0.4 && m.priceChangePct.h1 < 80) {
    return 'IGNITION';
  }

  return 'DORMANT';
};

/** Phases sur lesquelles une alerte a un sens. */
export const ACTIONABLE_PHASES: Phase[] = ['IGNITION', 'BREAKOUT'];

export const phaseAdvice = (phase: Phase): string => {
  switch (phase) {
    case 'IGNITION':
      return "Fenêtre d'entrée : l'attention accélère avant que le prix l'ait intégrée.";
    case 'BREAKOUT':
      return 'Move confirmé mais déjà entamé : entrée plus risquée, invalidation serrée.';
    case 'EUPHORIA':
      return "Sommet local probable : c'est là que la sortie se prépare, pas l'entrée.";
    case 'DISTRIBUTION':
      return 'Les gros portefeuilles sortent pendant que le retail achète. À éviter.';
    case 'BOT_FARM':
      return "Volume social artificiel : l'attention est achetée, pas réelle.";
    case 'INSIDER':
      return "Accumulation sans attention. À surveiller, mais ce n'est pas un signal FOMO.";
    default:
      return 'Rien à signaler. Surveillance passive.';
  }
};
