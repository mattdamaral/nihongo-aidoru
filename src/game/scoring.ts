import { deckFor } from '../data/decks';
import type { Card, DeckId } from '../data/cards';

const BASE_REWARD = 1;
const STREAK_STEP = 5;
export const BASE_STREAK_STEP = 0.1;
export const BASE_STREAK_CAP = 2;
/** Extra multiplier per selected row beyond the first. */
export const ROW_BONUS = 0.05;

export interface RewardMods {
  /** Added to the base reward before multipliers. */
  answerBonus: number;
  /** Bonus added per STREAK_STEP correct answers in a row. */
  streakStep: number;
  /** Maximum streak multiplier. */
  streakCap: number;
  /** Multiplier for practicing many rows at once (see rowBonus). */
  rowMult: number;
  /** Answer multiplier from stamps. */
  stampMult?: number;
  /** Per-lesson multiplier from row and lesson stamps. */
  deckStampMult?: Partial<Record<DeckId, number>>;
}

export const NO_MODS: RewardMods = {
  answerBonus: 0,
  streakStep: BASE_STREAK_STEP,
  streakCap: BASE_STREAK_CAP,
  rowMult: 1,
};

/** +10% for every 5 correct answers in a row, capped at ×2 (tools raise both). */
export function streakBonus(streak: number, step = BASE_STREAK_STEP, cap = BASE_STREAK_CAP): number {
  return Math.min(1 + step * Math.floor(streak / STREAK_STEP), cap);
}

/** More rows means more possible answers: +5% per row after the first. */
export function rowBonus(rows: number): number {
  return 1 + ROW_BONUS * Math.max(rows - 1, 0);
}

/** Everything stamps add to an answer for `card`. */
const stampsFor = (card: Card, mods: RewardMods) => (mods.stampMult ?? 1) * (mods.deckStampMult?.[card.deck] ?? 1);

/** Sushi earned for answering `card` correctly with `streak` already including this answer. */
export function rewardFor(card: Card, streak: number, mods: RewardMods = NO_MODS): number {
  return (
    (BASE_REWARD + mods.answerBonus) *
    deckFor(card.deck).multiplier *
    mods.rowMult *
    streakBonus(streak, mods.streakStep, mods.streakCap) *
    stampsFor(card, mods)
  );
}

/** Explains a reward, e.g. "2 base × 1.5 katakana × 1.25 rows × 1.1 streak". */
export function rewardBreakdown(card: Card, streak: number, mods: RewardMods = NO_MODS): string {
  const n = (v: number) => String(Number(v.toFixed(2)));
  const deck = deckFor(card.deck);
  const stamps = stampsFor(card, mods);
  return [
    `${n(BASE_REWARD + mods.answerBonus)} base`,
    `${n(deck.multiplier)} ${deck.name.toLowerCase()}`,
    `${n(mods.rowMult)} rows`,
    `${n(streakBonus(streak, mods.streakStep, mods.streakCap))} streak`,
    ...(stamps === 1 ? [] : [`${n(stamps)} stamps`]),
  ].join(' × ');
}

const UNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];

/** Floors and shortens big numbers: 999 → "999", 1234 → "1.23K". */
export function formatSushi(n: number): string {
  const v = Math.floor(n);
  if (v < 1000) return String(v);
  let unit = 0;
  let scaled = v;
  while (scaled >= 1000 && unit < UNITS.length - 1) {
    scaled /= 1000;
    unit++;
  }
  const digits = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
  return `${(Math.floor(scaled * 10 ** digits) / 10 ** digits).toFixed(digits)}${UNITS[unit]}`;
}

/** Shows rewards like "+1", "+1.5", "+1.65". */
export function formatReward(n: number): string {
  return `+${Number(n.toFixed(2))}`;
}

/** Rates like "0.1", "2.4", "1.2K". */
export function formatRate(n: number): string {
  return n < 100 ? String(Number(n.toFixed(1))) : formatSushi(n);
}

/** Durations like "45s", "12m", "3h 12m". */
export function formatDuration(seconds: number): string {
  const s = Math.floor(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
}
