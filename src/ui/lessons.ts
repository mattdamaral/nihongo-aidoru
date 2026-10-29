import { deckFor } from '../data/decks';
import { ALL_KANA, countRows, GROUPS, groupKey, type Script } from '../data/kana';
import { LESSONS } from '../data/lessons';
import { rowBonus } from '../game/scoring';
import type { GameState } from '../game/state';

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
  onLearn(script: Script): void;
}

const BASIC = ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa'];
/** Correct answers needed per kana to fill its share of the mastery bar. */
export const MASTERY_TARGET = 5;
const HINT = 'Pick the rows to practice. More rows and harder scripts pay more sushi.';

function mastery(state: GameState, key: string): number {
  const kana = ALL_KANA.filter((k) => groupKey(k.script, k.group) === key);
  const score = kana.reduce((sum, k) => sum + Math.min(state.stats[k.id]?.right ?? 0, MASTERY_TARGET), 0);
  return score / (kana.length * MASTERY_TARGET);
}

const rowsOn = (state: GameState, script: Script) =>
  state.enabledGroups.filter((k) => k.startsWith(`${script}:`)).length;

/**
 * Lessons panel: a left column on wide screens, a drawer from the left otherwise.
 * Lists every lesson; the selected kana lesson expands to its row chips.
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
    <div class="lesson-list"></div>
  `;
  const bonusEl = root.querySelector<HTMLElement>('.lessons-bonus')!;
  const hintEl = root.querySelector<HTMLElement>('.lessons-hint')!;
  const list = root.querySelector<HTMLElement>('.lesson-list')!;
  const firstScript = state.enabledGroups[0]?.split(':')[0];
  let selected: Script = firstScript === 'katakana' ? 'katakana' : 'hiragana';
  let isOpen = false;

  function chip(script: Script, groupId: string): string {
    const g = GROUPS.find((x) => x.id === groupId)!;
    const key = groupKey(script, groupId);
    const kana = g.rows.map(([, h, k]) => (script === 'hiragana' ? h : k)).join('');
    return `
      <label class="chip" data-key="${key}">
        <input type="checkbox" value="${key}" ${state.enabledGroups.includes(key) ? 'checked' : ''} />
        <span class="chip-kana" lang="ja">${kana}</span>
        <span class="chip-label">${g.label}</span>
        <span class="chip-bar"><span></span></span>
      </label>`;
  }

  function detail(script: Script): string {
    const deck = deckFor(script);
    return `
      <div class="lesson-detail" data-deck="${script}">
        <div class="lesson-actions">
          <button type="button" class="btn learn-btn" data-learn="${script}">Learn</button>
          <button type="button" class="btn btn-small" data-all="${script}">All</button>
          <button type="button" class="btn btn-small" data-none="${script}">None</button>
        </div>
        <div class="chips">${deck.groups.filter((g) => BASIC.includes(g)).map((g) => chip(script, g)).join('')}</div>
        <h4 class="chips-sub">Dakuten <span lang="ja">゛゜</span></h4>
        <div class="chips">${deck.groups.filter((g) => !BASIC.includes(g)).map((g) => chip(script, g)).join('')}</div>
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
    for (const el of list.querySelectorAll<HTMLElement>('[data-lesson]')) {
      const script = el.dataset.lesson as Script;
      const on = rowsOn(state, script);
      el.querySelector('.lesson-meta')!.textContent = `×${deckFor(script).multiplier} · ${on ? `${on} on` : 'off'}`;
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
      selected = btn.dataset.lesson as Script;
      render();
    } else if (btn.dataset.learn) {
      actions.onLearn(btn.dataset.learn as Script);
    } else {
      const script = (btn.dataset.all ?? btn.dataset.none) as Script | undefined;
      if (!script) return;
      const keys = deckFor(script).groups.map((g) => groupKey(script, g));
      const others = state.enabledGroups.filter((k) => !keys.includes(k));
      setGroups(btn.dataset.all ? [...others, ...keys] : others);
    }
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
      selected = key.split(':')[0] as Script;
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
