import { describe, expect, it } from 'vitest';
import { ALL_KANA } from '../src/data/kana';
import { TOOLS } from '../src/data/tools';
import {
  advance,
  AWAY_CAP_S,
  buy,
  catchUp,
  milestoneMult,
  nextCost,
  passiveRate,
  rewardMods,
  toolCost,
} from '../src/game/economy';
import { rewardFor } from '../src/game/scoring';
import { defaultState } from '../src/game/state';

const tool = (id: string) => TOOLS.find((t) => t.id === id)!;
const shamoji = tool('shamoji'); // +1 every 10s
const KA = ALL_KANA.find((k) => k.id === 'hiragana:か')!;

describe('tool prices', () => {
  it('rise by the growth factor per tool owned', () => {
    expect(toolCost(shamoji, 0)).toBe(shamoji.baseCost);
    for (let n = 1; n < 30; n++) {
      expect(toolCost(shamoji, n)).toBeGreaterThan(toolCost(shamoji, n - 1));
      expect(toolCost(shamoji, n)).toBe(Math.ceil(shamoji.baseCost * shamoji.growth ** n));
    }
  });

  it('buys only when affordable', () => {
    const state = defaultState();
    state.sushi = shamoji.baseCost - 0.01;
    expect(buy(state, shamoji)).toBe(false);
    state.sushi = shamoji.baseCost;
    expect(buy(state, shamoji)).toBe(true);
    expect(state.sushi).toBe(0);
    expect(state.tools.shamoji).toBe(1);
    expect(nextCost(state, shamoji)).toBe(toolCost(shamoji, 1));
  });
});

describe('production', () => {
  it('doubles at each milestone', () => {
    expect(milestoneMult(24)).toBe(1);
    expect(milestoneMult(25)).toBe(2);
    expect(milestoneMult(50)).toBe(4);
    expect(milestoneMult(100)).toBe(8);
  });

  it('pays whole cycles and carries the remainder', () => {
    const state = defaultState();
    state.tools = { shamoji: 3 };
    expect(advance(state, 9.5)).toEqual([]);
    expect(advance(state, 0.5)).toEqual([{ toolId: 'shamoji', amount: 3 }]);
    expect(advance(state, 25)).toEqual([{ toolId: 'shamoji', amount: 6 }]);
    expect(state.toolProgress.shamoji).toBeCloseTo(5);
    expect(state.sushi).toBe(9);
    expect(state.totalEarned).toBe(9);
  });

  it('sums the idle rate across tools', () => {
    const state = defaultState();
    state.tools = { shamoji: 2, hangiri: 1 };
    expect(passiveRate(state)).toBeCloseTo(2 / 10 + 40 / 30);
  });
});

describe('time away', () => {
  const start = 1_000_000;

  it('runs short gaps at full speed', () => {
    const state = defaultState(start);
    state.tools = { shamoji: 1 };
    state.toolProgress = { shamoji: 8 };
    const { payouts, away } = catchUp(state, start + 3_000);
    expect(away).toBeNull();
    expect(payouts).toEqual([{ toolId: 'shamoji', amount: 1 }]);
  });

  it('pays long gaps at half speed', () => {
    const state = defaultState(start);
    state.tools = { hangiri: 3 };
    const { away } = catchUp(state, start + 2 * 3600_000);
    const expected = passiveRate(state) * 7200 * 0.5;
    expect(away?.gained).toBeCloseTo(expected);
    expect(state.sushi).toBeCloseTo(expected);
    expect(state.lastTick).toBe(start + 2 * 3600_000);
  });

  it('caps time away at 24h', () => {
    const state = defaultState(start);
    state.tools = { shamoji: 10 };
    const { away } = catchUp(state, start + 3 * AWAY_CAP_S * 1000);
    expect(away?.countedSeconds).toBe(AWAY_CAP_S);
    expect(away?.gained).toBeCloseTo(passiveRate(state) * AWAY_CAP_S * 0.5);
  });

  it('ignores clocks that go backwards', () => {
    const state = defaultState(start);
    state.tools = { shamoji: 10 };
    expect(catchUp(state, start - 60_000)).toEqual({ payouts: [], away: null });
    expect(state.sushi).toBe(0);
  });
});

describe('answer and streak modifiers', () => {
  /** One row selected, so the row bonus stays ×1. */
  const oneRow = () => ({ ...defaultState(), enabledGroups: ['hiragana:ka'] });

  it('knives add base sushi before multipliers', () => {
    const state = oneRow();
    state.tools = { yanagiba: 2 };
    expect(rewardFor(KA, 1, rewardMods(state))).toBe(3);
  });

  it('selected rows of the active lesson multiply the reward, ignoring other lessons and unknown keys', () => {
    const state = defaultState();
    expect(rewardMods(state).rowMult).toBeCloseTo(1.05);
    state.enabledGroups = ['hiragana:a', 'hiragana:ka', 'hiragana:sa', 'hiragana:ka', 'katakana:ta', 'hiragana:zz', 'kanji:one'];
    expect(rewardMods(state).rowMult).toBeCloseTo(1.1);
    expect(rewardFor(KA, 1, rewardMods(state))).toBeCloseTo(1.1);
  });

  it('fans grow the streak bonus and its cap', () => {
    const state = oneRow();
    expect(rewardFor(KA, 10, rewardMods(state))).toBeCloseTo(1.2);
    state.tools = { uchiwa: 1 };
    expect(rewardFor(KA, 10, rewardMods(state))).toBeCloseTo(1.4);
    // Base cap is ×2; one fan raises it to ×2.5.
    expect(rewardFor(KA, 500, rewardMods(state))).toBeCloseTo(2.5);
  });
});
