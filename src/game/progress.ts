import { ALL_CARDS, groupKey, type Card, type DeckId } from '../data/cards';
import { LESSONS } from '../data/lessons';
import { localDay, type GameState } from './state';

/** Correct answers needed per card to fill its share of the mastery bar. */
export const MASTERY_TARGET = 5;
/** A lesson opens at this share of the previous lesson's mastery points… */
export const UNLOCK_SHARE = 0.5;
/** …but never needs more than this many points, so big lessons don't take much longer. */
export const UNLOCK_CAP = 180;

const deckCards = (deck: DeckId) => ALL_CARDS.filter((c) => c.deck === deck);
const points = (state: GameState, cards: Card[]) =>
  cards.reduce((sum, c) => sum + Math.min(state.stats[c.id]?.right ?? 0, MASTERY_TARGET), 0);

/** Mastery of one row (group key), 0–1. */
export function mastery(state: GameState, key: string): number {
  const cards = ALL_CARDS.filter((c) => groupKey(c.deck, c.group) === key);
  return cards.length ? points(state, cards) / (cards.length * MASTERY_TARGET) : 0;
}

/** Mastery points in a lesson: correct answers, counting at most MASTERY_TARGET per card. */
export const deckPoints = (state: GameState, deck: DeckId) => points(state, deckCards(deck));
export const deckMaxPoints = (deck: DeckId) => deckCards(deck).length * MASTERY_TARGET;

/** Playable lessons in order; each one is unlocked by the one before it. */
const ORDER: DeckId[] = LESSONS.flatMap((l) => (l.status === 'ready' && l.deck ? [l.deck] : []));

export const previousDeck = (deck: DeckId): DeckId | null => ORDER[ORDER.indexOf(deck) - 1] ?? null;

/** Mastery points needed in `deck` to open the lesson after it. */
export const unlockNeed = (deck: DeckId) => Math.min(Math.ceil(deckMaxPoints(deck) * UNLOCK_SHARE), UNLOCK_CAP);

export const isUnlocked = (state: GameState, deck: DeckId) => previousDeck(deck) === null || state.unlocked.includes(deck);

/** Progress toward unlocking `deck`, or null if it has no lesson before it. */
export function unlockProgress(state: GameState, deck: DeckId): { from: DeckId; have: number; need: number } | null {
  const from = previousDeck(deck);
  return from ? { from, have: deckPoints(state, from), need: unlockNeed(from) } : null;
}

/** Opens every lesson whose previous lesson is mastered enough; returns the newly opened ones. */
export function checkUnlocks(state: GameState): DeckId[] {
  const opened: DeckId[] = [];
  for (const deck of ORDER) {
    const p = unlockProgress(state, deck);
    if (!p || isUnlocked(state, deck) || !isUnlocked(state, p.from) || p.have < p.need) continue;
    state.unlocked = ORDER.filter((d) => d === deck || state.unlocked.includes(d));
    opened.push(deck);
  }
  return opened;
}

/** The day before a "YYYY-MM-DD" day. */
export function dayBefore(day: string): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return localDay(new Date(y, m - 1, d - 1).getTime());
}

/** Starts a fresh daily count when the date has changed. */
export function rollDay(state: GameState, now: number): void {
  const today = localDay(now);
  if (state.daily.day !== today) state.daily = { ...state.daily, day: today, correct: 0 };
}

/** The day streak as it stands now: still alive if the goal was hit today or yesterday. */
export function currentDayStreak(state: GameState, now: number): number {
  const today = localDay(now);
  const { lastDay, count } = state.dayStreak;
  return lastDay === today || lastDay === dayBefore(today) ? count : 0;
}

export const goalDoneToday = (state: GameState, now: number) => state.dayStreak.lastDay === localDay(now);

/** Records the goal as hit if today's count reached it; returns true the moment that happens. */
export function checkDailyGoal(state: GameState, now: number): boolean {
  rollDay(state, now);
  if (state.daily.correct < state.daily.goal || goalDoneToday(state, now)) return false;
  const today = localDay(now);
  const s = state.dayStreak;
  const count = s.lastDay === dayBefore(today) ? s.count + 1 : 1;
  state.dayStreak = { count, best: Math.max(s.best, count), lastDay: today, goalsHit: s.goalsHit + 1 };
  return true;
}

/** Counts one correct answer toward today's goal; returns true if that hit the goal. */
export function countCorrect(state: GameState, now: number): boolean {
  rollDay(state, now);
  state.daily.correct++;
  return checkDailyGoal(state, now);
}
