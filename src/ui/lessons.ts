import { ALL_CARDS, countRows, groupKey, type DeckId } from '../data/cards';
import { deckFor } from '../data/decks';
import { LESSONS } from '../data/lessons';
import { rowBonus } from '../game/scoring';
import type { GameState, QuizMode } from '../game/state';

export interface LessonsView {
  /** Refreshes mastery bars and counts without rebuilding the panel. */
  update(): void;
  /** Rebuilds the panel, e.g. after loading a save replaced the enabled rows. */
  rebuild(): void;
  /** Turns on one row, e.g. from Learn mode's "Practice this row". */
  enableRow(key: string): void;
  open(): void;
  close(): void;
  toggle(): void;
  readonly isOpen: boolean;
}

export interface LessonsActions {
  /** Fires after the enabled rows change; the panel edits `state` directly. */
  onChange(): void;
  /** Fires after `state.quizMode` changes. */
  onQuizMode(): void;
  onLearn(deck: DeckId): void;
}

/** Correct answers needed per card to fill its share of the mastery bar. */
export const MASTERY_TARGET = 5;
const HINT = 'Pick the rows to practice. More rows and harder lessons pay more sushi.';

function mastery(state: GameState, key: string): number {
  const cards = ALL_CARDS.filter((c) => groupKey(c.deck, c.group) === key);
  const score = cards.reduce((sum, c) => sum + Math.min(state.stats[c.id]?.right ?? 0, MASTERY_TARGET), 0);
  return score / (cards.length * MASTERY_TARGET);
}

const rowsOn = (state: GameState, deck: DeckId) =>
  state.enabledGroups.filter((k) => k.startsWith(`${deck}:`)).length;

/**
 * Lessons panel: a left column on wide screens, a drawer from the left otherwise.
 * Lists every lesson; the selected lesson expands to its row chips.
 */
