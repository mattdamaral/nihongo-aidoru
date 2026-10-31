import type { DeckId } from './cards';

export interface Lesson {
  id: string;
  name: string;
  jpName: string;
  /** 'soon' lessons are shown greyed out until they are built. */
  status: 'ready' | 'soon';
  /** Deck quizzed by this lesson. */
  deck?: DeckId;
}

// Ordered by difficulty; each ready lesson's deck pays more than the one before.
export const LESSONS: Lesson[] = [
  { id: 'hiragana', name: 'Hiragana', jpName: 'ひらがな', status: 'ready', deck: 'hiragana' },
  { id: 'katakana', name: 'Katakana', jpName: 'カタカナ', status: 'ready', deck: 'katakana' },
  { id: 'numbers', name: 'Numbers', jpName: 'すうじ', status: 'ready', deck: 'numbers' },
  { id: 'greetings', name: 'Greetings', jpName: 'あいさつ', status: 'ready', deck: 'greetings' },
  { id: 'food', name: 'Food', jpName: 'たべもの', status: 'soon' },
];
