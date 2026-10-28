import { describe, expect, it } from 'vitest';
import { defaultState, load, save, SAVE_KEY, type SaveStorage } from '../src/game/state';

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
    state.enabledGroups = ['katakana:sa'];
    state.stats['katakana:サ'] = { right: 2, wrong: 1, lastSeen: 123 };
    state.tools = { shamoji: 3, hangiri: 1 };
    state.toolProgress = { shamoji: 4.5 };
    save(storage, state);
    expect(load(storage)).toEqual(state);
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
    expect(loaded.stats['hiragana:さ']).toEqual(v1.stats['hiragana:さ']);
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
        }),
      ),
    );
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
