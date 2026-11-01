import { describe, expect, it } from 'vitest';
import { ALL_CARDS } from '../src/data/cards';
import { TOOLS } from '../src/data/tools';
import { catchUp, nextCost, passiveRate, rewardMods, toolCost } from '../src/game/economy';
import { rewardBreakdown, rewardFor } from '../src/game/scoring';
import { checkStamps, describeStamp, nextStamps, stampBonuses } from '../src/game/stamps';
import { defaultState } from '../src/game/state';

const KA = ALL_CARDS.find((c) => c.id === 'hiragana:か')!;

describe('stamps', () => {
  it('awards every tier reached, once', () => {
    const state = defaultState();
    state.totalEarned = 12_345;
    state.bestStreak = 30;
    const ids = checkStamps(state, 1).map((s) => s.id);
    // 100, 1K and 10K sushi; streaks of 10 and 25.
    expect(ids).toEqual(['sushi:0', 'sushi:1', 'sushi:2', 'streak:0', 'streak:1']);
    expect(checkStamps(state, 2)).toEqual([]);
    expect(state.stamps['sushi:2']).toBe(1);
  });

  it('never runs out of tiers', () => {
    const state = defaultState();
    state.totalEarned = 1e15;
    state.bestStreak = 1_000;
    state.tools = { shamoji: 500 };
    checkStamps(state, 1);
    expect(state.stamps['sushi:13']).toBeDefined();
    expect(describeStamp('sushi:13')!.title).toBe('1,000,000,000,000,000 sushi made');
    expect(describeStamp('streak:12')!.title).toBe('Streak of 1,000');
    expect(describeStamp('tool:shamoji:12')!.title).toBe('500 × Shamoji');
    // The next goals are always further away.
    for (const next of nextStamps(state)) expect(next.need).toBeGreaterThan(next.have);
  });

  it('counts answers on a 1-2.5-5 scale', () => {
    const titles = [0, 1, 2, 3, 4, 5].map((i) => describeStamp(`answers:${i}`)!.title);
    expect(titles).toEqual(['50', '100', '250', '500', '1,000', '2,500'].map((n) => `${n} correct answers`));
  });

  it('gives each family its own bonus', () => {
    const state = defaultState();
    state.stamps = {
      'answers:0': 1,
      'answers:1': 1,
      'sushi:0': 1,
      'streak:0': 1,
      'row:hiragana:ka': 1,
      'unlock:katakana': 1,
      'tool:shamoji:0': 1,
      'goals:0': 1,
      'days:0': 1,
    };
    const b = stampBonuses(state);
    expect(b.answer).toBeCloseTo(1.06);
    expect(b.idle).toBeCloseTo(1.03);
    expect(b.streakCap).toBeCloseTo(0.05);
    expect(b.deck.hiragana).toBeCloseTo(1.02);
    expect(b.deck.katakana).toBeCloseTo(1.1);
    expect(b.tool.shamoji).toBeCloseTo(1.05);
    expect(b.away).toBeCloseTo(0.52);
    expect(b.discount).toBeCloseTo(0.01);
  });

  it('caps the away speed and the discount', () => {
    const state = defaultState();
    for (let i = 0; i < 100; i++) {
      state.stamps[`goals:${i}`] = 1;
      state.stamps[`days:${i}`] = 1;
    }
    expect(stampBonuses(state).away).toBe(0.9);
    expect(stampBonuses(state).discount).toBe(0.3);
  });

  it('feeds into answers, the kitchen, prices and time away', () => {
    const state = { ...defaultState(0), enabledGroups: ['hiragana:ka'] };
    state.tools = { shamoji: 10 };
    const before = { reward: rewardFor(KA, 1, rewardMods(state)), rate: passiveRate(state) };
    state.stamps = { 'answers:0': 1, 'row:hiragana:ka': 1, 'sushi:0': 1, 'tool:shamoji:0': 1, 'days:0': 1, 'goals:0': 1 };
    expect(rewardFor(KA, 1, rewardMods(state))).toBeCloseTo(before.reward * 1.03 * 1.02);
    expect(rewardBreakdown(KA, 1, rewardMods(state))).toBe('1 base × 1 hiragana × 1 rows × 1 streak × 1.05 stamps');
    expect(passiveRate(state)).toBeCloseTo(before.rate * 1.03 * 1.05);
    const shamoji = TOOLS.find((t) => t.id === 'shamoji')!;
    expect(nextCost(state, shamoji)).toBe(Math.ceil(toolCost(shamoji, 10) * 0.99));
    const { away } = catchUp(state, 3_600_000);
    expect(away?.efficiency).toBeCloseTo(0.52);
  });

  it('describes every stamp it can award', () => {
    const state = defaultState();
    state.totalEarned = 1e6;
    state.bestStreak = 120;
    state.tools = Object.fromEntries(TOOLS.map((t) => [t.id, 30]));
    state.dayStreak = { count: 10, best: 10, lastDay: '', goalsHit: 10 };
    for (const c of ALL_CARDS) state.stats[c.id] = { right: 5, wrong: 0, lastSeen: 1, lastWrong: false };
    state.unlocked = ['hiragana', 'katakana', 'numbers', 'greetings'];
    const earned = checkStamps(state, 1);
    expect(earned.length).toBe(Object.keys(state.stamps).length);
    expect(earned.map((s) => s.family)).toEqual(expect.arrayContaining(['answers', 'sushi', 'streak', 'row', 'lesson', 'tool', 'goals', 'days']));
    expect(state.stamps['mastered:greetings']).toBeDefined();
    expect(state.stamps['unlock:hiragana']).toBeUndefined();
  });
});
