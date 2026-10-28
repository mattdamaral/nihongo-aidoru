import { DECKS } from '../data/decks';
import { ALL_KANA, GROUPS, groupKey } from '../data/kana';
import type { GameState } from '../game/state';

export interface LessonsView {
  open(): void;
  close(): void;
  readonly isOpen: boolean;
}

const BASIC = ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa'];
/** Correct answers needed per kana to fill its share of the mastery bar. */
const MASTERY_TARGET = 5;

function mastery(state: GameState, key: string): number {
  const kana = ALL_KANA.filter((k) => groupKey(k.script, k.group) === key);
  const score = kana.reduce((sum, k) => sum + Math.min(state.stats[k.id]?.right ?? 0, MASTERY_TARGET), 0);
  return score / (kana.length * MASTERY_TARGET);
}

/**
 * Bottom sheet (phone) / modal (desktop) for picking which kana groups are quizzed.
 * `onChange` fires after the enabled groups change; the sheet edits `state` directly.
 */
export function createLessons(root: HTMLElement, state: GameState, onChange: () => void, onClose: () => void): LessonsView {
  root.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="lessons-title">
      <header class="sheet-head">
        <h2 id="lessons-title">Lessons</h2>
        <button type="button" class="btn sheet-done">Done</button>
      </header>
      <p class="sheet-hint">Pick the kana rows to practice. Harder decks pay more sushi.</p>
      <div class="sheet-body"></div>
    </div>
  `;
  const body = root.querySelector<HTMLElement>('.sheet-body')!;
  let isOpen = false;

  function chip(script: (typeof DECKS)[number]['id'], groupId: string): string {
    const g = GROUPS.find((x) => x.id === groupId)!;
    const key = groupKey(script, groupId);
    const kana = g.rows.map(([, h, k]) => (script === 'hiragana' ? h : k)).join('');
    const pct = Math.round(mastery(state, key) * 100);
    return `
      <label class="chip" title="Mastery ${pct}%">
        <input type="checkbox" value="${key}" ${state.enabledGroups.includes(key) ? 'checked' : ''} />
        <span class="chip-kana" lang="ja">${kana}</span>
        <span class="chip-label">${g.label}</span>
        <span class="chip-bar"><span style="width:${pct}%"></span></span>
      </label>`;
  }

  function render(): void {
    body.innerHTML = DECKS.map(
      (deck) => `
      <section class="deck" data-deck="${deck.id}">
        <div class="deck-head">
          <h3>${deck.name} <span lang="ja">${deck.jpName}</span></h3>
          <span class="deck-mult">×${deck.multiplier} sushi</span>
          <span class="deck-actions">
            <button type="button" class="btn btn-small" data-all="${deck.id}">All</button>
            <button type="button" class="btn btn-small" data-none="${deck.id}">None</button>
          </span>
        </div>
        <div class="chips">${deck.groups.filter((g) => BASIC.includes(g)).map((g) => chip(deck.id, g)).join('')}</div>
        <h4 class="chips-sub">Dakuten <span lang="ja">゛゜</span></h4>
        <div class="chips">${deck.groups.filter((g) => !BASIC.includes(g)).map((g) => chip(deck.id, g)).join('')}</div>
      </section>`,
    ).join('');
  }

  function setGroups(next: string[]): void {
    // At least one group must stay on, otherwise there is nothing to quiz.
    if (next.length === 0) {
      root.querySelector('.sheet-hint')!.textContent = 'Keep at least one row selected.';
      render();
      return;
    }
    state.enabledGroups = next;
    onChange();
    render();
  }

  body.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    const set = new Set(state.enabledGroups);
    if (input.checked) set.add(input.value);
    else set.delete(input.value);
    setGroups([...set]);
  });

  body.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!btn) return;
    const deck = DECKS.find((d) => d.id === (btn.dataset.all ?? btn.dataset.none));
    if (!deck) return;
    const keys = deck.groups.map((g) => groupKey(deck.id, g));
    const others = state.enabledGroups.filter((k) => !keys.includes(k));
    setGroups(btn.dataset.all ? [...others, ...keys] : others);
  });

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    root.classList.remove('is-open');
    onClose();
  };
  root.querySelector('.sheet-done')!.addEventListener('click', close);
  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });

  return {
    open() {
      root.querySelector('.sheet-hint')!.textContent = 'Pick the kana rows to practice. Harder decks pay more sushi.';
      render();
      isOpen = true;
      root.classList.add('is-open');
      root.querySelector<HTMLElement>('.sheet-done')!.focus();
    },
    close,
    get isOpen() {
      return isOpen;
    },
  };
}
