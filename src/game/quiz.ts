import { ALL_CARDS, type Card } from '../data/cards';
import { isScript } from '../data/kana';
import { mnemonicFor } from '../data/mnemonics';
import type { CardStat, QuizMode } from './state';

/** The direction of a single question; "mixed" mode picks one per question. */
export type Direction = Exclude<QuizMode, 'mixed'>;

export interface Question {
  target: Card;
  /** Four shuffled options, one of which is the target. */
  choices: Card[];
  direction: Direction;
  /** First time this card comes up: show it before asking. */
  isNew: boolean;
}

export type Rng = () => number;

const CHOICES = 4;
/** New cards wait while this many cards in play are still shaky. */
export const MAX_SHAKY = 3;
/** Right answers after which a card is no longer shaky. */
const SETTLED = 2;
/** Right answers after which look-alikes start showing up as wrong choices. */
export const LOOK_ALIKE_AFTER = 3;
const MAX_LOOK_ALIKES = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Weight for picking a card as the next target: unseen and often-missed cards
 * come up more, and cards not seen for a while slowly rise back up. A card
 * missed last time counts double until it's answered right, so it comes back soon.
 */
export function weightFor(stat: CardStat | undefined, now: number): number {
  if (!stat) return 3;
  const total = stat.right + stat.wrong;
  const missRate = (stat.wrong + 1) / (total + 2);
  const staleness = Math.min((now - stat.lastSeen) / DAY_MS, 1);
  return (0.5 + missRate * 4 + staleness) * (stat.lastWrong ? 2 : 1);
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
  pool: Card[],
  stats: Record<string, CardStat>,
  previousId: string | null,
  mode: QuizMode = 'pick-kana',
  rng: Rng = Math.random,
  now: number = Date.now(),
): Question {
  if (pool.length === 0) throw new Error('Cannot build a question from an empty pool');

  const candidates = pool.length > 1 ? pool.filter((k) => k.id !== previousId) : pool;
  // New cards come in one at a time, in lesson order, and only while few cards are still shaky.
  const seen = candidates.filter((k) => stats[k.id]);
  const unseen = candidates.filter((k) => !stats[k.id]);
  const shaky = pool.filter((k) => {
    const s = stats[k.id];
    return s && (s.right < SETTLED || s.lastWrong);
  }).length;
  const isNew = unseen.length > 0 && (shaky < MAX_SHAKY || seen.length === 0);
  const target = isNew
    ? unseen[0]!
    : pickWeighted(
        seen,
        seen.map((k) => weightFor(stats[k.id], now)),
        rng,
      );

  // Distractors: same deck, unique answers and kana (so ぢ/じ and づ/ず never clash),
  // taken from the pool first and topped up from the full deck if needed.
  // Unique on both sides keeps either direction to exactly one right answer.
  // Once a card is known, a couple of look-alikes make the question harder.
  const sameDeck = (c: Card) => c.deck === target.deck;
  const answers = new Set([target.answer]);
  const kana = new Set([target.kana]);
  const distractors: Card[] = [];
  const known = (stats[target.id]?.right ?? 0) >= LOOK_ALIKE_AFTER;
  const similar = known ? shuffle(lookAlikes(target), rng).slice(0, MAX_LOOK_ALIKES) : [];
  for (const c of [...similar, ...shuffle(pool.filter(sameDeck), rng), ...shuffle(ALL_CARDS.filter(sameDeck), rng)]) {
    if (distractors.length >= CHOICES - 1) break;
    if (answers.has(c.answer) || kana.has(c.kana)) continue;
    answers.add(c.answer);
    kana.add(c.kana);
    distractors.push(c);
  }

  const direction = mode === 'mixed' ? (rng() < 0.5 ? 'pick-kana' : 'pick-romaji') : mode;
  return { target, choices: shuffle([target, ...distractors], rng), direction, isNew };
}

/** Cards easy to mix up with `card`: the kana look-alikes from Learn mode, or the rest of its row. */
export function lookAlikes(card: Card): Card[] {
  if (isScript(card.deck)) {
    const confuse = new Set(mnemonicFor(card).confuse);
    return ALL_CARDS.filter((c) => c.deck === card.deck && confuse.has(c.kana));
  }
  return ALL_CARDS.filter((c) => c.deck === card.deck && c.group === card.group && c.id !== card.id);
}
