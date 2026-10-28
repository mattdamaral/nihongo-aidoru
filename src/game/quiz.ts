import { ALL_KANA, type Kana } from '../data/kana';
import type { KanaStat } from './state';

export interface Question {
  target: Kana;
  /** Four shuffled options, one of which is the target. */
  choices: Kana[];
}

export type Rng = () => number;

const CHOICES = 4;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Weight for picking a kana as the next target: unseen and often-missed kana
 * come up more, and kana not seen for a while slowly rise back up.
 */
export function weightFor(stat: KanaStat | undefined, now: number): number {
  if (!stat) return 3;
  const total = stat.right + stat.wrong;
  const missRate = (stat.wrong + 1) / (total + 2);
  const staleness = Math.min((now - stat.lastSeen) / DAY_MS, 1);
  return 0.5 + missRate * 4 + staleness;
}

function pickWeighted<T>(items: T[], weights: number[], rng: Rng): T {
  const sum = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * sum;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]!;
    if (roll < 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function nextQuestion(
  pool: Kana[],
  stats: Record<string, KanaStat>,
  previousId: string | null,
  rng: Rng = Math.random,
  now: number = Date.now(),
): Question {
  if (pool.length === 0) throw new Error('Cannot build a question from an empty pool');

  const candidates = pool.length > 1 ? pool.filter((k) => k.id !== previousId) : pool;
  const target = pickWeighted(
    candidates,
    candidates.map((k) => weightFor(stats[k.id], now)),
    rng,
  );

  // Distractors: same script, unique romaji (so ぢ/じ and づ/ず never clash),
  // taken from the pool first and topped up from the full script if needed.
  const sameScript = (k: Kana) => k.script === target.script;
  const taken = new Set([target.romaji]);
  const distractors: Kana[] = [];
  for (const k of [...shuffle(pool.filter(sameScript), rng), ...shuffle(ALL_KANA.filter(sameScript), rng)]) {
    if (distractors.length >= CHOICES - 1) break;
    if (taken.has(k.romaji)) continue;
    taken.add(k.romaji);
    distractors.push(k);
  }

  return { target, choices: shuffle([target, ...distractors], rng) };
}
