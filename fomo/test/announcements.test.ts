import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { demoExtraTweets, demoFixture, demoWatchlist } from '../fixtures/demo.ts';
import { alertsToSeeds, scoreMatch, watchAnnouncements } from '../src/announcements.ts';
import type { AnnouncementAlert } from '../src/announcements.ts';
import { DEFAULT_CONFIG } from '../src/config.ts';
import {
  classifyKind,
  cryptoAffinity,
  detectAnnouncement,
  isLookalike,
  levenshtein,
} from '../src/features/announcement.ts';
import { buildFixtureAnnouncementProviders } from '../src/providers.ts';
import { AnnouncementMemory, SeenStore } from '../src/store.ts';
import type { WatchedAccount } from '../src/watchlist.ts';
import type { Author, Tweet } from '../src/types.ts';

const now = Date.UTC(2026, 0, 15, 12, 0, 0);
const DAY = 86_400_000;
const CA = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

test('classifyKind sépare les types d’annonce, en français comme en anglais', () => {
  assert.equal(classifyKind(`voici le contrat ${CA}`), 'CA_DROP');
  assert.equal(classifyKind('CA: bientôt disponible'), 'CA_DROP');
  assert.equal(classifyKind('$MOON est officiellement lancé'), 'LAUNCH');
  assert.equal(classifyKind('introducing $MOON, now live'), 'LAUNCH');
  assert.equal(classifyKind('grosse annonce demain sur $MOON'), 'TICKER_TEASE');
  assert.equal(classifyKind('je garde mon $MOON'), 'ENDORSEMENT');
  assert.equal(classifyKind('belle journée à tous'), 'NONE');
});

test('cryptoAffinity distingue un habitué d’un compte qui n’en parle jamais', () => {
  const shiller = Array.from({ length: 10 }, (_, i) => tw(`s${i}`, 'a', now, `$GEM ${i} pumpfun`));
  const civilian = Array.from({ length: 10 }, (_, i) => tw(`c${i}`, 'a', now, `belle journée numéro ${i}`));
  assert.equal(cryptoAffinity(shiller), 1);
  assert.equal(cryptoAffinity(civilian), 0);
  // Historique trop court : on reste au milieu plutôt que de conclure.
  assert.equal(cryptoAffinity(civilian.slice(0, 2)), 0.5);
});

test('la surprise pèse plus lourd que la répétition', () => {
  const common = { now, watchlist: [], watched: watched('KOL') };
  const surprising = detectAnnouncement({
    ...common,
    tweet: tw('t1', 'a', now - 60_000, `$MOON officiellement lancé, CA ${CA}`),
    author: au('a', 'compte', 1_000_000, now - 2000 * DAY),
    authorRecentTweets: Array.from({ length: 8 }, (_, i) => tw(`h${i}`, 'a', now, `journée ordinaire ${i}`)),
  });
  const routine = detectAnnouncement({
    ...common,
    tweet: tw('t2', 'a', now - 60_000, `$MOON officiellement lancé, CA ${CA}`),
    author: au('a', 'compte', 1_000_000, now - 2000 * DAY),
    authorRecentTweets: Array.from({ length: 8 }, (_, i) => tw(`h${i}`, 'a', now, `$GEM${i} prochain x100 solana`)),
  });
  assert.ok(surprising.strength > routine.strength);
});

test('isLookalike attrape les substitutions visuelles et les suffixes', () => {
  assert.ok(isLookalike('compte_officiel', 'compte_0fficiel'));
  assert.ok(isLookalike('elonmusk', 'elonmusk_official'));
  assert.ok(isLookalike('binance', 'b1nance'));
  assert.ok(!isLookalike('binance', 'coinbase'));
  assert.ok(!isLookalike('abc', 'xyz'));
});

test('levenshtein reste exact sur les cas de base', () => {
  assert.equal(levenshtein('chat', 'chat'), 0);
  assert.equal(levenshtein('chat', 'chats'), 1);
  assert.equal(levenshtein('chat', 'chien'), 3);
});

test('une annonce du compte surveillé sort avec une force élevée', () => {
  const a = detectAnnouncement({
    tweet: tw('t', 'a', now - 2 * 60_000, `$MOON est lancé. CA : ${CA}`),
    author: au('a', 'officiel', 3_000_000, now - 3000 * DAY),
    now,
    watched: watched('OFFICIAL'),
    watchlist: [],
    authorRecentTweets: Array.from({ length: 6 }, (_, i) => tw(`h${i}`, 'a', now, `sujet ordinaire ${i}`)),
  });
  assert.equal(a.kind, 'CA_DROP');
  assert.deepEqual(a.addresses, [CA]);
  assert.deepEqual(a.tickers, ['MOON']);
  assert.ok(a.strength > 0.8);
  assert.equal(a.warnings.length, 0);
});

test('plusieurs adresses dans un tweet annulent l’annonce', () => {
  const a = detectAnnouncement({
    tweet: tw('t', 'a', now, `${CA} ou 0x1234567890abcdef1234567890abcdef12345678`),
    author: au('a', 'officiel', 3_000_000, now - 3000 * DAY),
    now,
    watched: watched('OFFICIAL'),
    watchlist: [],
  });
  assert.equal(a.strength, 0);
  assert.ok(a.warnings.some((w) => w.key === 'adresses_multiples' && w.fatal));
});

test('un compte qui imite un compte surveillé est bloqué', () => {
  const a = detectAnnouncement({
    tweet: tw('t', 'fake', now, `$MOON lancé, CA ${CA}`),
    author: au('fake', 'compte_0fficiel', 9_000, now - 4 * DAY),
    now,
    watched: null,
    watchlist: [{ id: 'a', username: 'compte_officiel', tier: 'OFFICIAL' }],
  });
  assert.equal(a.strength, 0);
  assert.ok(a.warnings.some((w) => w.key === 'usurpation' && w.fatal));
});

