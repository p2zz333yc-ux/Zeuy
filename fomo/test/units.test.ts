import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_CONFIG } from '../src/config.ts';
import { analyzeOnchain, imbalance } from '../src/features/onchain.ts';
import { analyzeRisk } from '../src/features/risk.ts';
import { botLikelihood, bucketize, duplicateRatio } from '../src/features/social.ts';
import { snapshotFromPairs } from '../src/sources/dexscreener.ts';
import { buildTokenQuery, extractAddresses, extractCashtags } from '../src/sources/x.ts';
import { jaccard, logistic, robustZ } from '../src/util/math.ts';
import type { Author, MarketSnapshot, SecurityReport, Tweet } from '../src/types.ts';

const cfg = DEFAULT_CONFIG;
const now = Date.UTC(2026, 0, 15, 12, 0, 0);
const DAY = 86_400_000;

test('logistic est centré sur mid et borné', () => {
  assert.equal(logistic(5, 5, 1), 0.5);
  assert.ok(logistic(50, 5, 1) > 0.99);
  assert.ok(logistic(-50, 5, 1) < 0.01);
});

test('robustZ signale un pic malgré une baseline plate', () => {
  // Baseline plate : le MAD est nul, on retombe sur une dispersion de Poisson
  // qui conserve l'ordre de grandeur du pic au lieu de l'écraser.
  assert.ok(robustZ(100, [1, 1, 1, 1]) > 30);
  assert.ok(robustZ(100, [1, 1, 1, 1]) > robustZ(10, [1, 1, 1, 1]));
  assert.equal(robustZ(1, [1, 1, 1, 1]), 0);
  assert.ok(robustZ(20, [1, 2, 1, 3, 2]) > 3);
  assert.ok(robustZ(2, [1, 2, 1, 3, 2]) < 1);
});

test('jaccard reconnaît le copier-coller et sépare les textes distincts', () => {
  assert.ok(jaccard('next 1000x gem dont miss', 'next 1000x gem dont miss') > 0.99);
  assert.ok(jaccard('qui detient la LP de ce token', 'next 1000x gem dont miss') < 0.2);
});

test('botLikelihood distingue un compte jetable d’un compte établi', () => {
  const throwaway: Author = {
    id: 'a', username: 'x1gem', followers: 12, following: 2000, tweetCount: 5000,
    createdAt: now - 3 * DAY, verified: false, hasDefaultAvatar: true,
  };
  const real: Author = {
    id: 'b', username: 'trader', followers: 42_000, following: 800, tweetCount: 9000,
    createdAt: now - 1500 * DAY, verified: true, hasDefaultAvatar: false,
  };
  assert.ok(botLikelihood(throwaway, now, cfg) > 0.8);
  assert.ok(botLikelihood(real, now, cfg) < 0.1);
  // Profil inconnu : incertitude, pas condamnation.
  assert.equal(botLikelihood(undefined, now, cfg), 0.5);
});

test('duplicateRatio détecte un script réutilisé', () => {
  const same = Array.from({ length: 10 }, (_, i) => tweet(`s${i}`, `a${i}`, now, 'buy $SAFU next 1000x gem'));
  assert.ok(duplicateRatio(same, cfg.social.duplicateThreshold) > 0.9);

  const sentences = [
    'qui detient la liquidite de ce projet exactement',
    'le graphique montre une consolidation apres la hausse',
    'je prends mes benefices ici, trop de volatilite',
    'le fondateur a repondu aux questions hier soir',
    'attention aux portefeuilles concentres sur cette adresse',
  ];
  const varied = sentences.map((text, i) => tweet(`v${i}`, `a${i}`, now, text));
  assert.equal(duplicateRatio(varied, cfg.social.duplicateThreshold), 0);
});

test('bucketize range les tweets du plus ancien au plus récent', () => {
  const tweets = [
    tweet('old', 'a', now - 60 * 60_000, 'vieux'),
    tweet('new1', 'a', now - 2 * 60_000, 'recent'),
    tweet('new2', 'b', now - 60_000, 'recent'),
    tweet('futur', 'c', now + 60_000, 'ignoré'),
  ];
  const buckets = bucketize(tweets, now, cfg.bucketMs, cfg.lookbackMs);
  assert.equal(buckets[buckets.length - 1].length, 2);
  assert.equal(buckets.flat().length, 3);
});

test('imbalance est borné et symétrique', () => {
  assert.equal(imbalance(10, 0), 1);
  assert.equal(imbalance(0, 10), -1);
  assert.equal(imbalance(5, 5), 0);
  assert.equal(imbalance(0, 0), 0);
});

