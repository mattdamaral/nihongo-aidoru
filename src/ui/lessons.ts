import { ALL_CARDS, cardsInGroups, countRows, groupKey, type DeckId } from '../data/cards';
import { deckFor } from '../data/decks';
import { LESSONS } from '../data/lessons';
import { isUnlocked, mastery, unlockProgress } from '../game/progress';
import { rowBonus } from '../game/scoring';
import { activeGroups, type GameState, type QuizMode } from '../game/state';

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
  /** Fires after `state.useKanji` changes. */
  onWriting(): void;
  onLearn(deck: DeckId): void;
}

const HINT = 'Pick a lesson to play, then its rows. More rows and harder lessons pay more sushi.';

const hasKanji = (deck: DeckId) => ALL_CARDS.some((c) => c.deck === deck && c.kanji);
/** True if `keys` turn on at least one real row of `deck`. */
const hasRows = (keys: string[], deck: DeckId) => cardsInGroups(keys).some((c) => c.deck === deck);

const rowsOn = (state: GameState, deck: DeckId) =>
  state.enabledGroups.filter((k) => k.startsWith(`${deck}:`)).length;

/**
 * Lessons panel: a left column on wide screens, a drawer from the left otherwise.
 * Lists every lesson; one is played at a time, and it expands to its row chips.
 * Each lesson remembers its own rows for when you switch back.
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
    <div class="quiz-mode writing" role="group" aria-label="Writing">
      <span class="quiz-mode-label">Writing</span>
      <button type="button" class="btn btn-small" data-kanji="false" title="Write every word in kana"><span lang="ja">かな</span></button>
      <button type="button" class="btn btn-small" data-kanji="true" title="Use kanji where the word is usually written with them"><span lang="ja">漢字</span></button>
    </div>
    <div class="lesson-list"></div>
  `;
  const bonusEl = root.querySelector<HTMLElement>('.lessons-bonus')!;
  const hintEl = root.querySelector<HTMLElement>('.lessons-hint')!;
  const modeEl = root.querySelector<HTMLElement>('.quiz-mode')!;
  const writingEl = root.querySelector<HTMLElement>('.writing')!;
  const list = root.querySelector<HTMLElement>('.lesson-list')!;
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
          <button type="button" class="btn btn-small" data-reset="${deckId}" title="Keep only the first row">Reset</button>
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
      if (!isUnlocked(state, lesson.deck)) {
        const p = unlockProgress(state, lesson.deck)!;
        // A card, not a button: only its Learn button does anything until it opens.
        return `
          <div class="lesson is-locked" data-locked="${lesson.deck}"
            title="Each correct answer in ${deckFor(p.from).name} is a mastery point, up to 5 per card. You can already study it in Learn.">
            <span class="lesson-jp" lang="ja">${lesson.jpName}</span>
            <span class="lesson-name">${lesson.name}</span>
            <span class="lesson-meta">Locked</span>
            <button type="button" class="btn btn-small learn-btn" data-learn="${lesson.deck}">Learn</button>
            <span class="lesson-lock">
              <span class="lesson-lock-text">Master ${deckFor(p.from).name}: ${Math.min(p.have, p.need)} / ${p.need}</span>
              <span class="chip-bar"><span style="width: ${Math.min(p.have / p.need, 1) * 100}%"></span></span>
            </span>
          </div>`;
      }
      const open = lesson.deck === state.activeDeck;
      return `
        <button type="button" class="lesson" data-lesson="${lesson.deck}" aria-expanded="${open}" aria-pressed="${open}">
          <span class="lesson-jp" lang="ja">${lesson.jpName}</span>
          <span class="lesson-name">${lesson.name}</span>
          <span class="lesson-meta"></span>
        </button>
        ${open ? detail(lesson.deck) : ''}`;
    }).join('');
    update();
  }

  function update(): void {
    const rows = countRows(activeGroups(state));
    bonusEl.textContent = `Row bonus ×${Number(rowBonus(rows).toFixed(2))} · ${rows} ${rows === 1 ? 'row' : 'rows'}`;
    for (const btn of modeEl.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
      btn.setAttribute('aria-pressed', String(btn.dataset.mode === state.quizMode));
    }
    // Kana lessons have no kanji, so the switch only shows where it changes something.
    writingEl.hidden = !hasKanji(state.activeDeck);
    for (const btn of writingEl.querySelectorAll<HTMLButtonElement>('[data-kanji]')) {
      btn.setAttribute('aria-pressed', String(btn.dataset.kanji === String(state.useKanji)));
    }
    for (const el of list.querySelectorAll<HTMLElement>('[data-lesson]')) {
      const deck = el.dataset.lesson as DeckId;
      const active = deck === state.activeDeck;
      const on = rowsOn(state, deck);
      el.querySelector('.lesson-meta')!.textContent =
        `×${deckFor(deck).multiplier}${active ? ` · playing ${on} ${on === 1 ? 'row' : 'rows'}` : ''}`;
      el.classList.toggle('is-on', active);
    }
    for (const el of list.querySelectorAll<HTMLElement>('[data-locked]')) {
      const p = unlockProgress(state, el.dataset.locked as DeckId)!;
      el.querySelector('.lesson-lock-text')!.textContent = `Master ${deckFor(p.from).name}: ${Math.min(p.have, p.need)} / ${p.need}`;
      el.querySelector<HTMLElement>('.chip-bar span')!.style.width = `${Math.min(p.have / p.need, 1) * 100}%`;
    }
    for (const el of list.querySelectorAll<HTMLElement>('.chip')) {
      const pct = Math.round(mastery(state, el.dataset.key!) * 100);
      el.title = `Mastery ${pct}%`;
      el.querySelector<HTMLElement>('.chip-bar span')!.style.width = `${pct}%`;
    }
  }

  function setGroups(next: string[]): void {
    // The lesson being played needs at least one row, otherwise there is nothing to quiz.
    if (!hasRows(next, state.activeDeck)) {
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
      play(btn.dataset.lesson as DeckId);
    } else if (btn.dataset.learn) {
      actions.onLearn(btn.dataset.learn as DeckId);
    } else {
      const deck = (btn.dataset.all ?? btn.dataset.reset) as DeckId | undefined;
      if (!deck) return;
      const keys = deckFor(deck).groups.map((g) => groupKey(deck, g.id));
      const others = state.enabledGroups.filter((k) => !keys.includes(k));
      setGroups([...others, ...(btn.dataset.all ? keys : keys.slice(0, 1))]);
    }
  });

  /** Switches the quiz to `deck`, turning on its first row if none is picked yet. */
  function play(deck: DeckId, extraRow?: string): void {
    if (!isUnlocked(state, deck)) return;
    const next = extraRow && !state.enabledGroups.includes(extraRow) ? [...state.enabledGroups, extraRow] : state.enabledGroups;
    if (deck === state.activeDeck && next === state.enabledGroups) return;
    state.activeDeck = deck;
    setGroups(hasRows(next, deck) ? next : [...next, groupKey(deck, deckFor(deck).groups[0]!.id)]);
  }

  writingEl.addEventListener('click', (e) => {
    const value = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-kanji]')?.dataset.kanji;
    if (value === undefined || (value === 'true') === state.useKanji) return;
    state.useKanji = value === 'true';
    update();
    actions.onWriting();
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
      play(key.split(':')[0] as DeckId, key);
    },
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!isOpen),
    get isOpen() {
      return isOpen;
    },
  };
}
