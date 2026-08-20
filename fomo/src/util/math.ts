/** Boîte à outils numérique du moteur. Aucune dépendance externe. */

export const clamp = (x: number, lo = 0, hi = 1): number =>
  Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : lo;

/**
 * Squash logistique : ramène une grandeur non bornée dans [0, 1].
 * `mid` est la valeur qui donne 0.5, `k` la raideur de la transition.
 */
export const logistic = (x: number, mid: number, k: number): number => {
  if (!Number.isFinite(x)) return 0;
  return 1 / (1 + Math.exp(-k * (x - mid)));
};

/**
 * Ratio robuste : évite les divisions par zéro et les explosions quand le
 * dénominateur est minuscule (typique des baselines de mentions à 0).
 */
export const ratio = (num: number, den: number, floor = 1): number =>
  num / Math.max(den, floor);

/** log1p normalisé : compresse les ordres de grandeur (followers, volumes...). */
export const logScale = (x: number, max: number): number => {
  if (x <= 0) return 0;
  return clamp(Math.log1p(x) / Math.log1p(max));
};

export const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export const mean = (xs: number[]): number =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

export const stdev = (xs: number[]): number => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
};

/**
 * Écart médian absolu, plus robuste que l'écart-type face aux pics :
 * indispensable ici puisque les séries de mentions sont pleines d'outliers.
 */
export const mad = (xs: number[]): number => {
  const m = median(xs);
  return median(xs.map((x) => Math.abs(x - m)));
};

/**
 * z-score robuste basé sur médiane + MAD (1.4826 = facteur de cohérence gaussienne).
 *
 * Cas limite fréquent ici : une baseline parfaitement plate (« 2 mentions par
 * quart d'heure, toujours ») donne un MAD nul et donc une division par zéro.
 * On retombe alors sur une dispersion de Poisson, sqrt(médiane), qui est le
 * bon modèle pour un comptage d'événements rares — sinon un pic ×30 et un pic
 * ×3 rendraient exactement le même score.
 */
export const robustZ = (x: number, xs: number[]): number => {
  const m = median(xs);
  const scale = 1.4826 * mad(xs);
  if (scale === 0) return (x - m) / Math.sqrt(Math.max(m, 1) + 1);
  return (x - m) / scale;
};

/** Décroissance exponentielle : 1 à t=0, 0.5 à t=halfLife. */
export const decay = (ageMs: number, halfLifeMs: number): number =>
  ageMs <= 0 ? 1 : Math.pow(0.5, ageMs / halfLifeMs);

/** Moyenne pondérée, en ignorant les poids nuls. */
export const weightedMean = (pairs: Array<[value: number, weight: number]>): number => {
  let sw = 0;
  let sv = 0;
  for (const [v, w] of pairs) {
    if (w <= 0) continue;
    sv += v * w;
    sw += w;
  }
  return sw === 0 ? 0 : sv / sw;
};

/** Similarité de Jaccard sur les mots — sert à détecter le copier-coller des bots. */
export const jaccard = (a: string, b: string): number => {
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  return inter / (sa.size + sb.size - inter);
};

export const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^\p{L}\p{N}$#]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 1);
