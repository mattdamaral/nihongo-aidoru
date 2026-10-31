import { describe, expect, it } from 'vitest';
import { ALL_CARDS, cardsInGroups, groupKey } from '../src/data/cards';
import { deckFor } from '../src/data/decks';
import { ALL_KANA } from '../src/data/kana';
import { LESSONS } from '../src/data/lessons';
import { nextQuestion } from '../src/game/quiz';
import { formatSushi, NO_MODS, rewardBreakdown, rewardFor, rowBonus, streakBonus } from '../src/game/scoring';
import { FLAME, HANGIRI, MAKISU, NIGIRI, SHAMOJI, UCHIWA, YANAGIBA } from '../src/ui/sprites';

/** Small deterministic PRNG so failures are reproducible. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

const RUNS = 500;

describe('kana data', () => {
  it('has 71 kana per script with unique ids', () => {
    expect(ALL_KANA.filter((k) => k.deck === 'hiragana')).toHaveLength(71);
    expect(ALL_KANA.filter((k) => k.deck === 'katakana')).toHaveLength(71);
    expect(new Set(ALL_KANA.map((k) => k.id)).size).toBe(ALL_KANA.length);
  });
});

describe('nextQuestion', () => {
  const pools = {
    starter: cardsInGroups([groupKey('hiragana', 'a'), groupKey('hiragana', 'ka')]),
    waOnly: cardsInGroups([groupKey('hiragana', 'wa')]),
    jiZu: cardsInGroups([groupKey('katakana', 'za'), groupKey('katakana', 'da')]),
    mixed: cardsInGroups([groupKey('hiragana', 'sa'), groupKey('katakana', 'sa')]),
    forties: cardsInGroups([groupKey('numbers', 'n40')]),
    bigNumbers: cardsInGroups([groupKey('numbers', 'big')]),
    greetings: cardsInGroups([groupKey('greetings', 'time'), groupKey('greetings', 'polite')]),
    numbersAndGreetings: cardsInGroups([groupKey('numbers', 'n1'), groupKey('greetings', 'manners')]),
  };

  for (const [name, pool] of Object.entries(pools)) {
    it(`builds valid questions from the ${name} pool`, () => {
      const rng = seeded(42);
      let prev: string | null = null;
      for (let i = 0; i < RUNS; i++) {
        const q = nextQuestion(pool, {}, prev, 'pick-kana', rng);
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices.map((k) => k.id)).size).toBe(4);
        expect(q.choices).toContain(q.target);
        expect(pool).toContain(q.target);
        // Unique answers and kana mean exactly one choice can match the prompt (ぢ/じ, づ/ず).
        expect(new Set(q.choices.map((k) => k.answer)).size).toBe(4);
        expect(new Set(q.choices.map((k) => k.kana)).size).toBe(4);
        expect(q.choices.every((k) => k.deck === q.target.deck)).toBe(true);
        expect(q.target.id).not.toBe(prev);
        prev = q.target.id;
      }
    });
  }

  it('asks often-missed kana more often', () => {
    const pool = pools.starter;
    const missed = pool[0]!;
    const stats = { [missed.id]: { right: 0, wrong: 10, lastSeen: Date.now(), lastWrong: false } };
    for (const k of pool.slice(1)) stats[k.id] = { right: 10, wrong: 0, lastSeen: Date.now(), lastWrong: false };
    const rng = seeded(7);
    let hits = 0;
    for (let i = 0; i < RUNS; i++) if (nextQuestion(pool, stats, null, 'pick-kana', rng).target.id === missed.id) hits++;
    // Uniform would be 1/10 of runs.
    expect(hits).toBeGreaterThan(RUNS / 5);
  });

  it('brings a just-missed card back sooner', () => {
    const pool = pools.forties;
    const now = Date.now();
    const seen = (lastWrong: boolean) => ({ right: 1, wrong: 1, lastSeen: now, lastWrong });
    const stats = Object.fromEntries(pool.map((c) => [c.id, seen(false)]));
    const missed = pool[3]!;
    const rate = (lastWrong: boolean) => {
      stats[missed.id] = seen(lastWrong);
      const rng = seeded(11);
      let hits = 0;
      for (let i = 0; i < RUNS; i++) if (nextQuestion(pool, stats, null, 'pick-kana', rng, now).target.id === missed.id) hits++;
      return hits / RUNS;
    };
    // Same history, but the last answer was wrong: about twice as likely to come up.
    expect(rate(true)).toBeGreaterThan(rate(false) * 1.6);
  });

  it('follows the quiz mode, mixing both directions in mixed mode', () => {
    const rng = seeded(3);
    expect(nextQuestion(pools.starter, {}, null).direction).toBe('pick-kana');
    expect(nextQuestion(pools.starter, {}, null, 'pick-romaji', rng).direction).toBe('pick-romaji');
    const directions = new Set<string>();
    for (let i = 0; i < 50; i++) directions.add(nextQuestion(pools.starter, {}, null, 'mixed', rng).direction);
    expect(directions).toEqual(new Set(['pick-kana', 'pick-romaji']));
  });

  it('rejects an empty pool', () => {
    expect(() => nextQuestion([], {}, null)).toThrow();
  });
});

describe('scoring', () => {
  it('adds 10% per 5-streak, capped at x2', () => {
    expect(streakBonus(0)).toBe(1);
    expect(streakBonus(4)).toBe(1);
    expect(streakBonus(5)).toBeCloseTo(1.1);
    expect(streakBonus(500)).toBe(2);
  });

  it('adds 5% per selected row after the first', () => {
    expect(rowBonus(0)).toBe(1);
    expect(rowBonus(1)).toBe(1);
    expect(rowBonus(6)).toBeCloseTo(1.25);
    expect(rowBonus(30)).toBeCloseTo(2.45);
    const hira = ALL_KANA.find((k) => k.id === 'hiragana:か')!;
    expect(rewardFor(hira, 1, { ...NO_MODS, rowMult: rowBonus(6) })).toBeCloseTo(1.25);
    expect(rewardBreakdown(hira, 1, { ...NO_MODS, rowMult: 1.25 })).toBe('1 base × 1 hiragana × 1.25 rows × 1 streak');
  });

  it('pays katakana more than hiragana', () => {
    const hira = ALL_KANA.find((k) => k.id === 'hiragana:か')!;
    const kata = ALL_KANA.find((k) => k.id === 'katakana:カ')!;
    expect(rewardFor(hira, 1)).toBe(1);
    expect(rewardFor(kata, 1)).toBe(1.5);
  });

  it('ranks lessons: each ready lesson pays more than the one before', () => {
    const decks = LESSONS.flatMap((l) => (l.deck ? [deckFor(l.deck)] : []));
    expect(decks.map((d) => d.multiplier)).toEqual([1, 1.5, 2, 3]);
    const fortyTwo = ALL_CARDS.find((c) => c.id === 'numbers:42')!;
    expect(rewardBreakdown(fortyTwo, 1)).toBe('1 base × 2 numbers × 1 rows × 1 streak');
  });

  it('formats big numbers compactly', () => {
    expect(formatSushi(999.9)).toBe('999');
    expect(formatSushi(1234)).toBe('1.23K');
    expect(formatSushi(2_500_000)).toBe('2.50M');
  });
});

describe('sprites', () => {
  it('have rectangular grids with known colors', () => {
    for (const sprite of [NIGIRI, FLAME, SHAMOJI, YANAGIBA, MAKISU, UCHIWA, HANGIRI]) {
      const width = sprite.grid[0]!.length;
      expect(sprite.grid).toHaveLength(width);
      for (const row of sprite.grid) {
        expect(row).toHaveLength(width);
        for (const ch of row) if (ch !== '.') expect(sprite.palette).toHaveProperty(ch);
      }
    }
  });
});
