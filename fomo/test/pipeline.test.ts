import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { demoFixture } from '../fixtures/demo.ts';
import { DEFAULT_CONFIG, mergeConfig } from '../src/config.ts';
import { scan } from '../src/pipeline.ts';
import { buildFixtureProviders } from '../src/providers.ts';
import { HistoryStore } from '../src/store.ts';
import type { Evaluation } from '../src/types.ts';

const now = Date.UTC(2026, 0, 15, 12, 0, 0);

const runScan = async (opts: { store?: HistoryStore } = {}) => {
  const fixture = demoFixture(now);
  const kolIds = new Set(fixture.tokens.flatMap((t) => t.kolIds ?? []));
  const dir = await mkdtemp(join(tmpdir(), 'fomo-'));
  const store = opts.store ?? new HistoryStore(join(dir, 'h.json'));
  const result = await scan({
    providers: buildFixtureProviders(fixture),
    store,
    config: DEFAULT_CONFIG,
    kolIds,
    now,
  });
  await rm(dir, { recursive: true, force: true });
  return { result, store };
};

const bySymbol = (evals: Evaluation[], symbol: string): Evaluation => {
  const found = evals.find((e) => e.candidate.symbol === symbol);
  assert.ok(found, `${symbol} devrait avoir été évalué`);
  return found;
};

test('le scénario d’allumage authentique domine le classement', async () => {
  const { result } = await runScan();
  assert.equal(result.evaluated[0].candidate.symbol, 'HOPE');
  assert.equal(result.evaluated[0].phase, 'IGNITION');
  assert.ok(result.evaluated[0].fomo > 65);
});

test('le token piégé est ramené à zéro malgré de bons signaux de marché', async () => {
  const { result } = await runScan();
  const trap = bySymbol(result.evaluated, 'TRAP');
  // Ses blocs sont bons : c'est bien le verrou de sécurité qui l'élimine,
  // et non une faiblesse du signal — c'est tout l'intérêt du multiplicatif.
  assert.ok(trap.blocks.social > 0.5);
  assert.ok(trap.blocks.onchain > 0.5);
  assert.equal(trap.fomo, 0);
  assert.ok(trap.vetoes.length >= 1);
});

test('une ferme de bots est étiquetée et écartée', async () => {
  const { result } = await runScan();
  const safu = bySymbol(result.evaluated, 'SAFU');
  assert.equal(safu.phase, 'BOT_FARM');
  assert.ok(safu.blocks.social < 0.3);
});

test('un token déjà parabolique est classé en euphorie, pas en opportunité', async () => {
  const { result } = await runScan();
  const late = bySymbol(result.evaluated, 'LATE');
  assert.equal(late.phase, 'EUPHORIA');
  assert.ok(late.fomo < 50);
});

test('seules les phases actionnables déclenchent une alerte', async () => {
  const { result } = await runScan();
  assert.equal(result.alerts.length, 1);
  assert.equal(result.alerts[0].candidate.symbol, 'HOPE');
});

test('un seuil d’alerte plus haut supprime toutes les alertes', async () => {
  const fixture = demoFixture(now);
  const dir = await mkdtemp(join(tmpdir(), 'fomo-'));
  const result = await scan({
    providers: buildFixtureProviders(fixture),
    store: new HistoryStore(join(dir, 'h.json')),
    config: mergeConfig({ alertThreshold: 95 }),
    kolIds: new Set(fixture.tokens.flatMap((t) => t.kolIds ?? [])),
    now,
  });
  await rm(dir, { recursive: true, force: true });
  assert.equal(result.alerts.length, 0);
});

test('la présélection écarte les tokens sans liquidité suffisante', async () => {
  const fixture = demoFixture(now);
  fixture.tokens[0].market.liquidityUsd = 500;
  const dir = await mkdtemp(join(tmpdir(), 'fomo-'));
  const result = await scan({
    providers: buildFixtureProviders(fixture),
    store: new HistoryStore(join(dir, 'h.json')),
    now,
  });
  await rm(dir, { recursive: true, force: true });
  assert.ok(result.skipped.some((s) => s.reason.includes('liquidité')));
  assert.ok(!result.evaluated.some((e) => e.candidate.symbol === 'HOPE'));
});

test('chaque passe enrichit l’historique du token', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'fomo-'));
  const store = new HistoryStore(join(dir, 'h.json'));
  await runScan({ store });
  const addr = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
  assert.equal(store.get(addr).length, 1);
  assert.equal(store.firstSeen(addr), now);
  await rm(dir, { recursive: true, force: true });
});

test('l’historique est persisté puis relu à l’identique', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'fomo-'));
  const path = join(dir, 'h.json');
  const a = new HistoryStore(path);
  a.push('ABC', { at: now, mentions: 4, uniqueAuthors: 3, priceUsd: 1, volumeM5: 10 });
  await a.save();

  const b = new HistoryStore(path);
  await b.load();
  assert.deepEqual(b.get('ABC'), a.get('ABC'));
  await rm(dir, { recursive: true, force: true });
});

test('la rétention purge les points trop anciens', async () => {
  const store = new HistoryStore('/dev/null', 60 * 60_000);
  store.push('ABC', { at: now - 5 * 3_600_000, mentions: 1, uniqueAuthors: 1, priceUsd: 1, volumeM5: 1 });
  store.push('ABC', { at: now, mentions: 2, uniqueAuthors: 2, priceUsd: 1, volumeM5: 1 });
  assert.equal(store.get('ABC').length, 1);
  store.prune(now + 2 * 3_600_000);
  assert.equal(store.addresses().length, 0);
});

test('un premier démarrage sans fichier d’historique ne lève pas', async () => {
  const store = new HistoryStore(join(tmpdir(), `fomo-absent-${Date.now()}.json`));
  await store.load();
  assert.deepEqual(store.addresses(), []);
});
