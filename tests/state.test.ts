import { describe, expect, it } from 'vitest';
import { rewardMods } from '../src/game/economy';
import { rowBonus } from '../src/game/scoring';
import { activeGroups, defaultState, load, save, SAVE_KEY, type SaveStorage } from '../src/game/state';

function memoryStorage(initial?: string): SaveStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(SAVE_KEY, initial);
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
}

describe('save / load', () => {
  it('round-trips a game state', () => {
    const storage = memoryStorage();
    const state = defaultState();
    state.sushi = 42.5;
    state.streak = 3;
    state.activeDeck = 'numbers';
    state.unlocked = ['hiragana', 'katakana', 'numbers'];
    state.stamps = { 'answers:0': 5 };
    state.daily = { day: '2026-11-01', correct: 12, goal: 20 };
    state.dayStreak = { count: 3, best: 7, lastDay: '2026-10-31', goalsHit: 9 };
    state.playSeconds = 321.5;
    state.enabledGroups = ['katakana:sa', 'numbers:n20'];
    state.stats['katakana:サ'] = { right: 2, wrong: 1, lastSeen: 123, lastWrong: true };
    state.tools = { shamoji: 3, hangiri: 1 };
    state.toolProgress = { shamoji: 4.5 };
    state.quizMode = 'listen';
    state.useKanji = true;
    save(storage, state);
    expect(load(storage)).toEqual(state);
  });

  it('quizzes one lesson at a time, keeping the other lessons’ rows', () => {
    const state = { ...defaultState(), activeDeck: 'numbers' as const };
    state.enabledGroups = ['hiragana:a', 'numbers:n1', 'numbers:n10', 'greetings:time'];
    expect(activeGroups(state)).toEqual(['numbers:n1', 'numbers:n10']);
    // The row bonus only counts the lesson being played.
    expect(rewardMods(state).rowMult).toBeCloseTo(rowBonus(2));
  });

  it('plays the lesson of the first row for saves from before lessons were separate', () => {
    const loaded = load(memoryStorage(JSON.stringify({ version: 2, enabledGroups: ['katakana:ka', 'hiragana:a'] })));
    expect(loaded.activeDeck).toBe('katakana');
    expect(loaded.useKanji).toBe(false);
  });

  it('turns on a row if the active lesson has none', () => {
    const loaded = load(memoryStorage(JSON.stringify({ version: 2, activeDeck: 'greetings', enabledGroups: ['hiragana:a'] })));
    expect(loaded.activeDeck).toBe('greetings');
    expect(loaded.enabledGroups).toEqual(['hiragana:a', 'greetings:time']);
  });

  it('starts fresh with no save', () => {
    const loaded = load(memoryStorage());
    expect(loaded.sushi).toBe(0);
    expect(loaded.enabledGroups).toEqual(['hiragana:a', 'hiragana:ka']);
    expect(loaded.tools).toEqual({});
  });

  it.each(['not json', 'null', '42', '{"version":99,"sushi":5}'])('falls back to defaults for %s', (raw) => {
    const loaded = load(memoryStorage(raw));
    expect(loaded.sushi).toBe(0);
    expect(loaded.version).toBe(2);
  });

  it('migrates a v1 save, keeping progress', () => {
    const v1 = {
      version: 1,
      sushi: 77.5,
      totalEarned: 90,
      streak: 4,
      bestStreak: 12,
      enabledGroups: ['hiragana:sa'],
      stats: { 'hiragana:さ': { right: 3, wrong: 1, lastSeen: 50 } },
      lastSaved: 1_000,
    };
    const loaded = load(memoryStorage(JSON.stringify(v1)));
    expect(loaded).toMatchObject({ version: 2, sushi: 77.5, bestStreak: 12, enabledGroups: ['hiragana:sa'] });
    expect(loaded.stats['hiragana:さ']).toEqual({ ...v1.stats['hiragana:さ'], lastWrong: false });
    expect(loaded.tools).toEqual({});
    // No tools yet, so there's nothing to pay out for the time since the v1 save.
    expect(loaded.lastTick).toBe(1_000);
  });

  it('repairs bad fields individually', () => {
    const loaded = load(
      memoryStorage(
        JSON.stringify({
          version: 2,
          sushi: 'lots',
          totalEarned: 10,
          enabledGroups: [],
          stats: { good: { right: 1, wrong: 0, lastSeen: 5 }, bad: { right: 'x' } },
          tools: { shamoji: 2.7, unknownTool: 5, makisu: -1 },
          quizMode: 'sideways',
        }),
      ),
    );
    expect(loaded.quizMode).toBe('pick-kana');
    expect(loaded.sushi).toBe(0);
    expect(loaded.totalEarned).toBe(10);
    expect(loaded.enabledGroups.length).toBeGreaterThan(0);
    expect(Object.keys(loaded.stats)).toEqual(['good']);
    expect(loaded.tools).toEqual({ shamoji: 2 });
  });

  it('keeps playing when storage throws', () => {
    const broken: SaveStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
    };
    expect(load(broken).sushi).toBe(0);
    expect(() => save(broken, defaultState())).not.toThrow();
  });
});
