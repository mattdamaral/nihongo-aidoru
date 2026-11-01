import { DECK_IDS, groupKey, type DeckId } from '../data/cards';
import { DECKS, deckFor } from '../data/decks';
import { TOOLS } from '../data/tools';
import { deckMaxPoints, deckPoints, isUnlocked, mastery, previousDeck } from './progress';
import type { GameState } from './state';

/**
 * Hanko stamps: achievements that each give a small, lasting bonus. Most
 * families have endless tiers, and each family boosts something different.
 */
export type StampFamily = 'answers' | 'sushi' | 'streak' | 'row' | 'lesson' | 'tool' | 'goals' | 'days';

export interface Stamp {
  id: string;
  family: StampFamily;
  /** The character carved on the stamp. */
  seal: string;
  title: string;
  bonus: string;
}

export const ANSWER_BONUS = 0.03;
export const IDLE_BONUS = 0.03;
export const STREAK_CAP_BONUS = 0.05;
export const ROW_STAMP_BONUS = 0.02;
export const LESSON_STAMP_BONUS = 0.1;
export const TOOL_STAMP_BONUS = 0.05;
export const AWAY_BONUS = 0.02;
export const AWAY_MAX = 0.9;
export const DISCOUNT_STEP = 0.01;
export const DISCOUNT_MAX = 0.3;
/** Time-away speed before any stamps. */
export const BASE_AWAY = 0.5;

/** Tiers go on forever: listed values first, then `step` more each time. */
const tiers = (listed: number[], step: number) => (i: number) =>
  i < listed.length ? listed[i]! : listed[listed.length - 1]! + step * (i - listed.length + 1);

/** 50, 100, 250, 500, 1,000, 2,500, … */
const oneTwoFive = (i: number) => [1, 2.5, 5][(i + 2) % 3]! * 10 ** (Math.floor((i + 2) / 3) + 1);

interface Tiered {
  family: StampFamily;
  seal: string;
  threshold: (i: number) => number;
  value: (s: GameState) => number;
  title: (n: string) => string;
  bonus: string;
}

const fmt = (n: number) => n.toLocaleString('en-US');

const TIERED: Tiered[] = [
  {
    family: 'answers',
    seal: '答',
    threshold: oneTwoFive,
    value: (s) => Object.values(s.stats).reduce((sum, st) => sum + st.right, 0),
    title: (n) => `${n} correct answers`,
    bonus: `+${ANSWER_BONUS * 100}% answer sushi`,
  },
  {
    family: 'sushi',
    seal: '寿',
    threshold: (i) => 100 * 10 ** i,
    value: (s) => s.totalEarned,
    title: (n) => `${n} sushi made`,
    bonus: `+${IDLE_BONUS * 100}% kitchen sushi`,
  },
  {
    family: 'streak',
    seal: '連',
    threshold: tiers([10, 25, 50, 100], 100),
    value: (s) => s.bestStreak,
    title: (n) => `Streak of ${n}`,
    bonus: `+×${STREAK_CAP_BONUS} max streak bonus`,
  },
  {
    family: 'goals',
    seal: '的',
    threshold: tiers([1, 3, 7, 14, 30], 30),
    value: (s) => s.dayStreak.goalsHit,
    title: (n) => `Daily goal hit ${n === '1' ? 'once' : `${n} times`}`,
    bonus: `+${AWAY_BONUS * 100}% speed while away`,
  },
  {
    family: 'days',
    seal: '日',
    threshold: tiers([3, 7, 14, 30, 60, 100], 50),
    value: (s) => s.dayStreak.best,
    title: (n) => `${n}-day streak`,
    bonus: `−${DISCOUNT_STEP * 100}% kitchen prices`,
  },
];

const TOOL_TIERS = tiers([1, 10, 25, 50, 100], 50);

/** Tiers reached for a value: how many thresholds are at or below it. */
function tiersReached(threshold: (i: number) => number, value: number): number {
  let i = 0;
  while (threshold(i) <= value) i++;
  return i;
}

export function describeStamp(id: string): Stamp | null {
  const [family, a, b] = id.split(':') as [string, string?, string?];
  const tiered = TIERED.find((t) => t.family === family);
  if (tiered && a !== undefined) {
    return { id, family: tiered.family, seal: tiered.seal, title: tiered.title(fmt(tiered.threshold(Number(a)))), bonus: tiered.bonus };
  }
  if (family === 'tool' && a && b !== undefined) {
    const tool = TOOLS.find((t) => t.id === a);
    if (!tool) return null;
    return { id, family: 'tool', seal: '道', title: `${fmt(TOOL_TIERS(Number(b)))} × ${tool.name}`, bonus: `+${TOOL_STAMP_BONUS * 100}% ${tool.name} output` };
  }
  if (family === 'row' && a && b) {
    const deck = DECKS.find((d) => d.id === a);
    const group = deck?.groups.find((g) => g.id === b);
    if (!deck || !group) return null;
    const name = deck.id === 'hiragana' || deck.id === 'katakana' ? `${deck.name} ${group.label} row` : `${deck.name} ${group.label}`;
    return { id, family: 'row', seal: '覚', title: `Mastered ${name}`, bonus: `+${ROW_STAMP_BONUS * 100}% ${deck.name} sushi` };
  }
  if ((family === 'unlock' || family === 'mastered') && DECK_IDS.includes(a as DeckId)) {
    const deck = deckFor(a as DeckId);
    return {
      id,
      family: 'lesson',
      seal: family === 'unlock' ? '開' : '極',
      title: family === 'unlock' ? `Opened ${deck.name}` : `Mastered all of ${deck.name}`,
      bonus: `+${LESSON_STAMP_BONUS * 100}% ${deck.name} sushi`,
    };
  }
  return null;
}

