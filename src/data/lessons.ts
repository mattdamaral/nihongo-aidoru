import type { Script } from './kana';

export interface Lesson {
  id: string;
  name: string;
  jpName: string;
  /** 'soon' lessons are shown greyed out until they are built. */
  status: 'ready' | 'soon';
  /** Kana script quizzed by this lesson. */
  deck?: Script;
}

export const LESSONS: Lesson[] = [
  { id: 'hiragana', name: 'Hiragana', jpName: 'ひらがな', status: 'ready', deck: 'hiragana' },
  { id: 'katakana', name: 'Katakana', jpName: 'カタカナ', status: 'ready', deck: 'katakana' },
  { id: 'numbers', name: 'Numbers', jpName: 'すうじ', status: 'soon' },
  { id: 'greetings', name: 'Greetings', jpName: 'あいさつ', status: 'soon' },
  { id: 'food', name: 'Food', jpName: 'たべもの', status: 'soon' },
];
