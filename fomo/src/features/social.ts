import type { Config } from '../config.ts';
import type { Author, Signal, SocialBundle, Tweet } from '../types.ts';
import { clamp, jaccard, logScale, logistic, median, ratio, robustZ, weightedMean } from '../util/math.ts';

export type SocialAnalysis = {
  signals: Signal[];
  /** Score du bloc social, 0..1. */
  score: number;
  /** Part estimée de l'activité qui vient de bots / fermes de comptes, 0..1. */
  botRatio: number;
  /** Mentions dans le dernier bucket. */
  mentionsNow: number;
  /** Auteurs uniques dans le dernier bucket. */
  uniqueAuthorsNow: number;
  /** Vélocité courante en mentions par bucket. */
  velocity: number;
  /** Rapport vélocité actuelle / vélocité précédente. */
  acceleration: number;
  /** Couverture des données : 0 si aucun profil d'auteur n'est disponible. */
  coverage: number;
};

/** Découpe les tweets en buckets réguliers, du plus ancien au plus récent. */
export const bucketize = (
  tweets: Tweet[],
  now: number,
  bucketMs: number,
  lookbackMs: number,
): Tweet[][] => {
  const count = Math.max(2, Math.ceil(lookbackMs / bucketMs));
  const buckets: Tweet[][] = Array.from({ length: count }, () => []);
  for (const t of tweets) {
    const age = now - t.createdAt;
    if (age < 0 || age >= lookbackMs) continue;
    // index 0 = bucket le plus ancien, dernier index = les 15 dernières minutes
    const idx = count - 1 - Math.floor(age / bucketMs);
    if (idx >= 0 && idx < count) buckets[idx].push(t);
  }
  return buckets;
};

/**
 * Probabilité qu'un compte soit un bot / une ferme, 0..1.
 * Aucun critère n'est décisif seul : on additionne des indices faibles.
 */
export const botLikelihood = (a: Author | undefined, now: number, cfg: Config): number => {
  if (!a) return 0.5; // profil inconnu : on reste au milieu plutôt que de supposer le pire
  let p = 0;
  const ageMs = now - a.createdAt;

  if (ageMs < cfg.social.freshAccountMs) p += 0.3;
  if (ageMs < 7 * 24 * 60 * 60 * 1000) p += 0.2;
  if (a.hasDefaultAvatar) p += 0.15;
  if (a.followers < 50) p += 0.15;
  // Suit beaucoup, suivi par personne : signature classique du compte jetable.
  if (a.following > 500 && a.followers / Math.max(a.following, 1) < 0.1) p += 0.2;
  // Cadence de publication irréaliste pour un humain.
  const days = Math.max(ageMs / 86_400_000, 1);
  if (a.tweetCount / days > 150) p += 0.25;
  if (a.verified) p -= 0.25;
  if (a.followers > 10_000) p -= 0.2;

  return clamp(p);
};

/**
 * Part des tweets qui sont des quasi-doublons d'un autre tweet du lot.
 * Une campagne payée réutilise le même script sur des dizaines de comptes.
 */
export const duplicateRatio = (tweets: Tweet[], threshold: number): number => {
  const originals = tweets.filter((t) => !t.isRetweet);
  if (originals.length < 3) return 0;
  // Échantillonnage au-delà de 200 tweets : la comparaison est quadratique.
  const sample = originals.length > 200 ? originals.slice(-200) : originals;
  let dupes = 0;
  for (let i = 0; i < sample.length; i++) {
    for (let j = 0; j < sample.length; j++) {
      // Comparaison dans les deux sens : le dernier exemplaire d'un script
      // recopié est un doublon au même titre que le premier.
      if (i !== j && jaccard(sample[i].text, sample[j].text) >= threshold) {
        dupes++;
        break;
      }
    }
  }
  return dupes / sample.length;
};

/** Portée pondérée d'un auteur : log(followers), amortie par sa probabilité d'être un bot. */
const reachOf = (a: Author | undefined, now: number, cfg: Config): number => {
  if (!a) return 0;
  const base = logScale(a.followers, cfg.social.maxFollowers);
  return base * (1 - botLikelihood(a, now, cfg));
};

/** Annonce récente rattachée au token, issue de la piste « comptes surveillés ». */
export type AnnouncementContext = { strength: number; label: string };

