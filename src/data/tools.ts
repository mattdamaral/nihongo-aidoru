import { CHOCHIN, DEBA, HANGIRI, ITAMAE, KAITEN, MAKISU, NOREN, SHAMOJI, UCHIWA, YANAGIBA, type Sprite } from '../ui/sprites';

export type ToolEffect =
  /** Each owned tool makes `amount` sushi every `interval` seconds. */
  | { kind: 'passive'; amount: number; interval: number }
  /** Each owned tool adds `amount` to the base reward of a correct answer. */
  | { kind: 'answer'; amount: number }
  /** Each owned tool adds `step` to the bonus per 5-streak and `cap` to the max streak bonus. */
  | { kind: 'streak'; step: number; cap: number };

export interface Tool {
  id: string;
  /** Romanized Japanese name. */
  name: string;
  kana: string;
  english: string;
  sprite: Sprite;
  baseCost: number;
  /** Price multiplier per tool already owned. */
  growth: number;
  effect: ToolEffect;
}

// Balance follows Cookie Clicker's shape (price × growth^owned, each tier ~10× the
// cost of the last) with production scaled down, since answering earns far less
// per second than clicking. See tests/balance.test.ts for the progression check.
export const TOOLS: Tool[] = [
  {
    id: 'shamoji',
    name: 'Shamoji',
    kana: 'しゃもじ',
    english: 'rice paddle',
    sprite: SHAMOJI,
    baseCost: 15,
    growth: 1.18,
    effect: { kind: 'passive', amount: 1, interval: 10 },
  },
  {
    id: 'yanagiba',
    name: 'Yanagiba',
    kana: 'やなぎば',
    english: 'sushi knife',
    sprite: YANAGIBA,
    baseCost: 50,
    growth: 1.25,
    effect: { kind: 'answer', amount: 1 },
  },
  {
    id: 'makisu',
    name: 'Makisu',
    kana: 'まきす',
    english: 'bamboo mat',
    sprite: MAKISU,
    baseCost: 120,
    growth: 1.18,
    effect: { kind: 'passive', amount: 2, interval: 5 },
  },
  {
    id: 'uchiwa',
    name: 'Uchiwa',
    kana: 'うちわ',
    english: 'rice fan',
    sprite: UCHIWA,
    baseCost: 250,
    growth: 2,
    effect: { kind: 'streak', step: 0.1, cap: 0.5 },
  },
  {
    id: 'hangiri',
    name: 'Hangiri',
    kana: 'はんぎり',
    english: 'rice tub',
    sprite: HANGIRI,
    baseCost: 1300,
    growth: 1.18,
    effect: { kind: 'passive', amount: 40, interval: 30 },
  },
  {
    id: 'deba',
    name: 'Deba',
    kana: 'でば',
    english: 'fish knife',
    sprite: DEBA,
    baseCost: 5000,
    growth: 1.3,
    effect: { kind: 'answer', amount: 5 },
  },
  {
    id: 'noren',
    name: 'Noren',
    kana: 'のれん',
    english: 'shop curtain',
    sprite: NOREN,
    baseCost: 20_000,
    growth: 1.18,
    effect: { kind: 'passive', amount: 50, interval: 5 },
  },
  {
    id: 'chochin',
    name: 'Chōchin',
    kana: 'ちょうちん',
    english: 'paper lantern',
    sprite: CHOCHIN,
    baseCost: 200_000,
    growth: 1.18,
    effect: { kind: 'passive', amount: 250, interval: 5 },
  },
  {
    id: 'kaiten',
    name: 'Kaiten',
    kana: 'かいてんずし',
    english: 'sushi conveyor',
    sprite: KAITEN,
    baseCost: 3_000_000,
    growth: 1.18,
    effect: { kind: 'passive', amount: 3000, interval: 10 },
  },
  {
    id: 'itamae',
    name: 'Itamae',
    kana: 'いたまえ',
    english: 'sushi chef',
    sprite: ITAMAE,
    baseCost: 40_000_000,
    growth: 1.18,
    effect: { kind: 'passive', amount: 16_000, interval: 10 },
  },
];

export const TOOL_IDS = new Set(TOOLS.map((t) => t.id));
