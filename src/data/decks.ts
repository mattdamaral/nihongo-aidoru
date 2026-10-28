import { GROUPS, type Script } from './kana';

export interface Deck {
  id: Script;
  name: string;
  jpName: string;
  /** Reward multiplier; harder decks pay more. */
  multiplier: number;
  groups: string[];
}

export const DECKS: Deck[] = [
  { id: 'hiragana', name: 'Hiragana', jpName: 'ひらがな', multiplier: 1, groups: GROUPS.map((g) => g.id) },
  { id: 'katakana', name: 'Katakana', jpName: 'カタカナ', multiplier: 1.5, groups: GROUPS.map((g) => g.id) },
];

export function deckFor(script: Script): Deck {
  const deck = DECKS.find((d) => d.id === script);
  if (!deck) throw new Error(`Unknown deck: ${script}`);
  return deck;
}