test('une adresse publiée hors watchlist est signalée sans être bloquée', () => {
  const a = detectAnnouncement({
    tweet: tw('t', 'x', now, `$MOON, CA ${CA}`),
    author: au('x', 'inconnu', 20_000, now - 900 * DAY),
    now,
    watched: null,
    watchlist: [],
  });
  assert.ok(a.strength > 0);
  assert.ok(a.warnings.some((w) => w.key === 'adresse_non_verifiee' && !w.fatal));
});

test('un pool créé après l’annonce est le seul candidat plausible', async () => {
  const fixture = demoFixture(now);
  const clone = fixture.tokens[4].market as Record<string, number>;
  const announcement = detectAnnouncement({
    tweet: tw('t', 'a', now - 9 * 60_000, '$HOPE arrive'),
    author: au('a', 'officiel', 3_000_000, now - 3000 * DAY),
    now,
    watched: watched('OFFICIAL'),
    watchlist: [],
  });

  const fresh = scoreMatch(fixture.tokens[4].market as never, announcement, DEFAULT_CONFIG, now);
  assert.ok(fresh.reasons.some((r) => r.includes('pool créé')));

  // Le même token, mais déployé il y a deux semaines : homonyme, pas candidat.
  clone.pairAgeMs = 14 * DAY;
  const old = scoreMatch(fixture.tokens[4].market as never, announcement, DEFAULT_CONFIG, now);
  assert.ok(old.confidence < fresh.confidence);
  assert.ok(old.reasons.some((r) => r.includes('homonyme')));
});

const runTrack = async (seen?: SeenStore): Promise<AnnouncementAlert[]> => {
  const fixture = demoFixture(now);
  return watchAnnouncements({
    providers: buildFixtureAnnouncementProviders(fixture),
    watchlist: demoWatchlist(),
    seen: seen ?? new SeenStore('/dev/null'),
    extraTweets: demoExtraTweets(now),
    now,
  });
};

test('la piste annonces confirme la vraie, signale les clones, bloque l’usurpateur', async () => {
  const alerts = await runTrack();
  const byStatus = new Map(alerts.map((a) => [a.status, a]));

  const confirmed = byStatus.get('TOKEN_CONFIRME');
  assert.ok(confirmed, 'une annonce confirmée était attendue');
  assert.equal(confirmed.announcement.author.username, 'compte_officiel');
  assert.equal(confirmed.matches[0].market.address, CA);

  const clones = byStatus.get('CLONES_MULTIPLES');
  assert.ok(clones, 'la situation de clones multiples était attendue');
  assert.ok(clones.matches.length >= 2);

  const blocked = byStatus.get('IGNOREE');
  assert.ok(blocked, 'l’usurpateur devait être écarté');
  assert.ok(blocked.announcement.warnings.some((w) => w.key === 'usurpation'));
  assert.equal(blocked.matches.length, 0);
});

test('une annonce déjà traitée ne réalerte pas', async () => {
  const seen = new SeenStore('/dev/null');
  assert.ok((await runTrack(seen)).length > 0);
  assert.deepEqual(await runTrack(seen), []);
});

test('alertsToSeeds ne retient que les correspondances exploitables', async () => {
  const seeds = alertsToSeeds(await runTrack());
  const confirmed = seeds.find((s) => s.address === CA);
  assert.ok(confirmed);
  assert.ok(confirmed.strength > 0.5);
  assert.ok(confirmed.label.includes('source confirmée'));

  // Le clone entre dans le scanner, mais avec une force divisée par deux.
  const clone = seeds.find((s) => s.address !== CA);
  assert.ok(clone);
  assert.ok(clone.strength < confirmed.strength);
  assert.ok(clone.label.includes('non vérifiée'));
});

test('la mémoire des annonces décroît puis expire', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'fomo-'));
  const memory = new AnnouncementMemory(join(dir, 'm.json'), 6 * 3_600_000, 3_600_000);
  memory.remember({ address: CA, chain: 'solana', strength: 0.8, label: 'annonce', at: now });

  assert.equal(memory.active(now)[0].decayed, 0.8);
  // Une demi-vie plus tard, l'annonce compte moitié moins.
  assert.ok(Math.abs(memory.active(now + 3_600_000)[0].decayed - 0.4) < 1e-9);
  assert.deepEqual(memory.active(now + 7 * 3_600_000), []);

  await memory.save();
  const reloaded = new AnnouncementMemory(join(dir, 'm.json'));
  await reloaded.load();
  assert.equal(reloaded.active(now).length, 1);
  await rm(dir, { recursive: true, force: true });
});

test('la mémoire ne conserve que l’annonce la plus forte par adresse', () => {
  const memory = new AnnouncementMemory('/dev/null');
  memory.remember({ address: CA, chain: 'solana', strength: 0.9, label: 'forte', at: now });
  memory.remember({ address: CA, chain: 'solana', strength: 0.3, label: 'faible', at: now });
  assert.equal(memory.active(now)[0].label, 'forte');
});

const tw = (id: string, authorId: string, createdAt: number, text: string): Tweet => ({
  id, authorId, createdAt, text, likes: 100, retweets: 20, replies: 15, quotes: 5, isRetweet: false,
});

const au = (id: string, username: string, followers: number, createdAt: number): Author => ({
  id, username, followers, following: 300, tweetCount: 4000, createdAt,
  verified: true, hasDefaultAvatar: false,
});

const watched = (tier: WatchedAccount['tier']): WatchedAccount => ({
  id: 'a', username: 'officiel', tier,
});
