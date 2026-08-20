import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Chain, HistoryPoint } from './types.ts';
import { decay } from './util/math.ts';

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

/**
 * Mémoire des annonces déjà traitées.
 *
 * Sans elle, chaque passe réalerte sur le même tweet : le scanner devient
 * inutilisable au bout de quelques minutes, et on finit par ignorer ses alertes
 * — ce qui est le pire résultat possible pour un détecteur.
 */
export class SeenStore {
  private readonly seen = new Map<string, number>();
  private readonly path: string;
  private readonly retentionMs: number;

  constructor(path: string, retentionMs = 7 * 24 * 60 * 60 * 1000) {
    this.path = path;
    this.retentionMs = retentionMs;
  }

  async load(): Promise<void> {
    try {
      const raw = await readFile(this.path, 'utf8');
      for (const [k, v] of Object.entries(JSON.parse(raw) as Record<string, number>)) {
        this.seen.set(k, v);
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }

  async save(): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, JSON.stringify(Object.fromEntries(this.seen)), 'utf8');
  }

  has(id: string): boolean {
    return this.seen.has(id);
  }

  mark(id: string, at: number): void {
    this.seen.set(id, at);
  }

  prune(now: number): void {
    for (const [id, at] of this.seen) {
      if (at < now - this.retentionMs) this.seen.delete(id);
    }
  }

  get size(): number {
    return this.seen.size;
  }
}

export type RememberedAnnouncement = {
  address: string;
  chain: Chain;
  /** Force au moment de l'annonce, avant décroissance. */
  strength: number;
  label: string;
  at: number;
};

/**
 * Mémoire des annonces rattachées à un token.
 *
 * Nécessaire à cause de `SeenStore` : une annonce n'est traitée qu'une fois,
 * donc sans mémoire le bonus disparaîtrait dès la passe suivante et le token
 * retomberait au niveau de n'importe quel inconnu — alors que l'annonce, elle,
 * continue de produire ses effets pendant des heures.
 *
 * La force décroît par demi-vie : une annonce d'il y a deux heures compte
 * encore, mais beaucoup moins que celle d'il y a dix minutes.
 */
export class AnnouncementMemory {
  private readonly items = new Map<string, RememberedAnnouncement>();
  private readonly path: string;
  private readonly ttlMs: number;
  private readonly halfLifeMs: number;

  constructor(path: string, ttlMs = 6 * 60 * 60 * 1000, halfLifeMs = 60 * 60 * 1000) {
    this.path = path;
    this.ttlMs = ttlMs;
    this.halfLifeMs = halfLifeMs;
  }

  async load(): Promise<void> {
    try {
      const raw = await readFile(this.path, 'utf8');
      for (const item of JSON.parse(raw) as RememberedAnnouncement[]) {
        this.items.set(item.address, item);
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }

  async save(): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, JSON.stringify([...this.items.values()]), 'utf8');
  }

  /** Ne conserve que l'annonce la plus forte pour une adresse donnée. */
  remember(item: RememberedAnnouncement): void {
    const existing = this.items.get(item.address);
    if (existing && existing.strength >= item.strength && existing.at >= item.at) return;
    this.items.set(item.address, item);
  }

  /** Annonces encore actives, avec leur force décroissante appliquée. */
  active(now: number): Array<RememberedAnnouncement & { decayed: number }> {
    const out: Array<RememberedAnnouncement & { decayed: number }> = [];
    for (const item of this.items.values()) {
      const age = now - item.at;
      if (age > this.ttlMs) continue;
      out.push({ ...item, decayed: item.strength * decay(age, this.halfLifeMs) });
    }
    return out;
  }

  prune(now: number): void {
    for (const [addr, item] of this.items) {
      if (now - item.at > this.ttlMs) this.items.delete(addr);
    }
  }
}
