import { describe, expect, it } from 'vitest';
import { ALL_CARDS, type DeckId } from '../src/data/cards';
import {
  checkDailyGoal,
  checkUnlocks,
  countCorrect,
  currentDayStreak,
  dayBefore,
  deckPoints,
  isUnlocked,
  unlockNeed,
  unlockProgress,
} from '../src/game/progress';
import { defaultState, load, localDay, type GameState } from '../src/game/state';

/** Gives `points` mastery points in `deck`, five per card from the start. */
function master(state: GameState, deck: DeckId, points: number): void {
  for (const c of ALL_CARDS.filter((x) => x.deck === deck)) {
    if (points <= 0) break;
    const right = Math.min(points, 5);
    state.stats[c.id] = { right, wrong: 0, lastSeen: 1, lastWrong: false };
    points -= right;
  }
}

const at = (day: string, hour = 12) => new Date(`${day}T${String(hour).padStart(2, '0')}:00:00`).getTime();

describe('lesson gating', () => {
  it('asks about the same effort for every unlock', () => {
    // Half of hiragana and katakana (71 cards × 5), capped for the 130 numbers; half of greetings.
    expect(unlockNeed('hiragana')).toBe(178);
    expect(unlockNeed('katakana')).toBe(178);
    expect(unlockNeed('numbers')).toBe(180);
    expect(unlockNeed('greetings')).toBe(63);
  });

  it('opens each lesson once the one before is mastered enough, in order', () => {
    const state = defaultState();
    expect(isUnlocked(state, 'hiragana')).toBe(true);
    expect(isUnlocked(state, 'katakana')).toBe(false);
    master(state, 'hiragana', 177);
    expect(checkUnlocks(state)).toEqual([]);
    expect(unlockProgress(state, 'katakana')).toEqual({ from: 'hiragana', have: 177, need: 178 });
    master(state, 'hiragana', 178);
    // Katakana opens; numbers needs katakana points, even if someone has numbers points already.
    master(state, 'numbers', 400);
    expect(checkUnlocks(state)).toEqual(['katakana']);
    expect(isUnlocked(state, 'numbers')).toBe(false);
    master(state, 'katakana', 200);
    expect(checkUnlocks(state)).toEqual(['numbers', 'greetings']);
    expect(state.unlocked).toEqual(['hiragana', 'katakana', 'numbers', 'greetings']);
  });

  it('counts at most five right answers per card', () => {
    const state = defaultState();
    state.stats['hiragana:あ'] = { right: 50, wrong: 0, lastSeen: 1, lastWrong: false };
    expect(deckPoints(state, 'hiragana')).toBe(5);
  });

  it('keeps lessons from older saves open, and falls back from a locked lesson', () => {
    const storage = (save: object) => ({ getItem: () => JSON.stringify(save), setItem: () => {} });
    const old = load(storage({ version: 2, activeDeck: 'greetings', enabledGroups: ['greetings:time'], stats: { 'numbers:42': { right: 1, wrong: 0, lastSeen: 1 } } }));
    expect(old.unlocked).toEqual(['hiragana', 'numbers', 'greetings']);
    expect(old.activeDeck).toBe('greetings');

    const locked = load(storage({ version: 2, activeDeck: 'numbers', unlocked: ['hiragana'], enabledGroups: ['numbers:n1'] }));
    expect(locked.activeDeck).toBe('hiragana');
    expect(locked.enabledGroups).toContain('hiragana:a');
  });
});

describe('daily goal', () => {
  it('handles month and year boundaries', () => {
    expect(dayBefore('2026-03-01')).toBe('2026-02-28');
    expect(dayBefore('2027-01-01')).toBe('2026-12-31');
    expect(localDay(at('2026-11-01', 23))).toBe('2026-11-01');
  });

  it('builds a day streak, once per day, and breaks it after a missed day', () => {
    const state = defaultState(at('2026-11-01'));
    state.daily.goal = 20;
    const play = (day: string, answers: number) => {
      let hits = 0;
      for (let i = 0; i < answers; i++) if (countCorrect(state, at(day))) hits++;
      return hits;
    };
    expect(play('2026-11-01', 19)).toBe(0);
    expect(play('2026-11-01', 30)).toBe(1);
    expect(state.dayStreak).toMatchObject({ count: 1, goalsHit: 1 });
    expect(play('2026-11-02', 20)).toBe(1);
    expect(state.dayStreak.count).toBe(2);
    expect(currentDayStreak(state, at('2026-11-03'))).toBe(2);
    // Skipping a day: the streak shows as broken, then starts again at 1.
    expect(currentDayStreak(state, at('2026-11-04'))).toBe(0);
    play('2026-11-04', 20);
    expect(state.dayStreak).toMatchObject({ count: 1, best: 2, goalsHit: 3 });
  });

  it('starts each day from zero, and counts a goal lowered below today’s answers', () => {
    const state = defaultState(at('2026-11-01'));
    for (let i = 0; i < 30; i++) countCorrect(state, at('2026-11-01'));
    expect(state.daily.correct).toBe(30);
    expect(checkDailyGoal(state, at('2026-11-01'))).toBe(false);
    state.daily.goal = 20;
    expect(checkDailyGoal(state, at('2026-11-01'))).toBe(true);
    countCorrect(state, at('2026-11-02'));
    expect(state.daily).toMatchObject({ day: '2026-11-02', correct: 1 });
  });
});