export function createLessons(
  root: HTMLElement,
  backdrop: HTMLElement,
  state: GameState,
  actions: LessonsActions,
): LessonsView {
  root.innerHTML = `
    <header class="panel-head">
      <div>
        <h2>Lessons</h2>
        <p class="lessons-bonus"></p>
      </div>
      <button type="button" class="btn btn-small lessons-close" aria-label="Close lessons">Close</button>
    </header>
    <p class="lessons-hint" aria-live="polite"></p>
    <div class="quiz-mode" role="group" aria-label="Quiz direction">
      <span class="quiz-mode-label">Quiz</span>
      <button type="button" class="btn btn-small" data-mode="pick-kana" title="See the romaji, number or meaning; pick the Japanese">a → <span lang="ja">あ</span></button>
      <button type="button" class="btn btn-small" data-mode="pick-romaji" title="See the Japanese; pick the romaji, number or meaning"><span lang="ja">あ</span> → a</button>
      <button type="button" class="btn btn-small" data-mode="mixed" title="A random mix of both">Mixed</button>
    </div>
    <div class="lesson-list"></div>
  `;
  const bonusEl = root.querySelector<HTMLElement>('.lessons-bonus')!;
  const hintEl = root.querySelector<HTMLElement>('.lessons-hint')!;
  const modeEl = root.querySelector<HTMLElement>('.quiz-mode')!;
  const list = root.querySelector<HTMLElement>('.lesson-list')!;
  const firstDeck = state.enabledGroups[0]?.split(':')[0];
  let selected: DeckId = LESSONS.find((l) => l.deck === firstDeck)?.deck ?? 'hiragana';
  let isOpen = false;

  function chip(deckId: DeckId, groupId: string): string {
    const g = deckFor(deckId).groups.find((x) => x.id === groupId)!;
    const key = groupKey(deckId, groupId);
    return `
      <label class="chip" data-key="${key}">
        <input type="checkbox" value="${key}" ${state.enabledGroups.includes(key) ? 'checked' : ''} />
        <span class="chip-kana" lang="ja">${g.preview}</span>
        <span class="chip-label">${g.label}</span>
        <span class="chip-bar"><span></span></span>
      </label>`;
  }

  function detail(deckId: DeckId): string {
    const deck = deckFor(deckId);
    return `
      <div class="lesson-detail" data-deck="${deckId}">
        <div class="lesson-actions">
          <button type="button" class="btn learn-btn" data-learn="${deckId}">Learn</button>
          <button type="button" class="btn btn-small" data-all="${deckId}">All</button>
          <button type="button" class="btn btn-small" data-none="${deckId}">None</button>
        </div>
        ${deck.sections
          .map(
            (s) => `
          ${s.title ? `<h4 class="chips-sub">${s.title}</h4>` : ''}
          <div class="chips">${s.groups.map((g) => chip(deckId, g)).join('')}</div>`,
          )
          .join('')}
      </div>`;
  }

  function render(): void {
    list.innerHTML = LESSONS.map((lesson) => {
      if (lesson.status === 'soon' || !lesson.deck) {
        return `
          <button type="button" class="lesson is-soon" disabled>
            <span class="lesson-jp" lang="ja">${lesson.jpName}</span>
            <span class="lesson-name">${lesson.name}</span>
            <span class="lesson-meta">Coming soon</span>
          </button>`;
      }
      const open = lesson.deck === selected;
      return `
        <button type="button" class="lesson" data-lesson="${lesson.deck}" aria-expanded="${open}">
          <span class="lesson-jp" lang="ja">${lesson.jpName}</span>
          <span class="lesson-name">${lesson.name}</span>
          <span class="lesson-meta"></span>
        </button>
        ${open ? detail(lesson.deck) : ''}`;
    }).join('');
    update();
  }

  function update(): void {
    const rows = countRows(state.enabledGroups);
    bonusEl.textContent = `Row bonus ×${Number(rowBonus(rows).toFixed(2))} · ${rows} ${rows === 1 ? 'row' : 'rows'}`;
    for (const btn of modeEl.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
      btn.setAttribute('aria-pressed', String(btn.dataset.mode === state.quizMode));
    }
    for (const el of list.querySelectorAll<HTMLElement>('[data-lesson]')) {
      const deck = el.dataset.lesson as DeckId;
      const on = rowsOn(state, deck);
      el.querySelector('.lesson-meta')!.textContent = `×${deckFor(deck).multiplier} · ${on ? `${on} on` : 'off'}`;
      el.classList.toggle('is-on', on > 0);
    }
    for (const el of list.querySelectorAll<HTMLElement>('.chip')) {
      const pct = Math.round(mastery(state, el.dataset.key!) * 100);
      el.title = `Mastery ${pct}%`;
      el.querySelector<HTMLElement>('.chip-bar span')!.style.width = `${pct}%`;
    }
  }

  function setGroups(next: string[]): void {
    // At least one row must stay on, otherwise there is nothing to quiz.
    if (next.length === 0) {
      hintEl.textContent = 'Keep at least one row selected.';
      hintEl.classList.add('is-bad');
      render();
      return;
    }
    hintEl.textContent = HINT;
    hintEl.classList.remove('is-bad');
    state.enabledGroups = next;
    actions.onChange();
    render();
  }

  list.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    const set = new Set(state.enabledGroups);
    if (input.checked) set.add(input.value);
    else set.delete(input.value);
    setGroups([...set]);
  });

  list.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!btn) return;
    if (btn.dataset.lesson) {
      selected = btn.dataset.lesson as DeckId;
      render();
    } else if (btn.dataset.learn) {
      actions.onLearn(btn.dataset.learn as DeckId);
    } else {
      const deck = (btn.dataset.all ?? btn.dataset.none) as DeckId | undefined;
      if (!deck) return;
      const keys = deckFor(deck).groups.map((g) => groupKey(deck, g.id));
      const others = state.enabledGroups.filter((k) => !keys.includes(k));
      setGroups(btn.dataset.all ? [...others, ...keys] : others);
    }
  });

  modeEl.addEventListener('click', (e) => {
    const mode = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-mode]')?.dataset.mode as QuizMode | undefined;
    if (!mode || mode === state.quizMode) return;
    state.quizMode = mode;
    update();
    actions.onQuizMode();
  });

  const setOpen = (open: boolean) => {
    isOpen = open;
    root.classList.toggle('is-open', open);
    backdrop.classList.toggle('is-open', open);
  };
  root.querySelector('.lessons-close')!.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));

  hintEl.textContent = HINT;
  render();

  return {
    update,
    rebuild: render,
    enableRow(key) {
      if (state.enabledGroups.includes(key)) return;
      selected = key.split(':')[0] as DeckId;
      setGroups([...state.enabledGroups, key]);
    },
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!isOpen),
    get isOpen() {
      return isOpen;
    },
  };
}
