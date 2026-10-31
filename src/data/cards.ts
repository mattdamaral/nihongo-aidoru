import { GREETINGS } from './greetings';
import { ALL_KANA } from './kana';
import { NUMBERS } from './numbers';

export type DeckId = 'hiragana' | 'katakana' | 'numbers' | 'greetings';

/** One quiz question's worth of content, from any lesson. */
export interface Card {
  /** Unique id, e.g. "hiragana:か", "numbers:42". Used as the key for stats. */
  id: string;
  deck: DeckId;
  /** Row id, e.g. "ka" or "n40". Combined with the deck it forms a group key. */
  group: string;
  /** The Japanese side, always written in kana. */
  kana: string;
  /** Hepburn reading of `kana`. */
  romaji: string;
  /** The other side: the romaji for kana, the numeral for numbers, the meaning for greetings. */
  answer: string;
  kanji?: string;
  /** Learn mode notes for lessons without kana mnemonics. */
  notes?: string[];
}

/** A row of cards, e.g. the ka row or 20–29. */
export interface CardGroup {
  id: string;
  label: string;
  /** Short Japanese text shown on the row's chip in the Lessons panel. */
  preview: string;
}

export const ALL_CARDS: Card[] = [...ALL_KANA, ...NUMBERS, ...GREETINGS];

export const groupKey = (deck: DeckId, group: string) => `${deck}:${group}`;

const GROUP_KEYS = new Set(ALL_CARDS.map((c) => groupKey(c.deck, c.group)));

/** Number of distinct, real rows among `keys` (ignores junk from old saves). */
export function countRows(keys: Iterable<string>): number {
  return [...new Set(keys)].filter((k) => GROUP_KEYS.has(k)).length;
}

export function cardsInGroups(groupKeys: Iterable<string>): Card[] {
  const keys = new Set(groupKeys);
  return ALL_CARDS.filter((c) => keys.has(groupKey(c.deck, c.group)));
}
