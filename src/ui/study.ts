import { ALL_CARDS, groupKey, japanese, type Card, type DeckId } from '../data/cards';
import { deckFor } from '../data/decks';
import { ALL_KANA, isScript } from '../data/kana';
import { mnemonicFor } from '../data/mnemonics';
import type { GameState } from '../game/state';
import { MASTERY_TARGET } from './lessons';
import { sizeClass } from './quiz';

export interface StudyView {
  open(deck: DeckId): void;
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
 * Learn mode: a kana chart (or a list, for numbers and greetings), study cards
 * with mnemonics or notes, and a guided walkthrough of one row that ends by
 * offering to add it to practice.
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
  let deckId: DeckId = 'hiragana';
  let view: View = { kind: 'chart' };
  let isOpen = false;

  const deckCards = () => ALL_CARDS.filter((c) => c.deck === deckId);
  const rowCards = (row: string) => deckCards().filter((c) => c.group === row);
  /** Cards the Prev/Next buttons move through. */
  const sequence = (row: string | null) => (row ? rowCards(row) : deckCards());
  const label = (row: string) => deckFor(deckId).groups.find((g) => g.id === row)!.label;
  /** "ka row" for kana, the plain label ("20–29", "Time of day") otherwise. */
  const rowName = (row: string) => (isScript(deckId) ? `the ${label(row)} row` : label(row));
  const jp = (c: Card) => japanese(c, state.useKanji);
  /** The reading under a card: its kana too when kanji are shown. */
  const reading = (c: Card) => (jp(c) === c.kana ? c.romaji : `<span lang="ja">${c.kana}</span> · ${c.romaji}`);

  function dot(c: Card): string {
    const right = state.stats[c.id]?.right ?? 0;
    const level = right >= MASTERY_TARGET ? 'done' : right > 0 ? 'some' : 'none';
    return `<i class="study-dot is-${level}" title="${right} correct"></i>`;
  }

  function cells(row: string): string {
    if (!isScript(deckId)) {
      return `<div class="study-list">${rowCards(row)
        .map(
          (c) => `
          <button type="button" class="study-item" data-card="${c.id}">
            <span class="study-item-answer">${c.answer}</span>
            <span class="study-item-kana" lang="ja">${jp(c)}</span>
            <span class="study-item-romaji">${reading(c)}</span>
            ${dot(c)}
          </button>`,
        )
        .join('')}</div>`;
    }
    const grid: string[] = Array.from({ length: 5 }, () => '<span class="study-cell is-empty"></span>');
    rowCards(row).forEach((c, i) => {
      grid[COLUMNS[row]?.[i] ?? i] = `
        <button type="button" class="study-cell" data-card="${c.id}">
          <span class="study-cell-kana" lang="ja">${c.kana}</span>
          <span class="study-cell-romaji">${c.romaji}</span>
          ${dot(c)}
        </button>`;
    });
    return `<div class="study-grid">${grid.join('')}</div>`;
  }

  function chart(): string {
    const what = isScript(deckId) ? 'a kana to see how to remember it' : 'a card to see how it’s used';
    return `
      <p class="sheet-hint">Tap ${what}, or study a row step by step.</p>
      ${deckFor(deckId)
        .groups.map(
          (g) => `
          <section class="study-row">
            <div class="study-row-head">
              <h3>${isScript(deckId) ? `${g.label} row` : g.label}</h3>
              <button type="button" class="btn btn-small" data-study-row="${g.id}">Study row</button>
            </div>
            ${cells(g.id)}
          </section>`,
        )
        .join('')}`;
  }

  function card(index: number, row: string | null): string {
    const list = sequence(row);
    const c = list[index]!;
    const m = isScript(deckId) ? mnemonicFor(c) : { tips: c.notes ?? [], confuse: [] };
    const confuse = m.confuse
      .map((k) => ALL_KANA.find((x) => x.kana === k))
      .filter((x): x is Card => !!x)
      .map((x) => `<span lang="ja">${x.kana}</span> ${x.romaji}`)
      .join(', ');
    const last = row !== null && index === list.length - 1;
    // Mention the kanji unless it's already the big text.
    const kanji = c.kanji && jp(c) !== c.kanji ? ` · <span lang="ja">${c.kanji}</span>` : '';
    const meaning = c.answer === c.romaji ? '' : `<p class="study-answer">${c.answer}${kanji}</p>`;
    return `
      <div class="study-card" data-script="${deckId}">
        <p class="study-where">${row ? `Studying ${rowName(row)}` : label(c.group)} · ${index + 1} / ${list.length}</p>
        <div class="study-big${sizeClass(jp(c))}" lang="ja">${jp(c)}</div>
        <p class="study-romaji">${reading(c)}</p>
        ${meaning}
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
    const key = groupKey(deckId, row);
    const on = state.enabledGroups.includes(key);
    // Whole rows of numbers or phrases are too long to list; show the row's name instead.
    const summary = isScript(deckId) ? rowCards(row).map((c) => c.kana).join(' ') : label(row);
    return `
      <div class="study-card study-done">
        <p class="study-where">Row complete</p>
        <div class="study-done-kana" lang="${isScript(deckId) ? 'ja' : 'en'}">${summary}</div>
        <p>${on ? 'This row is already in your practice. Go earn some sushi!' : 'Ready to practice these in the quiz?'}</p>
      </div>
      <div class="study-nav">
        <button type="button" class="btn" data-nav="chart">Back to chart</button>
        ${on ? '' : `<button type="button" class="btn btn-go" data-practice="${key}">Practice this row</button>`}
      </div>`;
  }

  function render(): void {
    const deck = deckFor(deckId);
    sheet.dataset.script = deckId;
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
    if (btn.dataset.card) {
      view = { kind: 'card', index: deckCards().findIndex((c) => c.id === btn.dataset.card), row: null };
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
      deckId = next;
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
