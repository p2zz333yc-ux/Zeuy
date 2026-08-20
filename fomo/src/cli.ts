#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { mergeConfig } from './config.ts';
import { scan } from './pipeline.ts';
import { buildFixtureProviders, buildLiveProviders } from './providers.ts';
import { renderConsole, renderHtml } from './report.ts';
import { HistoryStore } from './store.ts';
import type { Providers } from './pipeline.ts';

const USAGE = `
Scanner FOMO — détection d'allumage de memecoins (signal social X + confirmation on-chain)

  scan                     une passe unique
  watch                    passes répétées jusqu'à interruption

Options
  --demo                   utilise les scénarios synthétiques (aucune clé requise)
  --interval <secondes>    intervalle de watch (défaut : 300)
  --config <fichier.json>  surcharge des seuils
  --store <fichier.json>   historique persisté (défaut : .fomo-history.json)
  --html <fichier.html>    écrit aussi un rapport HTML
  --max <n>                nombre de candidats enrichis par passe (défaut : 25)
  --verbose                détaille chaque signal
  --json                   sort le résultat brut en JSON

Variables d'environnement
  X_BEARER_TOKEN           jeton d'application X API v2 (palier Basic minimum)
  FOMO_KOL_IDS             identifiants X des comptes d'influence, séparés par des virgules
  FOMO_WATCH_ACCOUNTS      pseudonymes X à surveiller pour la découverte
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
  const store = new HistoryStore(String(args.flags.store ?? '.fomo-history.json'), config.lookbackMs);
  await store.load();

  const kolIds = new Set(
    (process.env.FOMO_KOL_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  );

  let providers: Providers;
  if (args.flags.demo) {
    const { demoFixture } = await import('../fixtures/demo.ts');
    const fixture = demoFixture(Date.now());
    for (const t of fixture.tokens) for (const id of t.kolIds ?? []) kolIds.add(id);
    providers = buildFixtureProviders(fixture);
  } else {
    if (!process.env.X_BEARER_TOKEN) {
      process.stderr.write(
        'X_BEARER_TOKEN absent : le bloc social sera vide et les scores inexploitables.\n' +
          'Utilisez --demo pour voir le moteur tourner sur des scénarios synthétiques.\n',
      );
    }
    providers = buildLiveProviders({
      config,
      xBearerToken: process.env.X_BEARER_TOKEN,
      watchedAccounts: (process.env.FOMO_WATCH_ACCOUNTS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    });
  }

  const runOnce = async () => {
    const result = await scan({
      providers,
      store,
      config,
      kolIds,
      maxCandidates: args.flags.max ? Number(args.flags.max) : 25,
      onProgress: args.flags.verbose ? (m) => process.stderr.write(`  ${m}\n`) : undefined,
    });
    await store.save();

    if (args.flags.json) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } else {
      process.stdout.write(`${renderConsole(result, { verbose: Boolean(args.flags.verbose) })}\n`);
    }
    if (args.flags.html) await writeFile(String(args.flags.html), renderHtml(result), 'utf8');
    return result;
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

  if (command !== 'scan') {
    process.stderr.write(`Commande inconnue : ${command}\n${USAGE}\n`);
    return 1;
  }

  await runOnce();
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
