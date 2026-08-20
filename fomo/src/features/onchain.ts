import type { Config } from '../config.ts';
import type { MarketSnapshot, Signal } from '../types.ts';
import { clamp, logScale, logistic, ratio } from '../util/math.ts';

export type OnchainAnalysis = {
  signals: Signal[];
  score: number;
  /** Volume 5 min ramené à un rythme horaire, divisé par le volume réel de la dernière heure. */
  volumeAccel: number;
  /** Déséquilibre acheteurs/vendeurs sur 5 min, -1..1. */
  buyPressure: number;
  coverage: number;
};

/** Déséquilibre taker : +1 = que des achats, -1 = que des ventes. */
export const imbalance = (buys: number, sells: number): number => {
  const total = buys + sells;
  return total === 0 ? 0 : (buys - sells) / total;
};

export const analyzeOnchain = (m: MarketSnapshot, cfg: Config): OnchainAnalysis => {
  // 1. Liquidité : condition de survie. Sans profondeur, le slippage mange le gain.
  const liqScore =
    m.liquidityUsd < cfg.onchain.minLiquidityUsd
      ? 0
      : logScale(m.liquidityUsd - cfg.onchain.minLiquidityUsd, cfg.onchain.goodLiquidityUsd);

  // 2. Accélération du volume : le 5 min extrapolé doit dépasser le rythme de l'heure.
  const hourlyRate = m.volume.h1 / 12; // volume moyen par tranche de 5 min sur 1 h
  const volumeAccel = ratio(m.volume.m5, hourlyRate, 1);
  const volAccelScore = logistic(volumeAccel, cfg.onchain.midVolumeAccel, 0.9);

  // 3. Volume rapporté à la liquidité : mesure la vraie rotation du pool.
  const turnover = ratio(m.volume.h1, m.liquidityUsd, 1);
  const turnoverScore = logistic(turnover, 2, 0.7);

  // 4. Pression acheteuse sur 5 min, confirmée sur 1 h pour éviter le bruit.
  const buy5 = imbalance(m.txns.m5.buys, m.txns.m5.sells);
  const buy1h = imbalance(m.txns.h1.buys, m.txns.h1.sells);
  const buyPressure = 0.65 * buy5 + 0.35 * buy1h;
  const buyScore = clamp((buyPressure + 0.1) / 0.5);

  // 5. Croissance des holders : la distribution réelle, impossible à simuler à bas coût.
  const holderGrowth =
    m.holders != null && m.holdersPrev != null && m.holdersPrev > 0
      ? (m.holders - m.holdersPrev) / m.holdersPrev
      : null;
  const holderScore = holderGrowth == null ? 0.4 : logistic(holderGrowth, 0.15, 12);

  // 6. Marge de progression : à 50 M$ de FDV, le x100 est derrière nous.
  const headroom =
    m.fdvUsd <= 0
      ? 0.5
      : clamp(1 - Math.log10(Math.max(m.fdvUsd, 1e4) / 1e4) / Math.log10(cfg.onchain.fdvLateUsd / 1e4));
  const headroomScore = m.fdvUsd < cfg.onchain.fdvHeadroomUsd ? Math.max(headroom, 0.75) : headroom;

  // 7. Structure de prix : on veut une jambe de hausse jeune, pas un rebond de cadavre.
  //    Hausse forte sur 5 min ET 1 h, sans effondrement sur 6 h.
  const up = m.priceChangePct.m5 > 0 && m.priceChangePct.h1 > 0;
  const collapsed = m.priceChangePct.h6 < -40;
  const overextended = m.priceChangePct.h1 > 400;
  const structureScore = collapsed ? 0.05 : overextended ? 0.35 : up ? 0.85 : 0.3;

  const signals: Signal[] = [
    s('onchain.liquidity', m.liquidityUsd, liqScore, `${usd(m.liquidityUsd)} de liquidité`),
    s('onchain.volumeAccel', volumeAccel, volAccelScore, `volume 5 min ×${volumeAccel.toFixed(1)} du rythme horaire`),
    s('onchain.turnover', turnover, turnoverScore, `rotation ${turnover.toFixed(1)}× la liquidité sur 1 h`),
    s('onchain.buyPressure', buyPressure, buyScore, `${(buyPressure * 100).toFixed(0)}% de déséquilibre acheteur`),
    s('onchain.holderGrowth', holderGrowth ?? 0, holderScore, holderGrowth == null ? 'holders inconnus' : `${(holderGrowth * 100).toFixed(1)}% de holders en plus`),
    s('onchain.headroom', m.fdvUsd, headroomScore, `FDV ${usd(m.fdvUsd)}`),
    s('onchain.structure', m.priceChangePct.h1, structureScore, `${m.priceChangePct.m5.toFixed(0)}% / 5 min, ${m.priceChangePct.h1.toFixed(0)}% / 1 h, ${m.priceChangePct.h6.toFixed(0)}% / 6 h`),
  ];

  // La liquidité est un facteur multiplicatif : sous le plancher, tout le reste
  // est théorique puisqu'on ne peut pas sortir de la position.
  const additive =
    0.2 * volAccelScore +
    0.15 * turnoverScore +
    0.2 * buyScore +
    0.15 * holderScore +
    0.15 * headroomScore +
    0.15 * structureScore;

  const coverage = m.holders != null ? 1 : 0.8;

  return {
    signals,
    score: clamp(additive * (0.3 + 0.7 * liqScore)),
    volumeAccel,
    buyPressure,
    coverage,
  };
};

const s = (key: string, raw: number, score: number, detail: string): Signal => ({
  key,
  raw,
  score: clamp(score),
  detail,
});

export const usd = (n: number): string => {
  if (!Number.isFinite(n)) return 'n/a';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
};
