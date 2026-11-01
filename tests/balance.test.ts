// Simulates a steady player to sanity-check the shop's progression curve.
// `npm run balance` prints the minute-by-minute timeline.
import { describe, expect, it } from 'vitest';
import { ALL_KANA } from '../src/data/kana';
import { TOOLS, type Tool } from '../src/data/tools';
import { advance, buy, nextCost, passiveRate, rewardMods } from '../src/game/economy';
import { rewardFor } from '../src/game/scoring';
import { defaultState, type GameState } from '../src/game/state';

const ANSWER_EVERY_S = 3;
/** Every 10th answer is wrong: 90% accuracy, streaks up to 9. */
const WRONG_EVERY = 10;
const KANA = ALL_KANA.find((k) => k.id === 'hiragana:か')!;

/** Average answer income per second for this player profile. */
function activeRate(state: GameState): number {
  const mods = rewardMods(state);
  let total = 0;
  for (let streak = 1; streak < WRONG_EVERY; streak++) total += rewardFor(KANA, streak, mods);
  return total / (WRONG_EVERY * ANSWER_EVERY_S);
}

const income = (s: GameState) => passiveRate(s) + activeRate(s);

/** Income gained per sushi spent on one more of `tool`. */
function value(state: GameState, tool: Tool): number {
  const next = { ...state, tools: { ...state.tools, [tool.id]: (state.tools[tool.id] ?? 0) + 1 } };
  return (income(next) - income(state)) / nextCost(state, tool);
}

interface Snapshot {
  minute: number;
  sushi: number;
  passive: number;
  active: number;
  tools: string;
}

function simulate(minutes: number) {
  const state = defaultState(0);
  const firstBuy: Record<string, number> = {};
  const timeline: Snapshot[] = [];
  let answers = 0;
  for (let t = 1; t <= minutes * 60; t++) {
    advance(state, 1);
    if (t % ANSWER_EVERY_S === 0) {
      answers++;
      // A miss halves the streak, as in the game.
      if (answers % WRONG_EVERY === 0) state.streak = Math.floor(state.streak / 2);
      else {
        state.streak++;
        const r = rewardFor(KANA, state.streak, rewardMods(state));
        state.sushi += r;
        state.totalEarned += r;
      }
    }
    // Greedy: save up for whichever tool adds the most income per sushi.
    for (;;) {
      const best = [...TOOLS].sort((a, b) => value(state, b) - value(state, a))[0]!;
      if (!buy(state, best)) break;
      firstBuy[best.id] ??= t / 60;
    }
    if (t % 60 === 0) {
      timeline.push({
        minute: t / 60,
        sushi: Math.floor(state.sushi),
        passive: passiveRate(state),
        active: activeRate(state),
        tools: TOOLS.map((tool) => `${tool.name.slice(0, 4)}:${state.tools[tool.id] ?? 0}`).join(' '),
      });
    }
  }
  return { firstBuy, timeline };
}

describe('shop balance', () => {
  const { firstBuy, timeline } = simulate(12 * 60);

  if ((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.npm_lifecycle_event === 'balance') {
    console.log('First purchase (minute):', Object.fromEntries(Object.entries(firstBuy).map(([k, v]) => [k, v.toFixed(1)])));
    console.table(
      timeline
        .filter((s) => (s.minute <= 10 ? true : s.minute <= 60 ? s.minute % 5 === 0 : s.minute % 60 === 0))
        .map((s) => ({ ...s, passive: s.passive.toFixed(2), active: s.active.toFixed(2) })),
    );
  }

  const at = (minute: number) => timeline.find((s) => s.minute === minute)!;

  it('lets a new player buy a first tool within about a minute', () => {
    expect(Math.min(...Object.values(firstBuy))).toBeLessThanOrEqual(1.5);
  });

  it('unlocks the first five tools within 45 minutes', () => {
    for (const tool of TOOLS.slice(0, 5)) expect(firstBuy[tool.id], tool.id).toBeLessThanOrEqual(45);
  });

  it('spreads the later tools over hours of play, keeping the chef as a long-term goal', () => {
    expect(firstBuy.noren).toBeLessThanOrEqual(90);
    expect(firstBuy.deba).toBeLessThanOrEqual(120);
    expect(firstBuy.chochin).toBeLessThanOrEqual(4 * 60);
    expect(firstBuy.kaiten).toBeLessThanOrEqual(8 * 60);
    // Active play alone doesn't reach the last tool on day one; idle time and stamps get there.
    expect(firstBuy.itamae).toBeUndefined();
  });

  it('keeps idle income in proportion to answering at 30 minutes', () => {
    const { passive, active } = at(30);
    expect(passive / active).toBeGreaterThan(0.5);
    expect(passive / active).toBeLessThan(4);
  });
});
