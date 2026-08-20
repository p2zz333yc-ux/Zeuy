#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { alertsToSeeds, watchAnnouncements } from './announcements.ts';
import type { AnnouncementAlert, AnnouncementProviders } from './announcements.ts';
import { mergeConfig } from './config.ts';
import { scan } from './pipeline.ts';
import type { Providers } from './pipeline.ts';
import {
  buildFixtureAnnouncementProviders,
  buildFixtureProviders,
  buildLiveAnnouncementProviders,
  buildLiveProviders,
} from './providers.ts';
import { renderAnnouncements, renderConsole, renderHtml } from './report.ts';
import { AnnouncementMemory, HistoryStore, SeenStore } from './store.ts';
import type { AnnouncementContext } from './features/social.ts';
import { loadWatchlist, resolveWatchlist, saveWatchlist } from './watchlist.ts';
import type { WatchedAccount } from './watchlist.ts';
import { XClient } from './sources/x.ts';
import type { Author, Chain, Tweet } from './types.ts';

const USAGE = `
Scanner FOMO — annonces X + allumage social + confirmation on-chain

  scan                     une passe complète (annonces puis scanner)
  watch                    passes répétées jusqu'à interruption
  announce                 piste « annonces » seule, sans scan de marché
  resolve                  résout les pseudonymes de la watchlist en identifiants

Options
  --demo                   scénarios synthétiques (aucune clé requise)
  --interval <secondes>    intervalle de watch (défaut : 300)
  --watchlist <f.json>     comptes surveillés (défaut : fomo-watchlist.json)
  --config <f.json>        surcharge des seuils
  --store <f.json>         historique persisté (défaut : .fomo-history.json)
  --seen <f.json>          annonces déjà traitées (défaut : .fomo-seen.json)
  --memory <f.json>        annonces actives rattachées aux tokens (défaut : .fomo-announcements.json)
  --html <f.html>          rapport HTML autonome
  --max <n>                candidats enrichis par passe (défaut : 25)
  --no-announce            désactive la piste annonces
  --verbose                détaille chaque signal
  --json                   sortie brute

Variables d'environnement
  X_BEARER_TOKEN           jeton d'application X API v2 (palier Basic minimum)
  FOMO_KOL_IDS             identifiants X des comptes d'influence, séparés par des virgules
  FOMO_WATCHLIST           chemin par défaut de la watchlist
`;

