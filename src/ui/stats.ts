import { ALL_CARDS, japanese, type DeckId } from '../data/cards';
import { deckFor } from '../data/decks';
import { LESSONS } from '../data/lessons';
import { currentDayStreak, deckMaxPoints, deckPoints, goalDoneToday, isUnlocked, rollDay } from '../game/progress';
import { formatDuration, formatSushi } from '../game/scoring';
import { DAILY_GOALS, type GameState } from '../game/state';
import { createSheet, type Sheet } from './sheet';

/** Cards need this many tries before they can count as "weakest". */
const WEAK_MIN_TRIES = 3;
const WEAK_COUNT = 10;

const pct = (n: number) => `${Math.round(n * 100)}%`;
const fmt = (n: number) => n.toLocaleString('en-US');

/** CSS for a goal ring filled to `share` (0–1). */
export const ringStyle = (share: number) => `--p: ${Math.min(share, 1) * 100}%`;

export interface StatsView extends Sheet {
  open(): void;
}

/** Stats sheet: today's goal, totals, each lesson's progress and the cards missed most. */
export function createStats(root: HTMLElement, state: GameState, onGoal: () => void): StatsView {
  const sheet = createSheet(root, 'stats', 'Stats');

  function render(): void {
    const now = Date.now();
    rollDay(state, now);
    const all = Object.values(state.stats);
    const right = all.reduce((s, c) => s + c.right, 0);
    const tries = all.reduce((s, c) => s + c.right + c.wrong, 0);
    const { correct, goal } = state.daily;
    const done = goalDoneToday(state, now);
    const days = currentDayStreak(state, now);

    const lessons = LESSONS.flatMap((l) => (l.deck ? [l.deck] : [])).map((deck: DeckId) => {
      const cards = ALL_CARDS.filter((c) => c.deck === deck);
      const stats = cards.map((c) => state.stats[c.id]).filter((s) => s !== undefined);
      const r = stats.reduce((s, c) => s + c.right, 0);
      const t = stats.reduce((s, c) => s + c.right + c.wrong, 0);
      const d = deckFor(deck);
      return `
        <tr${isUnlocked(state, deck) ? '' : ' class="is-locked"'}>
          <th scope="row"><span lang="ja">${d.jpName}</span> ${d.name}</th>
          <td>${pct(deckPoints(state, deck) / deckMaxPoints(deck))}</td>
          <td>${t ? pct(r / t) : '–'}</td>
          <td>${stats.length} / ${cards.length}</td>
        </tr>`;
    });

    const weak = ALL_CARDS.flatMap((c) => {
      const s = state.stats[c.id];
      const t = s ? s.right + s.wrong : 0;
      return s && t >= WEAK_MIN_TRIES && s.wrong > 0 ? [{ c, share: s.right / t, wrong: s.wrong }] : [];
    })
      .sort((a, b) => a.share - b.share || b.wrong - a.wrong)
      .slice(0, WEAK_COUNT);

    sheet.body.innerHTML = `
      <section class="stats-section stats-today">
        <div class="goal-ring is-big${done ? ' is-done' : ''}" style="${ringStyle(correct / goal)}">
          <span>${fmt(correct)}<small>/ ${goal}</small></span>
        </div>
        <div>
          <h3>Today</h3>
          <p>${done ? 'Daily goal done! Come back tomorrow to keep your streak.' : `${fmt(Math.max(goal - correct, 0))} more correct answers to hit today’s goal.`}</p>
          <p class="stats-days"><strong>${days}</strong> ${days === 1 ? 'day' : 'days'} in a row · best ${state.dayStreak.best}</p>
          <div class="quiz-mode stats-goal" role="group" aria-label="Daily goal">
            <span class="quiz-mode-label">Goal</span>
            ${DAILY_GOALS.map((g) => `<button type="button" class="btn btn-small" data-goal="${g}" aria-pressed="${g === goal}">${g}</button>`).join('')}
          </div>
        </div>
      </section>
      <section class="stats-section">
        <h3>All time</h3>
        <dl class="stats-grid">
          <div><dt>Correct answers</dt><dd>${fmt(right)}</dd></div>
          <div><dt>Accuracy</dt><dd>${tries ? pct(right / tries) : '–'}</dd></div>
          <div><dt>Best streak</dt><dd>${fmt(state.bestStreak)}</dd></div>
          <div><dt>Sushi made</dt><dd>${formatSushi(state.totalEarned)}</dd></div>
          <div><dt>Stamps</dt><dd>${fmt(Object.keys(state.stamps).length)}</dd></div>
          <div><dt>Time played</dt><dd>${formatDuration(state.playSeconds)}</dd></div>
        </dl>
      </section>
      <section class="stats-section">
        <h3>Lessons</h3>
        <table class="stats-table">
          <thead><tr><th></th><th>Mastery</th><th>Accuracy</th><th>Seen</th></tr></thead>
          <tbody>${lessons.join('')}</tbody>
        </table>
      </section>
      <section class="stats-section">
        <h3>Missed most</h3>
        ${
          weak.length
            ? `<ol class="stats-weak">${weak
                .map(
                  ({ c, share }) =>
                    `<li><span lang="ja">${japanese(c, state.useKanji)}</span> <span>${c.answer}</span> <em>${pct(share)} right</em></li>`,
                )
                .join('')}</ol>`
            : '<p class="sheet-hint">Nothing yet. Cards you miss will show up here.</p>'
        }
      </section>`;
  }

  sheet.body.addEventListener('click', (e) => {
    const goal = Number((e.target as HTMLElement).closest<HTMLElement>('[data-goal]')?.dataset.goal);
    if (!goal || goal === state.daily.goal) return;
    state.daily.goal = goal;
    onGoal();
    render();
  });

  return {
    ...sheet,
    open() {
      render();
      sheet.open();
    },
    get isOpen() {
      return sheet.isOpen;
    },
  };
}
