import { usd } from './features/onchain.ts';
import { phaseAdvice } from './phase.ts';
import type { Evaluation, Phase } from './types.ts';
import type { AnnouncementAlert, AnnouncementStatus } from './announcements.ts';
import type { ScanResult } from './pipeline.ts';

const PHASE_COLOR: Record<Phase, string> = {
  IGNITION: '\x1b[92m',
  BREAKOUT: '\x1b[96m',
  EUPHORIA: '\x1b[93m',
  DISTRIBUTION: '\x1b[91m',
  BOT_FARM: '\x1b[95m',
  INSIDER: '\x1b[94m',
  DORMANT: '\x1b[90m',
};
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

export const renderConsole = (result: ScanResult, opts: { verbose?: boolean } = {}): string => {
  const lines: string[] = [];
  lines.push(`${BOLD}Scan FOMO — ${new Date(result.scannedAt).toISOString()}${RESET}`);
  lines.push(
    `${result.evaluated.length} tokens évalués, ${result.alerts.length} alertes, ${result.skipped.length} écartés`,
  );
  lines.push('');

  if (result.evaluated.length === 0) {
    lines.push('Aucun candidat n’a passé la présélection.');
    return lines.join('\n');
  }

  lines.push(
    pad('SCORE', 7) + pad('CONF', 6) + pad('PHASE', 14) + pad('SYMBOLE', 12) + pad('FDV', 10) + 'BLOCS',
  );
  lines.push('-'.repeat(96));

  for (const e of result.evaluated) {
    const disqualified = e.vetoes.length > 0;
    const color = disqualified ? '\x1b[91m' : PHASE_COLOR[e.phase];
    lines.push(
      color +
        pad(e.fomo.toFixed(1), 7) +
        pad(`${Math.round(e.confidence * 100)}%`, 6) +
        // Un token disqualifié n'a pas de phase actionnable : afficher « BREAKOUT »
        // à côté d'un score nul serait le plus sûr moyen de se faire piéger.
        pad(disqualified ? 'DISQUALIFIE' : e.phase, 14) +
        pad(e.candidate.symbol.slice(0, 10), 12) +
        pad(fdvOf(e), 10) +
        blocks(e) +
        RESET,
    );
    if (e.vetoes.length > 0) lines.push(`       [VETO] ${e.vetoes.join(' · ')}`);
    if (opts.verbose) {
      for (const s of e.signals) {
        lines.push(`       ${bar(s.score)} ${pad(s.key, 26)} ${s.detail}`);
      }
      lines.push(`       -> ${phaseAdvice(e.phase)}`);
      lines.push('');
    }
  }

  if (result.alerts.length > 0) {
    lines.push('');
    lines.push(`${BOLD}Alertes${RESET}`);
    for (const a of result.alerts) {
      lines.push(`  * ${a.candidate.symbol} (${a.phase}, ${a.fomo}/100) — ${phaseAdvice(a.phase)}`);
      lines.push(`    ${a.candidate.chain}:${a.candidate.address}`);
    }
  }

  return lines.join('\n');
};

const blocks = (e: Evaluation): string =>
  `S${pct(e.blocks.social)} O${pct(e.blocks.onchain)} C${pct(e.blocks.coherence)} T${pct(e.blocks.timing)}`;

const pct = (x: number): string => String(Math.round(x * 100)).padStart(3, ' ');

const fdvOf = (e: Evaluation): string => {
  const s = e.signals.find((x) => x.key === 'onchain.headroom');
  return s ? usd(s.raw) : 'n/a';
};

const bar = (score: number): string => {
  const filled = Math.round(score * 10);
  return `[${'#'.repeat(filled)}${'.'.repeat(10 - filled)}]`;
};

const pad = (s: string, n: number): string => (s.length >= n ? `${s.slice(0, n - 1)} ` : s.padEnd(n));

