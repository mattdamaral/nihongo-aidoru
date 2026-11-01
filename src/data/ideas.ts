export type IdeaArea = 'learning' | 'game' | 'comfort';

export interface Idea {
  id: string;
  area: IdeaArea;
  title: string;
  text: string;
  /** "next" ideas are the likeliest to come soon. */
  when: 'next' | 'later';
}

export const AREAS: Record<IdeaArea, { title: string; jp: string }> = {
  learning: { title: 'Learning', jp: 'まなぶ' },
  game: { title: 'Game', jp: 'あそぶ' },
  comfort: { title: 'Quality of life', jp: 'べんり' },
};

/** Ideas being considered for future updates. When one ships, move it to the changelog. */
export const IDEAS: Idea[] = [
  {
    id: 'typing',
    area: 'learning',
    title: 'Typing mode',
    text: 'See the kana and type the romaji (or the number) yourself. Harder than picking from four, so it pays more sushi.',
    when: 'next',
  },
  {
    id: 'yoon',
    area: 'learning',
    title: 'Combined kana: きゃ, しゅ, ちょ…',
    text: 'A lesson for yōon, small っ and long vowels, the pieces you already meet in numbers like ひゃく and じゅう.',
    when: 'next',
  },
  {
    id: 'food',
    area: 'learning',
    title: 'Food lesson',
    text: 'まぐろ, さけ, たまご, わさび and more, plus everyday katakana words like ラーメン. It fits a sushi kitchen.',
    when: 'next',
  },
  {
    id: 'srs',
    area: 'learning',
    title: 'Smarter reviews',
    text: 'Spaced repetition: each card comes back after a growing gap (minutes, then days), with a “cards due” count on each lesson.',
    when: 'later',
  },
  {
    id: 'mastery',
    area: 'learning',
    title: 'Honest mastery bars',
    text: 'Mastery that follows how well you know a card now, so a card you keep missing doesn’t stay “mastered”.',
    when: 'later',
  },
  {
    id: 'number-builder',
    area: 'learning',
    title: 'Number builder',
    text: 'Random numbers like 3,482 to read, and sushi prices in yen (380円), once you know the number groups.',
    when: 'later',
  },
  {
    id: 'mistakes',
    area: 'learning',
    title: 'Mistake review',
    text: 'A quick drill of just the cards you missed today.',
    when: 'later',
  },
  {
    id: 'upgrades',
    area: 'game',
    title: 'Kitchen upgrades',
    text: 'One-off purchases that double a tool’s output or boost one lesson’s sushi.',
    when: 'next',
  },
  {
    id: 'prestige',
    area: 'game',
    title: 'Open a new restaurant',
    text: 'Start your kitchen over for a permanent bonus that grows with everything you’ve made. Your lessons stay.',
    when: 'later',
  },
  {
    id: 'kitchen',
    area: 'game',
    title: 'A kitchen that grows',
    text: 'See the tools you buy on the counter, customers arriving and plates piling up.',
    when: 'later',
  },
  {
    id: 'golden',
    area: 'game',
    title: 'Golden sushi',
    text: 'A rare bonus question worth many times the usual reward.',
    when: 'later',
  },
  {
    id: 'pace',
    area: 'comfort',
    title: 'Time to read mistakes',
    text: 'Tap to continue after a wrong answer, or choose how fast questions move on.',
    when: 'next',
  },
  {
    id: 'reward-tap',
    area: 'comfort',
    title: 'Reward breakdown on phones',
    text: 'Tap the “+X sushi” label to see where every bonus comes from (today it’s a hover tooltip).',
    when: 'later',
  },
  {
    id: 'rows-in-quiz',
    area: 'comfort',
    title: 'Rows in the quiz',
    text: 'Show which rows you’re playing under the lesson name, e.g. “Hiragana · ka, sa”.',
    when: 'later',
  },
  {
    id: 'reset',
    area: 'comfort',
    title: 'Start over',
    text: 'A “reset progress” option in the menu, behind a confirmation.',
    when: 'later',
  },
];
