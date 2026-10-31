import type { Direction } from '../game/quiz';
import type { CardGroup, DeckId } from './cards';
import { GREETING_GROUPS } from './greetings';
import { GROUPS } from './kana';
import { NUMBER_GROUPS } from './numbers';

export interface Deck {
  id: DeckId;
  name: string;
  jpName: string;
  /** Reward multiplier; harder decks pay more. */
  multiplier: number;
  groups: CardGroup[];
  /** How the Lessons panel lays out the group ids; titles may contain markup. */
  sections: { title?: string; groups: string[] }[];
  /** Quiz label for each direction. */
  labels: Record<Direction, string>;
}

const BASIC = ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa'];
const KANA_SECTIONS = [
  { groups: BASIC },
  { title: 'Dakuten <span lang="ja">゛゜</span>', groups: GROUPS.map((g) => g.id).filter((id) => !BASIC.includes(id)) },
];
const KANA_LABELS = { 'pick-kana': 'Pick the kana for', 'pick-romaji': 'Pick the romaji for' };

const kanaGroups = (index: 1 | 2): CardGroup[] =>
  GROUPS.map((g) => ({ id: g.id, label: g.label, preview: g.rows.map((row) => row[index]).join('') }));

// Each lesson pays about 1.5× the one before it: longer, harder answers earn more.
export const DECKS: Deck[] = [
  { id: 'hiragana', name: 'Hiragana', jpName: 'ひらがな', multiplier: 1, groups: kanaGroups(1), sections: KANA_SECTIONS, labels: KANA_LABELS },
  { id: 'katakana', name: 'Katakana', jpName: 'カタカナ', multiplier: 1.5, groups: kanaGroups(2), sections: KANA_SECTIONS, labels: KANA_LABELS },
  {
    id: 'numbers',
    name: 'Numbers',
    jpName: 'すうじ',
    multiplier: 2,
    groups: NUMBER_GROUPS,
    sections: [
      { groups: NUMBER_GROUPS.slice(0, 10).map((g) => g.id) },
      { title: 'Big numbers', groups: NUMBER_GROUPS.slice(10).map((g) => g.id) },
    ],
    labels: { 'pick-kana': 'Pick the Japanese for', 'pick-romaji': 'Pick the number for' },
  },
  {
    id: 'greetings',
    name: 'Greetings',
    jpName: 'あいさつ',
    multiplier: 3,
    groups: GREETING_GROUPS,
    sections: [{ groups: GREETING_GROUPS.map((g) => g.id) }],
    labels: { 'pick-kana': 'Pick the Japanese for', 'pick-romaji': 'Pick the meaning of' },
  },
];

export function deckFor(id: DeckId): Deck {
  const deck = DECKS.find((d) => d.id === id);
  if (!deck) throw new Error(`Unknown deck: ${id}`);
  return deck;
}