/** Rapport HTML autonome, pratique pour relire une passe à froid. */
export const renderHtml = (result: ScanResult): string => {
  const rows = result.evaluated
    .map(
      (e) => `<tr class="${e.phase}">
      <td class="score">${e.fomo.toFixed(1)}</td>
      <td>${Math.round(e.confidence * 100)}%</td>
      <td><span class="phase">${e.phase}</span></td>
      <td><strong>${esc(e.candidate.symbol)}</strong><br><small>${esc(e.candidate.name)}</small></td>
      <td class="mono"><small>${esc(e.candidate.address)}</small></td>
      <td>${barHtml('Social', e.blocks.social)}${barHtml('On-chain', e.blocks.onchain)}${barHtml('Cohérence', e.blocks.coherence)}${barHtml('Timing', e.blocks.timing)}</td>
      <td><details><summary>${e.signals.length} signaux</summary><ul>${e.signals
        .map((s) => `<li><code>${esc(s.key)}</code> — ${esc(s.detail)} <b>${Math.round(s.score * 100)}</b></li>`)
        .join('')}${e.gates
        .map((g) => `<li class="gate">${esc(g.reason)} (x${g.multiplier.toFixed(2)})</li>`)
        .join('')}</ul></details></td>
    </tr>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>Scan FOMO — ${new Date(result.scannedAt).toISOString()}</title>
<style>
  :root { color-scheme: dark; }
  body { background:#0b0d12; color:#e6e9ef; font:14px/1.5 ui-sans-serif,system-ui,sans-serif; margin:0; padding:24px; }
  h1 { font-size:20px; margin:0 0 4px; }
  p.meta { color:#8b93a7; margin:0 0 20px; }
  table { border-collapse:collapse; width:100%; }
  th,td { padding:10px 12px; border-bottom:1px solid #1e2430; vertical-align:top; text-align:left; }
  th { color:#8b93a7; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.05em; }
  .score { font-size:18px; font-weight:700; }
  .mono { font-family:ui-monospace,monospace; word-break:break-all; max-width:220px; }
  .phase { font-size:11px; padding:2px 8px; border-radius:999px; background:#1e2430; }
  tr.IGNITION .phase { background:#0f3d2a; color:#4ade80; }
  tr.BREAKOUT .phase { background:#0e3446; color:#38bdf8; }
  tr.EUPHORIA .phase { background:#42350e; color:#fbbf24; }
  tr.DISTRIBUTION .phase, tr.BOT_FARM .phase { background:#42151a; color:#f87171; }
  .b { display:flex; align-items:center; gap:6px; font-size:11px; color:#8b93a7; }
  .b i { display:block; height:6px; border-radius:3px; background:#38bdf8; }
  .b span { width:64px; }
  .b u { display:block; width:80px; height:6px; border-radius:3px; background:#1e2430; }
  ul { margin:8px 0 0; padding-left:18px; color:#b6bccb; }
  li.gate { color:#f87171; }
  code { color:#93c5fd; }
</style></head>
<body>
<h1>Scan FOMO</h1>
<p class="meta">${new Date(result.scannedAt).toISOString()} — ${result.evaluated.length} tokens évalués, ${result.alerts.length} alertes, ${result.skipped.length} écartés</p>
<table>
<thead><tr><th>Score</th><th>Conf.</th><th>Phase</th><th>Token</th><th>Adresse</th><th>Blocs</th><th>Détail</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</body></html>`;
};

const barHtml = (label: string, v: number): string =>
  `<div class="b"><span>${label}</span><u><i style="width:${Math.round(v * 80)}px"></i></u>${Math.round(v * 100)}</div>`;

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const STATUS_COLOR: Record<AnnouncementStatus, string> = {
  TOKEN_CONFIRME: '\x1b[92m',
  TOKEN_A_VERIFIER: '\x1b[93m',
  CLONES_MULTIPLES: '\x1b[91m',
  PAS_ENCORE_DE_TOKEN: '\x1b[96m',
  IGNOREE: '\x1b[90m',
};

/** Rendu de la piste « annonces ». */
export const renderAnnouncements = (alerts: AnnouncementAlert[]): string => {
  if (alerts.length === 0) return 'Aucune annonce détectée sur la fenêtre.';

  const lines: string[] = [`${BOLD}Annonces détectées (${alerts.length})${RESET}`, ''];

  for (const a of alerts) {
    const { announcement: ann } = a;
    lines.push(
      `${STATUS_COLOR[a.status]}${BOLD}[${a.status}]${RESET} ${ann.kind} — @${ann.author.username} ` +
        `(force ${Math.round(ann.strength * 100)}/100, ${Math.round((Date.now() - ann.tweet.createdAt) / 60_000)} min)`,
    );
    lines.push(`  "${ann.tweet.text.replace(/\s+/g, ' ').slice(0, 160)}"`);

    if (ann.tickers.length > 0) lines.push(`  tickers : ${ann.tickers.map((t) => `$${t}`).join(', ')}`);

    for (const w of ann.warnings) {
      lines.push(`  ${w.fatal ? '[BLOQUANT]' : '[PRUDENCE]'} ${w.message}`);
    }

    for (const m of a.matches) {
      lines.push(
        `  -> ${m.market.symbol} ${m.market.chain}:${m.market.address}` +
          ` (${Math.round(m.confidence * 100)}% · ${m.trust})`,
      );
      lines.push(`     liquidité ${usd(m.market.liquidityUsd)}, FDV ${usd(m.market.fdvUsd)}`);
      for (const r of m.reasons) lines.push(`     - ${r}`);
    }

    lines.push(`  => ${a.advice}`);
    lines.push('');
  }

  return lines.join('\n');
};
