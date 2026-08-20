import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { HistoryPoint } from './types.ts';

/**
 * Historique par token, persisté sur disque.
 *
 * Sans historique, la moitié du moteur ne fonctionne pas : la vélocité, l'accélération
 * et l'avance du social sur le volume se calculent toutes par différence avec le passé.
 * C'est aussi pour ça qu'un scanner qui démarre à froid est aveugle pendant une heure.
 */
export class HistoryStore {
  private readonly data = new Map<string, HistoryPoint[]>();
  private readonly path: string;
  private readonly retentionMs: number;

  constructor(path: string, retentionMs = 24 * 60 * 60 * 1000) {
    this.path = path;
    this.retentionMs = retentionMs;
  }

  async load(): Promise<void> {
    try {
      const raw = await readFile(this.path, 'utf8');
      const parsed = JSON.parse(raw) as Record<string, HistoryPoint[]>;
      for (const [k, v] of Object.entries(parsed)) this.data.set(k, v);
    } catch (err) {
      // Premier démarrage : pas de fichier, ce n'est pas une erreur.
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }

  async save(): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, JSON.stringify(Object.fromEntries(this.data)), 'utf8');
  }

  get(address: string): HistoryPoint[] {
    return this.data.get(address) ?? [];
  }

  /** Ajoute un point et purge ce qui dépasse la fenêtre de rétention. */
  push(address: string, point: HistoryPoint): HistoryPoint[] {
    const cutoff = point.at - this.retentionMs;
    const next = [...this.get(address).filter((p) => p.at >= cutoff), point];
    this.data.set(address, next);
    return next;
  }

  /** Date de première observation d'un token, utilisée comme `firstSeenAt`. */
  firstSeen(address: string): number | null {
    const h = this.get(address);
    return h.length > 0 ? Math.min(...h.map((p) => p.at)) : null;
  }

  addresses(): string[] {
    return [...this.data.keys()];
  }

  /** Oublie les tokens dont on n'a plus aucun point récent. */
  prune(now: number): void {
    for (const [addr, points] of this.data) {
      const alive = points.filter((p) => p.at >= now - this.retentionMs);
      if (alive.length === 0) this.data.delete(addr);
      else this.data.set(addr, alive);
    }
  }
}
