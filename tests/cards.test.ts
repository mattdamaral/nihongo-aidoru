import { describe, expect, it } from 'vitest';
import { ALL_CARDS, cardsInGroups, groupKey, japanese } from '../src/data/cards';
import { DECKS } from '../src/data/decks';
import { GREETINGS } from '../src/data/greetings';
import { NUMBERS } from '../src/data/numbers';

const byNumber = (n: number) => NUMBERS.find((c) => c.id === `numbers:${n}`)!;

describe('cards', () => {
  it('have unique ids, and every deck group has cards', () => {
    expect(new Set(ALL_CARDS.map((c) => c.id)).size).toBe(ALL_CARDS.length);
    for (const deck of DECKS) {
      for (const g of deck.groups) expect(cardsInGroups([groupKey(deck.id, g.id)]).length, `${deck.id}:${g.id}`).toBeGreaterThan(0);
      // Every group shows up exactly once in the Lessons panel layout.
      expect(deck.sections.flatMap((s) => s.groups).sort()).toEqual(deck.groups.map((g) => g.id).sort());
    }
  });

  it('give numbers and greetings unique answers and kana within their deck', () => {
    for (const deck of [NUMBERS, GREETINGS]) {
      expect(new Set(deck.map((c) => c.answer)).size).toBe(deck.length);
      expect(new Set(deck.map((c) => c.kana)).size).toBe(deck.length);
      for (const c of deck) expect(c.notes?.length, c.id).toBeGreaterThan(0);
      // With kanji on, the Japanese side must still tell every card apart.
      expect(new Set(deck.map((c) => japanese(c, true))).size).toBe(deck.length);
    }
  });

  it('show kanji only when the option is on and the card has one', () => {
    const fortyTwo = NUMBERS.find((c) => c.id === 'numbers:42')!;
    expect(japanese(fortyTwo, false)).toBe('よんじゅうに');
    expect(japanese(fortyTwo, true)).toBe('四十二');
    const tadaima = GREETINGS.find((c) => c.kana === 'ただいま')!;
    expect(japanese(tadaima, true)).toBe('ただいま');
    expect(GREETINGS.find((c) => c.kana === 'おねがいします')!.kanji).toBe('お願いします');
    expect(GREETINGS.filter((c) => c.kanji)).toHaveLength(13);
  });
});

describe('numbers', () => {
  it('group 1–9, each ten, then hundreds, thousands, 万 and beyond', () => {
    expect(NUMBERS).toHaveLength(130);
    expect(cardsInGroups(['numbers:n1']).map((c) => c.answer)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    expect(cardsInGroups(['numbers:n90']).map((c) => c.answer)).toEqual(
      ['90', '91', '92', '93', '94', '95', '96', '97', '98', '99'],
    );
    expect(cardsInGroups(['numbers:n10000']).map((c) => c.answer)[0]).toBe('10,000');
  });

  // Readings checked by hand, including every irregular sound change.
  it.each([
    [1, 'いち', 'ichi', '一'],
    [4, 'よん', 'yon', '四'],
    [10, 'じゅう', 'juu', '十'],
    [14, 'じゅうよん', 'juuyon', '十四'],
    [42, 'よんじゅうに', 'yonjuuni', '四十二'],
    [77, 'ななじゅうなな', 'nanajuunana', '七十七'],
    [99, 'きゅうじゅうきゅう', 'kyuujuukyuu', '九十九'],
    [100, 'ひゃく', 'hyaku', '百'],
    [300, 'さんびゃく', 'sanbyaku', '三百'],
    [600, 'ろっぴゃく', 'roppyaku', '六百'],
    [800, 'はっぴゃく', 'happyaku', '八百'],
    [1000, 'せん', 'sen', '千'],
    [3000, 'さんぜん', 'sanzen', '三千'],
    [8000, 'はっせん', 'hassen', '八千'],
    [10_000, 'いちまん', 'ichiman', '一万'],
    [80_000, 'はちまん', 'hachiman', '八万'],
    [100_000, 'じゅうまん', 'juuman', '十万'],
    [1_000_000, 'ひゃくまん', 'hyakuman', '百万'],
    [100_000_000, 'いちおく', 'ichioku', '一億'],
  ])('reads %i as %s', (n, kana, romaji, kanji) => {
    expect(byNumber(n)).toMatchObject({ kana, romaji, kanji, answer: n.toLocaleString('en-US') });
  });
});

describe('greetings', () => {
  it('has 5 groups of 5 phrases', () => {
    expect(GREETINGS).toHaveLength(25);
    for (const g of ['time', 'polite', 'meeting', 'going', 'manners']) expect(cardsInGroups([`greetings:${g}`])).toHaveLength(5);
  });
});
