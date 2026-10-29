import { deckFor } from '../data/decks';
import { ALL_KANA, GROUPS, groupKey, type Kana, type Script } from '../data/kana';
import { mnemonicFor } from '../data/mnemonics';
import type { GameState } from '../game/state';
import { MASTERY_TARGET } from './lessons';

export interface StudyView {
  open(script: Script): void;
  close(): void;
  prev(): void;
  next(): void;
  readonly isOpen: boolean;
}

/** Chart columns for short rows, so ya/yu/yo line up under a/u/o. */
const COLUMNS: Record<string, number[]> = { ya: [0, 2, 4] };

type View =
  | { kind: 'chart' }
  /** Browsing cards; `row` is set during a guided "Study row" walkthrough. */
  | { kind: 'card'; index: number; row: string | null }
  | { kind: 'done'; row: string };

/**
 * Learn mode: a kana chart, study cards with mnemonics, and a guided walkthrough
 * of one row that ends by offering to add it to practice.
 */
export function createStudy(root: HTMLElement, state: GameState, onPractice: (key: string) => void): StudyView {
  root.innerHTML = `
    <div class="sheet study" role="dialog" aria-modal="true" aria-labelledby="study-title">
      <header class="sheet-head">
        <h2 id="study-title"></h2>
        <button type="button" class="btn sheet-done">Done</button>
      </header>
      <div class="sheet-body study-body"></div>
    </div>
  `;
  const sheet = root.querySelector<HTMLElement>('.study')!;
  const title = root.querySelector<HTMLElement>('#study-title')!;
  const body = root.querySelector<HTMLElement>('.study-body')!;
  let script: Script = 'hiragana';
  let view: View = { kind: 'chart' };
  let isOpen = false;

  const deckKana = () => ALL_KANA.filter((k) => k.script === script);
  const rowKana = (row: string) => deckKana().filter((k) => k.group === row);
  /** Cards the Prev/Next buttons move through. */
  const sequence = (row: string | null) => (row ? rowKana(row) : deckKana());
  const label = (row: string) => GROUPS.find((g) => g.id === row)!.label;

  function dot(k: Kana): string {
    const right = state.stats[k.id]?.right ?? 0;
    const level = right >= MASTERY_TARGET ? 'done' : right > 0 ? 'some' : 'none';
    return `<i class="study-dot is-${level}" title="${right} correct"></i>`;
  }

  function chart(): string {
    return `
      <p class="sheet-hint">Tap a kana to see how to remember it, or study a row step by step.</p>
      ${deckFor(script)
        .groups.map((row) => {
          const cells: string[] = Array.from({ length: 5 }, () => '<span class="study-cell is-empty"></span>');
          rowKana(row).forEach((k, i) => {
            cells[COLUMNS[row]?.[i] ?? i] = `
              <button type="button" class="study-cell" data-kana="${k.id}">
                <span class="study-cell-kana" lang="ja">${k.kana}</span>
                <span class="study-cell-romaji">${k.romaji}</span>
                ${dot(k)}
              </button>`;
          });
          return `
            <section class="study-row">
              <div class="study-row-head">
                <h3>${label(row)} row</h3>
                <button type="button" class="btn btn-small" data-study-row="${row}">Study row</button>
              </div>
              <div class="study-grid">${cells.join('')}</div>
            </section>`;
        })
        .join('')}`;
  }

  function card(index: number, row: string | null): string {
    const list = sequence(row);
    const k = list[index]!;
    const m = mnemonicFor(k);
    const confuse = m.confuse
      .map((c) => ALL_KANA.find((x) => x.kana === c))
      .filter((x): x is Kana => !!x)
      .map((x) => `<span lang="ja">${x.kana}</span> ${x.romaji}`)
      .join(', ');
    const last = row !== null && index === list.length - 1;
    return `
      <div class="study-card" data-script="${script}">
        <p class="study-where">${row ? `Studying the ${label(row)} row` : `${label(k.group)} row`} · ${index + 1} / ${list.length}</p>
        <div class="study-big" lang="ja">${k.kana}</div>
        <p class="study-romaji">${k.romaji}</p>
        <ul class="study-tips">${m.tips.map((t) => `<li>${t}</li>`).join('')}</ul>
        ${confuse ? `<p class="study-confuse">Don’t mix up with: ${confuse}</p>` : ''}
      </div>
      <div class="study-nav">
        <button type="button" class="btn" data-nav="prev" ${index === 0 && row ? 'disabled' : ''}>← Prev</button>
        <button type="button" class="btn btn-small" data-nav="chart">Chart</button>
        <button type="button" class="btn" data-nav="next">${last ? 'Finish' : 'Next →'}</button>
      </div>`;
  }

  function done(row: string): string {
    const key = groupKey(script, row);
    const on = state.enabledGroups.includes(key);
    const kana = rowKana(row).map((k) => k.kana).join(' ');
    return `
      <div class="study-card study-done">
        <p class="study-where">Row complete</p>
        <div class="study-done-kana" lang="ja">${kana}</div>
        <p>${on ? 'This row is already in your practice. Go earn some sushi!' : 'Ready to practice these in the quiz?'}</p>
      </div>
      <div class="study-nav">
        <button type="button" class="btn" data-nav="chart">Back to chart</button>
        ${on ? '' : `<button type="button" class="btn btn-go" data-practice="${key}">Practice this row</button>`}
      </div>`;
  }

  function render(): void {
    const deck = deckFor(script);
    sheet.dataset.script = script;
    title.innerHTML = `Learn <span lang="ja">${deck.jpName}</span>`;
    body.innerHTML = view.kind === 'chart' ? chart() : view.kind === 'card' ? card(view.index, view.row) : done(view.row);
    body.scrollTop = 0;
    body.querySelector<HTMLElement>('[data-nav="next"], [data-practice]')?.focus({ preventScroll: true });
  }

  function move(step: 1 | -1): void {
    if (view.kind !== 'card') return;
    const length = sequence(view.row).length;
    const index = view.index + step;
    if (view.row) {
      // A guided walkthrough stops at both ends; the end is the "done" screen.
      if (index < 0) return;
      view = index >= length ? { kind: 'done', row: view.row } : { ...view, index };
    } else {
      view = { ...view, index: (index + length) % length };
    }
    render();
  }

  body.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!btn) return;
    if (btn.dataset.kana) {
      view = { kind: 'card', index: deckKana().findIndex((k) => k.id === btn.dataset.kana), row: null };
    } else if (btn.dataset.studyRow) {
      view = { kind: 'card', index: 0, row: btn.dataset.studyRow };
    } else if (btn.dataset.nav === 'prev' || btn.dataset.nav === 'next') {
      return move(btn.dataset.nav === 'next' ? 1 : -1);
    } else if (btn.dataset.nav === 'chart') {
      view = { kind: 'chart' };
    } else if (btn.dataset.practice) {
      onPractice(btn.dataset.practice);
      return close();
    } else return;
    render();
  });

  function close(): void {
    isOpen = false;
    root.classList.remove('is-open');
  }
  root.querySelector('.sheet-done')!.addEventListener('click', close);
  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });

  return {
    open(next) {
      script = next;
      view = { kind: 'chart' };
      render();
      isOpen = true;
      root.classList.add('is-open');
      root.querySelector<HTMLElement>('.sheet-done')!.focus();
    },
    close,
    prev: () => move(-1),
    next: () => move(1),
    get isOpen() {
      return isOpen;
    },
  };
}