/** Every stamp the player qualifies for right now (earned or not). */
function qualifying(state: GameState): string[] {
  const ids: string[] = [];
  for (const t of TIERED) {
    const n = tiersReached(t.threshold, t.value(state));
    for (let i = 0; i < n; i++) ids.push(`${t.family}:${i}`);
  }
  for (const tool of TOOLS) {
    const n = tiersReached(TOOL_TIERS, state.tools[tool.id] ?? 0);
    for (let i = 0; i < n; i++) ids.push(`tool:${tool.id}:${i}`);
  }
  for (const deck of DECKS) {
    for (const g of deck.groups) if (mastery(state, groupKey(deck.id, g.id)) >= 1) ids.push(`row:${deck.id}:${g.id}`);
    if (previousDeck(deck.id) && isUnlocked(state, deck.id)) ids.push(`unlock:${deck.id}`);
    if (deckPoints(state, deck.id) >= deckMaxPoints(deck.id)) ids.push(`mastered:${deck.id}`);
  }
  return ids;
}

/** Awards any newly earned stamps and returns them. */
export function checkStamps(state: GameState, now: number): Stamp[] {
  const earned: Stamp[] = [];
  for (const id of qualifying(state)) {
    if (state.stamps[id] !== undefined) continue;
    state.stamps[id] = now;
    const stamp = describeStamp(id);
    if (stamp) earned.push(stamp);
  }
  return earned;
}

/** The next stamp of each endless family, for the Stamps sheet's progress bars. */
export function nextStamps(state: GameState): { seal: string; title: string; bonus: string; have: number; need: number }[] {
  const out = TIERED.map((t) => {
    const value = t.value(state);
    const need = t.threshold(tiersReached(t.threshold, value));
    return { seal: t.seal, title: t.title(fmt(need)), bonus: t.bonus, have: value, need };
  });
  for (const tool of TOOLS) {
    const have = state.tools[tool.id] ?? 0;
    if (have === 0) continue;
    const need = TOOL_TIERS(tiersReached(TOOL_TIERS, have));
    out.push({ seal: '道', title: `${fmt(need)} × ${tool.name}`, bonus: `+${TOOL_STAMP_BONUS * 100}% ${tool.name} output`, have, need });
  }
  return out;
}

export interface StampBonuses {
  /** Multiplies answer rewards. */
  answer: number;
  /** Multiplies every kitchen tool's output. */
  idle: number;
  /** Added to the maximum streak multiplier. */
  streakCap: number;
  /** Per-lesson answer multiplier. */
  deck: Record<DeckId, number>;
  /** Per-tool output multiplier. */
  tool: Record<string, number>;
  /** Share of idle speed paid while away. */
  away: number;
  /** Share taken off kitchen prices. */
  discount: number;
}

export function stampBonuses(state: GameState): StampBonuses {
  const n: Record<string, number> = {};
  const deck = Object.fromEntries(DECK_IDS.map((d) => [d, 1])) as Record<DeckId, number>;
  const tool: Record<string, number> = {};
  for (const id of Object.keys(state.stamps)) {
    const [family, a] = id.split(':') as [string, string?];
    n[family] = (n[family] ?? 0) + 1;
    if (family === 'row' && a && a in deck) deck[a as DeckId] += ROW_STAMP_BONUS;
    if ((family === 'unlock' || family === 'mastered') && a && a in deck) deck[a as DeckId] += LESSON_STAMP_BONUS;
    if (family === 'tool' && a) tool[a] = (tool[a] ?? 1) + TOOL_STAMP_BONUS;
  }
  return {
    answer: 1 + ANSWER_BONUS * (n.answers ?? 0),
    idle: 1 + IDLE_BONUS * (n.sushi ?? 0),
    streakCap: STREAK_CAP_BONUS * (n.streak ?? 0),
    deck,
    tool,
    away: Math.min(BASE_AWAY + AWAY_BONUS * (n.goals ?? 0), AWAY_MAX),
    discount: Math.min(DISCOUNT_STEP * (n.days ?? 0), DISCOUNT_MAX),
  };
}

export const FAMILY_NAMES: Record<StampFamily, string> = {
  answers: 'Answers',
  sushi: 'Sushi made',
  streak: 'Streaks',
  row: 'Rows mastered',
  lesson: 'Lessons',
  tool: 'Kitchen',
  goals: 'Daily goals',
  days: 'Day streaks',
};