export const analyzeSocial = (
  bundle: SocialBundle,
  now: number,
  cfg: Config,
  announcement?: AnnouncementContext,
): SocialAnalysis => {
  const buckets = bucketize(bundle.tweets, now, cfg.bucketMs, cfg.lookbackMs);
  const counts = buckets.map((b) => b.length);
  const last = buckets[buckets.length - 1] ?? [];
  const prev = buckets[buckets.length - 2] ?? [];
  const baseline = counts.slice(0, -2);

  const mentionsNow = last.length;
  const velocity = mentionsNow;
  const acceleration = ratio(mentionsNow, prev.length, 1);

  // 1. Volume absolu — un token dont personne ne parle ne décolle pas.
  const volumeScore = logistic(mentionsNow, cfg.social.midMentions, 0.12);

  // 2. Vélocité relative à SA PROPRE baseline (z robuste médiane/MAD).
  const z = robustZ(mentionsNow, baseline.length >= 4 ? baseline : [0, 0, 0, 0]);
  const velocityScore = logistic(z, cfg.social.midVelocityZ, 0.8);

  // 3. Accélération : les moves paraboliques sont convexes, pas linéaires.
  const accelScore = logistic(acceleration, cfg.social.midAcceleration, 1.1);

  // 4. Diffusion : beaucoup d'auteurs distincts >> beaucoup de tweets.
  const authorsNow = new Set(last.map((t) => t.authorId));
  const uniqueAuthorsNow = authorsNow.size;
  const spread = mentionsNow === 0 ? 0 : uniqueAuthorsNow / mentionsNow;
  const spreadScore = clamp((spread - 0.25) / 0.5);

  // 5. Qualité de la portée : somme des portées, pas le max, pour capter la diffusion.
  const reachSum = [...authorsNow].reduce(
    (acc, id) => acc + reachOf(bundle.authors.get(id), now, cfg),
    0,
  );
  const reachScore = clamp(reachSum / 12);

  // 6. Allumage KOL : un seul gros compte crédible suffit à créer un TRUMP.
  //    C'est le signal le plus asymétrique de tout le moteur.
  let kolReach = 0;
  let kolName = '';
  for (const t of last) {
    if (!bundle.kolIds.has(t.authorId)) continue;
    const a = bundle.authors.get(t.authorId);
    if (a && a.followers > kolReach) {
      kolReach = a.followers;
      kolName = a.username;
    }
  }
  const kolScore = logScale(kolReach, cfg.social.maxKolReach);

  // 7. Profondeur d'engagement : réponses et citations = vrai débat.
  //    Des likes seuls s'achètent pour trois fois rien.
  const likes = last.reduce((a, t) => a + t.likes, 0);
  const conv = last.reduce((a, t) => a + t.replies + t.quotes, 0);
  const depth = ratio(conv, likes, 10);
  const depthScore = clamp(depth / 0.25);

  // 8. Authenticité : 1 - part de l'activité attribuable aux bots.
  const botScores = last.map((t) => botLikelihood(bundle.authors.get(t.authorId), now, cfg));
  const dupes = duplicateRatio(last, cfg.social.duplicateThreshold);
  const botRatio = clamp(median(botScores) * 0.6 + dupes * 0.4);
  const authenticity = 1 - botRatio;

  // 9. Nouveauté : être tôt vaut mieux qu'être fort. Un token dont on parle
  //    depuis 20 h n'est plus une découverte.
  const activeBuckets = counts.filter((c) => c > 0).length;
  const novelty = clamp(1 - (activeBuckets - 1) / 12);

  const signals: Signal[] = [
    sig('social.volume', mentionsNow, volumeScore, `${mentionsNow} mentions sur ${fmtMin(cfg.bucketMs)}`),
    sig('social.velocity', z, velocityScore, `z=${z.toFixed(1)} vs baseline ${median(baseline).toFixed(0)}/bucket`),
    sig('social.acceleration', acceleration, accelScore, `×${acceleration.toFixed(1)} vs bucket précédent`),
    sig('social.spread', spread, spreadScore, `${uniqueAuthorsNow} auteurs uniques (${(spread * 100).toFixed(0)}%)`),
    sig('social.reach', reachSum, reachScore, `portée cumulée pondérée ${reachSum.toFixed(1)}`),
    sig('social.kol', kolReach, kolScore, kolName ? `KOL @${kolName} (${fmtNum(kolReach)} abonnés)` : 'aucun KOL suivi'),
    sig('social.depth', depth, depthScore, `${conv} réponses+cites / ${likes} likes`),
    sig('social.authenticity', authenticity, authenticity, `${(botRatio * 100).toFixed(0)}% bots estimés, ${(dupes * 100).toFixed(0)}% doublons`),
    sig('social.novelty', novelty, novelty, `${activeBuckets} buckets actifs depuis le début`),
  ];

  // 10. Annonce d'un compte surveillé. Ce signal ne se déduit pas des mentions :
  //     il arrive AVANT elles, et c'est précisément ce qui le rend utile. Un
  //     token sans historique social peut ainsi ressortir dès la première passe.
  if (announcement) {
    signals.push(sig('social.annonce', announcement.strength, announcement.strength, announcement.label));
  }

  // Moyenne pondérée plutôt que somme codée en dur : les poids se renormalisent
  // tout seuls, ce qui permet d'ajouter le signal d'annonce quand il existe sans
  // déséquilibrer les tokens pour lesquels il n'y en a pas.
  const additive = weightedMean([
    [volumeScore, 0.1],
    [velocityScore, 0.2],
    [accelScore, 0.2],
    [spreadScore, 0.15],
    [reachScore, 0.1],
    [kolScore, 0.15],
    [depthScore, 0.05],
    [novelty, 0.05],
    [announcement?.strength ?? 0, announcement ? 0.25 : 0],
  ]);

  // L'authenticité reste multiplicative et non additive : un score social
  // magnifique porté par une ferme de bots ne vaut rien du tout.

  const known = last.filter((t) => bundle.authors.has(t.authorId)).length;
  const coverage = mentionsNow === 0 ? 0 : known / mentionsNow;

  return {
    signals,
    score: clamp(additive * (0.35 + 0.65 * authenticity)),
    botRatio,
    mentionsNow,
    uniqueAuthorsNow,
    velocity,
    acceleration,
    coverage,
  };
};

const sig = (key: string, raw: number, score: number, detail: string): Signal => ({
  key,
  raw,
  score: clamp(score),
  detail,
});

const fmtMin = (ms: number): string => `${Math.round(ms / 60000)} min`;
const fmtNum = (n: number): string =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}k` : String(n);