test('la liquidité sous le plancher écrase le score on-chain', () => {
  const thin = analyzeOnchain(market({ liquidityUsd: 4_000 }), cfg);
  const deep = analyzeOnchain(market({ liquidityUsd: 300_000 }), cfg);
  assert.ok(thin.score < deep.score * 0.5);
});

test('une autorité de mint active disqualifie, quel que soit le reste', () => {
  const risk = analyzeRisk(market({}), security({ mintRevoked: false }), cfg);
  assert.equal(risk.multiplier, 0);
  assert.equal(risk.vetoes.length, 1);
});

test('une concentration excessive du top 10 disqualifie', () => {
  assert.equal(analyzeRisk(market({}), security({ top10Pct: 0.7 }), cfg).multiplier, 0);
  const warned = analyzeRisk(market({}), security({ top10Pct: 0.4 }), cfg);
  assert.ok(warned.multiplier > 0 && warned.multiplier < 1);
});

test('l’absence d’audit dégrade le score sans le supprimer', () => {
  const risk = analyzeRisk(market({}), null, cfg);
  assert.ok(risk.multiplier > 0 && risk.multiplier < 0.5);
  assert.equal(risk.vetoes.length, 0);
});

test('un pool trop jeune est écarté : rien n’est encore vérifiable', () => {
  assert.equal(analyzeRisk(market({ pairAgeMs: 30_000 }), security({}), cfg).multiplier, 0);
});

test('extractAddresses trouve les adresses EVM et Solana', () => {
  const found = extractAddresses(
    'CA: 0xAbC1230000000000000000000000000000009999 et 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU go',
  );
  assert.ok(found.includes('0xAbC1230000000000000000000000000000009999'));
  assert.ok(found.includes('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'));
});

test('extractCashtags normalise en majuscules', () => {
  assert.deepEqual(extractCashtags('long $hope et $TRAP'), ['HOPE', 'TRAP']);
});

test('buildTokenQuery cible l’adresse et le cashtag, hors retweets', () => {
  const q = buildTokenQuery('0xdead', 'HO PE!');
  assert.ok(q.includes('"0xdead"'));
  assert.ok(q.includes('$HOPE'));
  assert.ok(q.includes('-is:retweet'));
});

test('snapshotFromPairs additionne la liquidité et retient le pool principal', () => {
  const snap = snapshotFromPairs(
    [
      { chainId: 'solana', baseToken: { address: 'ABC', symbol: 'A' }, liquidity: { usd: 1000 }, priceUsd: '1' },
      { chainId: 'solana', baseToken: { address: 'ABC', symbol: 'A' }, liquidity: { usd: 9000 }, priceUsd: '2' },
      { chainId: 'solana', baseToken: { address: 'XYZ', symbol: 'X' }, liquidity: { usd: 5000 }, priceUsd: '3' },
    ],
    'ABC',
  ) as MarketSnapshot;
  assert.equal(snap.liquidityUsd, 10_000);
  assert.equal(snap.priceUsd, 2);
  assert.equal(snapshotFromPairs([], 'ABC'), null);
});

const tweet = (id: string, authorId: string, createdAt: number, text: string): Tweet => ({
  id, authorId, createdAt, text, likes: 1, retweets: 0, replies: 0, quotes: 0, isRetweet: false,
});

const market = (patch: Partial<MarketSnapshot>): MarketSnapshot => ({
  address: 'ABC', chain: 'solana', symbol: 'ABC', name: 'ABC', fetchedAt: now,
  priceUsd: 0.001, pairAgeMs: 60 * 60_000, liquidityUsd: 100_000, fdvUsd: 1_000_000,
  marketCapUsd: 1_000_000,
  volume: { m5: 50_000, h1: 200_000, h6: 200_000, h24: 200_000 },
  priceChangePct: { m5: 5, h1: 30, h6: 30, h24: 30 },
  txns: {
    m5: { buys: 200, sells: 60 }, h1: { buys: 900, sells: 400 },
    h6: { buys: 900, sells: 400 }, h24: { buys: 900, sells: 400 },
  },
  ...patch,
});

const security = (patch: Partial<SecurityReport>): SecurityReport => ({
  address: 'ABC', chain: 'solana', mintRevoked: true, freezeRevoked: true, lpBurnedPct: 1,
  top10Pct: 0.1, devHoldingPct: 0.01, devSold: false, sellTaxPct: 0, honeypot: false,
  ...patch,
});
