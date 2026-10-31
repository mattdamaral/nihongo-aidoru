import { countRows } from '../data/cards';
import { TOOLS, type Tool } from '../data/tools';
import { BASE_STREAK_CAP, BASE_STREAK_STEP, rowBonus, type RewardMods } from './scoring';
import { activeGroups, type GameState } from './state';

/** Owning this many of a passive tool doubles its output (each milestone stacks). */
export const MILESTONES = [25, 50, 100];
/** Gaps between ticks longer than this count as time away (closed, hidden, asleep). */
export const AWAY_THRESHOLD_S = 5;
export const AWAY_EFFICIENCY = 0.5;
export const AWAY_CAP_S = 24 * 60 * 60;

export interface Payout {
  toolId: string;
  amount: number;
}

export interface AwayReport {
  seconds: number;
  /** Seconds that actually earned (capped). */
  countedSeconds: number;
  gained: number;
}

export const owned = (state: GameState, tool: Tool) => state.tools[tool.id] ?? 0;

export function toolCost(tool: Tool, count: number): number {
  return Math.ceil(tool.baseCost * tool.growth ** count);
}

export const nextCost = (state: GameState, tool: Tool) => toolCost(tool, owned(state, tool));

export function milestoneMult(count: number): number {
  return 2 ** MILESTONES.filter((m) => count >= m).length;
}

export function nextMilestone(count: number): number | null {
  return MILESTONES.find((m) => count < m) ?? null;
}

/** Sushi a passive tool type pays per cycle with `count` owned. */
export function payout(tool: Tool, count: number): number {
  return tool.effect.kind === 'passive' ? tool.effect.amount * count * milestoneMult(count) : 0;
}

/** Total idle sushi per second. */
export function passiveRate(state: GameState): number {
  let rate = 0;
  for (const tool of TOOLS) {
    if (tool.effect.kind === 'passive') rate += payout(tool, owned(state, tool)) / tool.effect.interval;
  }
  return rate;
}

/** Answer and streak modifiers from owned tools and selected rows, for `rewardFor`. */
export function rewardMods(state: GameState): RewardMods {
  const mods = {
    answerBonus: 0,
    streakStep: BASE_STREAK_STEP,
    streakCap: BASE_STREAK_CAP,
    rowMult: rowBonus(countRows(activeGroups(state))),
  };
  for (const tool of TOOLS) {
    const n = owned(state, tool);
    if (tool.effect.kind === 'answer') mods.answerBonus += tool.effect.amount * n;
    if (tool.effect.kind === 'streak') {
      mods.streakStep += tool.effect.step * n;
      mods.streakCap += tool.effect.cap * n;
    }
  }
  return mods;
}

/** Buys one of `tool` if affordable. */
export function buy(state: GameState, tool: Tool): boolean {
  const cost = nextCost(state, tool);
  if (state.sushi < cost) return false;
  state.sushi -= cost;
  state.tools[tool.id] = owned(state, tool) + 1;
  return true;
}

function earn(state: GameState, amount: number): void {
  state.sushi += amount;
  state.totalEarned += amount;
}

/** Runs every passive tool's production cycle forward by `seconds`. */
export function advance(state: GameState, seconds: number): Payout[] {
  const payouts: Payout[] = [];
  for (const tool of TOOLS) {
    const n = owned(state, tool);
    if (tool.effect.kind !== 'passive' || n === 0) continue;
    const progress = (state.toolProgress[tool.id] ?? 0) + seconds;
    const cycles = Math.floor(progress / tool.effect.interval);
    state.toolProgress[tool.id] = progress - cycles * tool.effect.interval;
    if (cycles > 0) {
      const amount = cycles * payout(tool, n);
      earn(state, amount);
      payouts.push({ toolId: tool.id, amount });
    }
  }
  return payouts;
}

/**
 * Brings the economy up to `now`. Short gaps are normal play and run the tool
 * cycles at full speed; long gaps are time away, paid at a reduced, capped rate.
 */
export function catchUp(state: GameState, now: number): { payouts: Payout[]; away: AwayReport | null } {
  const seconds = (now - state.lastTick) / 1000;
  state.lastTick = now;
  if (seconds <= 0) return { payouts: [], away: null };
  if (seconds <= AWAY_THRESHOLD_S) return { payouts: advance(state, seconds), away: null };

  const countedSeconds = Math.min(seconds, AWAY_CAP_S);
  const gained = passiveRate(state) * countedSeconds * AWAY_EFFICIENCY;
  earn(state, gained);
  return { payouts: [], away: { seconds, countedSeconds, gained } };
}
