import { ALL_CARDS, cardsInGroups, DECK_IDS, groupKey, type DeckId } from '../data/cards';
import { TOOL_IDS } from '../data/tools';
import { STORAGE_PREFIX } from './storage';

export interface CardStat {
  right: number;
  wrong: number;
  /** Epoch ms of the last time this card was asked. */
  lastSeen: number;
  /** True if the last answer to this card was wrong. */
  lastWrong: boolean;
}

/** What the quiz shows: romaji to pick the kana, kana to pick the romaji, or either at random. */
export type QuizMode = 'pick-kana' | 'pick-romaji' | 'mixed';
export const QUIZ_MODES: readonly QuizMode[] = ['pick-kana', 'pick-romaji', 'mixed'];

export interface GameState {
  version: 2;
  sushi: number;
  totalEarned: number;
  streak: number;
  bestStreak: number;
  /** The one lesson being quizzed. */
  activeDeck: DeckId;
  /** Group keys like "hiragana:ka", for every lesson; only the active deck's are quizzed. */
  enabledGroups: string[];
  stats: Record<string, CardStat>;
  quizMode: QuizMode;
  /** Show the Japanese side in kanji where a card has it (numbers, some greetings). */
  useKanji: boolean;
  /** Tool id → number owned. */
  tools: Record<string, number>;
  /** Tool id → seconds into the current production cycle. */
  toolProgress: Record<string, number>;
  /** Epoch ms of the last economy tick; the gap to "now" is time away. */
  lastTick: number;
  lastSaved: number;
}

/** Rows of the lesson being played; other lessons keep their picks for when you switch back. */
export const activeGroups = (state: GameState) => state.enabledGroups.filter((k) => k.startsWith(`${state.activeDeck}:`));

export const SAVE_KEY = `${STORAGE_PREFIX}:save`;

export type SaveStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function defaultState(now = Date.now()): GameState {
  return {
    version: 2,
    sushi: 0,
    totalEarned: 0,
    streak: 0,
    bestStreak: 0,
    activeDeck: 'hiragana',
    enabledGroups: [groupKey('hiragana', 'a'), groupKey('hiragana', 'ka')],
    stats: {},
    quizMode: 'pick-kana',
    useKanji: false,
    tools: {},
    toolProgress: {},
    lastTick: now,
    lastSaved: now,
  };
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Keeps only known tool ids with non-negative numbers. */
function toolRecord(raw: unknown, integer: boolean): Record<string, number> {
  const out: Record<string, number> = {};
  if (typeof raw !== 'object' || raw === null) return out;
  for (const [id, v] of Object.entries(raw)) {
    if (TOOL_IDS.has(id) && isNum(v) && v >= 0) out[id] = integer ? Math.floor(v) : v;
  }
  return out;
}

/**
 * Validates an unknown value (parsed JSON) into a GameState, migrating older
 * versions and repairing bad fields. Returns null if it isn't a save at all.
 */
export function parseState(raw: unknown): GameState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r.version !== 1 && r.version !== 2) return null;
  const fresh = defaultState();

  const stats: Record<string, CardStat> = {};
  if (typeof r.stats === 'object' && r.stats !== null) {
    for (const [id, s] of Object.entries(r.stats as Record<string, Partial<CardStat>>)) {
      if (s && isNum(s.right) && isNum(s.wrong) && isNum(s.lastSeen)) {
        // Older saves have no lastWrong; treating it as false is the safe default.
        stats[id] = { right: s.right, wrong: s.wrong, lastSeen: s.lastSeen, lastWrong: s.lastWrong === true };
      }
    }
  }
  const picked = Array.isArray(r.enabledGroups) ? r.enabledGroups.filter((g): g is string => typeof g === 'string') : [];
  const groups = picked.length > 0 ? picked : fresh.enabledGroups;
  // Saves from before one-lesson-at-a-time play the lesson of their first row.
  const activeDeck = DECK_IDS.includes(r.activeDeck as DeckId)
    ? (r.activeDeck as DeckId)
    : (DECK_IDS.find((d) => groups[0]?.startsWith(`${d}:`)) ?? fresh.activeDeck);
  // The lesson being played needs at least one real row, or there's nothing to ask.
  const enabledGroups = cardsInGroups(groups).some((c) => c.deck === activeDeck)
    ? groups
    : [...groups, groupKey(activeDeck, ALL_CARDS.find((c) => c.deck === activeDeck)!.group)];
  const lastSaved = isNum(r.lastSaved) ? r.lastSaved : fresh.lastSaved;

  return {
    version: 2,
    sushi: isNum(r.sushi) && r.sushi >= 0 ? r.sushi : fresh.sushi,
    totalEarned: isNum(r.totalEarned) ? r.totalEarned : fresh.totalEarned,
    streak: isNum(r.streak) ? r.streak : 0,
    bestStreak: isNum(r.bestStreak) ? r.bestStreak : 0,
    activeDeck,
    enabledGroups,
    stats,
    // Saves from before quiz modes default to the original direction.
    quizMode: QUIZ_MODES.includes(r.quizMode as QuizMode) ? (r.quizMode as QuizMode) : fresh.quizMode,
    useKanji: r.useKanji === true,
    // v1 saves have no tools; these default to empty.
    tools: toolRecord(r.tools, true),
    toolProgress: toolRecord(r.toolProgress, false),
    lastTick: isNum(r.lastTick) ? r.lastTick : lastSaved,
    lastSaved,
  };
}

/** Returns a valid state, falling back to defaults for anything missing or corrupt. */
export function load(storage: SaveStorage): GameState {
  try {
    const text = storage.getItem(SAVE_KEY);
    if (text) return parseState(JSON.parse(text)) ?? defaultState();
  } catch {
    // Unreadable storage or JSON: start fresh.
  }
  return defaultState();
}

export function save(storage: SaveStorage, state: GameState): void {
  state.lastSaved = Date.now();
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (e.g. private mode): keep playing without saving.
  }
}