const main = async (argv: string[]): Promise<number> => {
  const args = parseArgs(argv);
  const command = args._[0] ?? 'scan';

  if (args.flags.help || command === 'help') {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }

  const config = mergeConfig(
    args.flags.config ? JSON.parse(await readFile(String(args.flags.config), 'utf8')) : {},
  );
  const watchlistPath = String(
    args.flags.watchlist ?? process.env.FOMO_WATCHLIST ?? 'fomo-watchlist.json',
  );
  const token = process.env.X_BEARER_TOKEN;

  if (command === 'resolve') return resolveCommand(watchlistPath, token);

  const store = new HistoryStore(String(args.flags.store ?? '.fomo-history.json'), config.lookbackMs);
  const seen = new SeenStore(String(args.flags.seen ?? '.fomo-seen.json'));
  const memory = new AnnouncementMemory(String(args.flags.memory ?? '.fomo-announcements.json'));
  await Promise.all([store.load(), seen.load(), memory.load()]);

  const kolIds = new Set(
    (process.env.FOMO_KOL_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  );

  let providers: Providers;
  let annProviders: AnnouncementProviders | null = null;
  let watchlist: WatchedAccount[] = [];
  /** Tweets hors watchlist : en démonstration, ils portent les faux comptes. */
  let extraTweets: { tweets: Tweet[]; authors: Map<string, Author> } | undefined;

  if (args.flags.demo) {
    const { demoFixture, demoWatchlist, demoExtraTweets } = await import('../fixtures/demo.ts');
    const fixture = demoFixture(Date.now());
    for (const t of fixture.tokens) for (const id of t.kolIds ?? []) kolIds.add(id);
    providers = buildFixtureProviders(fixture);
    annProviders = buildFixtureAnnouncementProviders(fixture);
    watchlist = demoWatchlist();
    extraTweets = demoExtraTweets(Date.now());
  } else {
    watchlist = await loadWatchlist(watchlistPath);
    if (!token) {
      process.stderr.write(
        'X_BEARER_TOKEN absent : ni les annonces ni le signal social ne seront exploitables.\n' +
          'Utilisez --demo pour voir les deux pistes tourner sur des scénarios synthétiques.\n',
      );
    } else {
      annProviders = buildLiveAnnouncementProviders(token);
      const resolved = await resolveWatchlist(new XClient({ bearerToken: token }), watchlist);
      if (resolved.some((a, i) => a.id !== watchlist[i]?.id)) {
        await saveWatchlist(watchlistPath, resolved);
      }
      watchlist = resolved;
    }
    providers = buildLiveProviders({
      config,
      xBearerToken: token,
      watchedAccounts: watchlist.map((a) => a.username),
    });
  }

  const announceEnabled = !args.flags['no-announce'] && annProviders !== null && watchlist.length > 0;

  const runOnce = async () => {
    let alerts: AnnouncementAlert[] = [];
    const seeds: Array<{ address: string; chain: Chain }> = [];
    const announcements = new Map<string, AnnouncementContext>();

    if (announceEnabled && annProviders) {
      alerts = await watchAnnouncements({
        providers: annProviders,
        watchlist,
        seen,
        config,
        extraTweets,
        onProgress: args.flags.verbose ? (m) => process.stderr.write(`  ${m}\n`) : undefined,
      });
      for (const s of alertsToSeeds(alerts)) {
        memory.remember({ ...s, at: Date.now() });
      }
      if (!args.flags.json && command !== 'announce') {
        process.stdout.write(`${renderAnnouncements(alerts)}\n`);
      }
    }

    if (command === 'announce') {
      if (args.flags.json) process.stdout.write(`${JSON.stringify(alerts, null, 2)}\n`);
      else process.stdout.write(`${renderAnnouncements(alerts)}\n`);
      await Promise.all([seen.save(), memory.save()]);
      return;
    }

    // Les annonces des passes précédentes comptent encore, avec une force
    // décroissante : une annonce n'est traitée qu'une fois, ses effets durent.
    const now = Date.now();
    for (const item of memory.active(now)) {
      seeds.push({ address: item.address, chain: item.chain });
      announcements.set(item.address, { strength: item.decayed, label: item.label });
    }
    memory.prune(now);

    const result = await scan({
      providers,
      store,
      config,
      kolIds,
      seeds,
      announcements,
      maxCandidates: args.flags.max ? Number(args.flags.max) : 25,
      onProgress: args.flags.verbose ? (m) => process.stderr.write(`  ${m}\n`) : undefined,
    });
    await Promise.all([store.save(), seen.save(), memory.save()]);

    if (args.flags.json) {
      process.stdout.write(`${JSON.stringify({ announcements: alerts, scan: result }, null, 2)}\n`);
    } else {
      process.stdout.write(`${renderConsole(result, { verbose: Boolean(args.flags.verbose) })}\n`);
    }
    if (args.flags.html) await writeFile(String(args.flags.html), renderHtml(result), 'utf8');
  };

  if (command === 'watch') {
    const interval = Number(args.flags.interval ?? 300) * 1000;
    let stop = false;
    process.on('SIGINT', () => {
      stop = true;
      process.stderr.write('\nArrêt demandé, fin de la passe en cours...\n');
    });
    while (!stop) {
      await runOnce();
      if (stop) break;
      await new Promise((r) => setTimeout(r, interval));
    }
    return 0;
  }

  if (command !== 'scan' && command !== 'announce') {
    process.stderr.write(`Commande inconnue : ${command}\n${USAGE}\n`);
    return 1;
  }

  await runOnce();
  return 0;
};

const resolveCommand = async (path: string, token?: string): Promise<number> => {
  if (!token) {
    process.stderr.write('X_BEARER_TOKEN requis pour résoudre les identifiants.\n');
    return 1;
  }
  const accounts = await loadWatchlist(path);
  if (accounts.length === 0) {
    process.stderr.write(`Watchlist vide ou introuvable : ${path}\n`);
    return 1;
  }
  const resolved = await resolveWatchlist(new XClient({ bearerToken: token }), accounts);
  await saveWatchlist(path, resolved);
  for (const a of resolved) {
    process.stdout.write(`${a.id ? a.id : 'NON RESOLU'.padEnd(12)}  @${a.username} (${a.tier})\n`);
  }
  return 0;
};

type Args = { _: string[]; flags: Record<string, string | boolean> };

export const parseArgs = (argv: string[]): Args => {
  const out: Args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      out._.push(a);
      continue;
    }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out.flags[key] = next;
      i++;
    } else {
      out.flags[key] = true;
    }
  }
  return out;
};

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err) => {
    process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
    process.exit(1);
  });
