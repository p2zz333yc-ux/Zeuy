import type { Config } from '../config.ts';
import type { Gate, MarketSnapshot, SecurityReport } from '../types.ts';
import { clamp } from '../util/math.ts';

export type RiskAnalysis = {
  gates: Gate[];
  /** Produit de tous les multiplicateurs, 0..1. */
  multiplier: number;
  vetoes: string[];
  /** Part des contrôles de sécurité effectivement renseignés, 0..1. */
  coverage: number;
};

/**
 * Les verrous de sécurité sont MULTIPLICATIFS, jamais additifs : un token
 * dont le dev peut encore mint à l'infini ne doit pas pouvoir « compenser »
 * ce défaut par un score social spectaculaire. C'est exactement le piège
 * dans lequel tombent les scanners qui font une moyenne pondérée de tout.
 */
export const analyzeRisk = (
  m: MarketSnapshot,
  sec: SecurityReport | null,
  cfg: Config,
): RiskAnalysis => {
  const gates: Gate[] = [];
  let known = 0;
  const total = 7;

  const add = (key: string, multiplier: number, reason: string) =>
    gates.push({ key, multiplier: clamp(multiplier), reason, fatal: multiplier === 0 });

  // Pool trop jeune : rien n'est encore vérifiable, ni les holders ni la LP.
  if (m.pairAgeMs < cfg.risk.minPairAgeMs) {
    add('risk.pairAge', 0, `pool créé il y a ${Math.round(m.pairAgeMs / 1000)} s : trop tôt pour vérifier quoi que ce soit`);
  }

  if (!sec) {
    add('risk.noAudit', 0.35, 'aucun audit de sécurité disponible : score fortement dégradé');
    return finish(gates, 0);
  }

  if (sec.honeypot != null) {
    known++;
    if (sec.honeypot) add('risk.honeypot', 0, 'honeypot : la simulation de vente échoue');
  }

  if (sec.sellTaxPct != null) {
    known++;
    if (sec.sellTaxPct >= cfg.risk.sellTaxVeto) {
      add('risk.sellTax', 0, `taxe de vente de ${(sec.sellTaxPct * 100).toFixed(0)}%`);
    } else if (sec.sellTaxPct > 0.03) {
      add('risk.sellTax', 0.8, `taxe de vente de ${(sec.sellTaxPct * 100).toFixed(0)}%`);
    }
  }

  if (sec.mintRevoked != null) {
    known++;
    if (!sec.mintRevoked) add('risk.mint', 0, "l'autorité de mint n'est pas révoquée : offre inflatable à volonté");
  }

  if (sec.freezeRevoked != null) {
    known++;
    if (!sec.freezeRevoked) add('risk.freeze', 0, "l'autorité de freeze est active : vos tokens peuvent être gelés");
  }

  if (sec.lpBurnedPct != null) {
    known++;
    if (sec.lpBurnedPct < 0.5) {
      add('risk.lp', 0.25, `seulement ${(sec.lpBurnedPct * 100).toFixed(0)}% de la LP brûlée/verrouillée`);
    } else if (sec.lpBurnedPct < 0.9) {
      add('risk.lp', 0.7, `${(sec.lpBurnedPct * 100).toFixed(0)}% de la LP brûlée/verrouillée`);
    }
  }

  if (sec.top10Pct != null) {
    known++;
    if (sec.top10Pct >= cfg.risk.top10Veto) {
      add('risk.top10', 0, `top 10 des holders = ${(sec.top10Pct * 100).toFixed(0)}% de l'offre`);
    } else if (sec.top10Pct > cfg.risk.top10Warn) {
      // Pénalité progressive entre le seuil d'alerte et le seuil de veto.
      const span = cfg.risk.top10Veto - cfg.risk.top10Warn;
      const mult = 1 - 0.7 * ((sec.top10Pct - cfg.risk.top10Warn) / span);
      add('risk.top10', mult, `top 10 des holders = ${(sec.top10Pct * 100).toFixed(0)}% de l'offre`);
    }
  }

  if (sec.devHoldingPct != null) {
    known++;
    if (sec.devHoldingPct > 0.15) {
      add('risk.dev', 0.2, `le déployeur détient ${(sec.devHoldingPct * 100).toFixed(0)}% de l'offre`);
    } else if (sec.devHoldingPct > cfg.risk.devWarn) {
      add('risk.dev', 0.75, `le déployeur détient ${(sec.devHoldingPct * 100).toFixed(0)}% de l'offre`);
    }
  }

  if (sec.devSold) add('risk.devSold', 0.5, 'le déployeur a déjà vendu une partie de son allocation');

  return finish(gates, known / total);
};

const finish = (gates: Gate[], coverage: number): RiskAnalysis => {
  const multiplier = gates.reduce((acc, g) => acc * g.multiplier, 1);
  return {
    gates,
    multiplier,
    vetoes: gates.filter((g) => g.fatal).map((g) => g.reason),
    coverage: clamp(coverage),
  };
};
