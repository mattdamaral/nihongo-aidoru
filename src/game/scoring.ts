import { deckFor } from '../data/decks';
import type { Kana } from '../data/kana';

const BASE_REWARD = 1;
const STREAK_STEP = 5;
export const BASE_STREAK_STEP = 0.1;
export const BASE_STREAK_CAP = 2;

export interface RewardMods {
  /** Added to the base reward before multipliers. */
  answerBonus: number;
  /** Bonus added per STREAK_STEP correct answers in a row. */
  streakStep: number;
  /** Maximum streak multiplier. */
  streakCap: number;
}

export const NO_MODS: RewardMods = { answerBonus: 0, streakStep: BASE_STREAK_STEP, streakCap: BASE_STREAK_CAP };

/** +10% for every 5 correct answers in a row, capped at ×2 (tools raise both). */
export function streakBonus(streak: number, step = BASE_STREAK_STEP, cap = BASE_STREAK_CAP): number {
  return Math.min(1 + step * Math.floor(streak / STREAK_STEP), cap);
}

/** Sushi earned for answering `kana` correctly with `streak` already including this answer. */
export function rewardFor(kana: Kana, streak: number, mods: RewardMods = NO_MODS): number {
  return (
    (BASE_REWARD + mods.answerBonus) *
    deckFor(kana.script).multiplier *
    streakBonus(streak, mods.streakStep, mods.streakCap)
  );
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
