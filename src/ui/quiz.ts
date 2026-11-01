import { japanese, type Card } from '../data/cards';
import { deckFor } from '../data/decks';
import { ALL_KANA, isScript } from '../data/kana';
import { mnemonicFor } from '../data/mnemonics';
import type { Question } from '../game/quiz';
import { formatReward } from '../game/scoring';
import type { GameState } from '../game/state';

/** Extra class that shrinks long text (greetings, big numbers) so it fits. */
export const sizeClass = (text: string) => (text.length > 9 ? ' is-longer' : text.length > 4 ? ' is-long' : '');

/**
 * "か = ka", "よんじゅうに (yonjuuni) = 42", or with kanji on, "四十二 (よんじゅうに) = 42":
 * the reading in brackets is whatever the shown text doesn't already say.
 */
function explain(c: Card, useKanji: boolean): string {
  const shown = japanese(c, useKanji);
  const reading = shown !== c.kana ? `<span lang="ja">${c.kana}</span>` : c.answer !== c.romaji ? c.romaji : '';
  return `<span lang="ja">${shown}</span>${reading ? ` (${reading})` : ''} = ${c.answer}`;
}

/** The intro card for a card seen for the first time: both sides, a tip and its look-alikes. */
function intro(c: Card, useKanji: boolean): string {
  const shown = japanese(c, useKanji);
  const m = isScript(c.deck) ? mnemonicFor(c) : { tips: c.notes ?? [], confuse: [] };
  const confuse = m.confuse
    .map((k) => ALL_KANA.find((x) => x.kana === k && x.deck === c.deck))
    .filter((x): x is Card => !!x)
    .map((x) => `<span lang="ja">${x.kana}</span> ${x.romaji}`)
    .join(', ');
  const reading = shown !== c.kana ? `<span lang="ja">${c.kana}</span> · ${c.romaji}` : c.romaji;
  return `
    <div class="intro">
      <p class="intro-tag">New!</p>
      <div class="intro-big${sizeClass(shown)}" lang="ja">${shown}</div>
      <p class="intro-reading">${reading}</p>
      ${c.answer !== c.romaji ? `<p class="intro-answer">${c.answer}</p>` : ''}
      ${m.tips[0] ? `<p class="intro-tip">${m.tips[0]}</p>` : ''}
      ${confuse ? `<p class="intro-confuse">Don’t mix up with: ${confuse}</p>` : ''}
      <button type="button" class="btn btn-go intro-go"><kbd>Enter</kbd> Got it</button>
    </div>`;
}

export interface QuizView {
  /** `detail` explains the reward (shown as a tooltip). New cards are introduced first. */
  show(question: Question, reward: number, detail: string): void;
  /** True while a new card's intro is showing instead of the question. */
  readonly inIntro: boolean;
  /** Leaves the intro and asks the question. */
  confirm(): void;
  /** Marks the chosen and the correct answers and shows a short explanation. */
  reveal(chosenId: string, reward: number | null): void;
  /** Picks the answer at `index` (0–3), as if it was clicked. */
  choose(index: number): void;
  /** Updates the "+X sushi" label, e.g. after buying a tool. */
  updateReward(reward: number, detail: string): void;
}

const KEYS = ['1', '2', '3', '4'];

export function createQuiz(root: HTMLElement, state: GameState, onAnswer: (cardId: string) => void): QuizView {
  root.innerHTML = `
    <div class="quiz-intro" hidden></div>
    <div class="quiz-head">
      <span class="quiz-script"></span>
      <span class="quiz-worth"></span>
    </div>
    <p class="quiz-label"></p>
    <p class="quiz-prompt" lang="ja-Latn"></p>
    <div class="choices"></div>
    <p class="quiz-feedback" aria-live="polite"></p>
  `;
  const scriptEl = root.querySelector<HTMLElement>('.quiz-script')!;
  const worthEl = root.querySelector<HTMLElement>('.quiz-worth')!;
  const labelEl = root.querySelector<HTMLElement>('.quiz-label')!;
  const promptEl = root.querySelector<HTMLElement>('.quiz-prompt')!;
  const choicesEl = root.querySelector<HTMLElement>('.choices')!;
  const feedbackEl = root.querySelector<HTMLElement>('.quiz-feedback')!;
  const introEl = root.querySelector<HTMLElement>('.quiz-intro')!;
  const questionEls = [...root.children].filter((el) => el !== introEl) as HTMLElement[];
  let inIntro = false;
  const setIntro = (on: boolean) => {
    inIntro = on;
    introEl.hidden = !on;
    for (const el of questionEls) el.hidden = on;
  };
  introEl.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.intro-go')) confirm();
  });
  function confirm(): void {
    if (!inIntro) return;
    // Redrawing this question later (e.g. the writing switch) shouldn't introduce it again.
    if (current) current.isNew = false;
    setIntro(false);
    choicesEl.querySelector<HTMLElement>('.choice')?.focus({ preventScroll: true });
  }

  let current: Question | null = null;
  let locked = false;
  const setWorth = (reward: number, detail: string) => {
    worthEl.textContent = `${formatReward(reward)} sushi`;
    worthEl.title = detail;
  };

  choicesEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.choice');
    if (btn?.dataset.id && !locked) onAnswer(btn.dataset.id);
  });

  return {
    show(question, reward, detail) {
      current = question;
      locked = false;
      const deck = deckFor(question.target.deck);
      scriptEl.textContent = `${deck.name} ${deck.jpName}`;
      scriptEl.dataset.script = deck.id;
      setWorth(reward, detail);
      const pickKana = question.direction === 'pick-kana';
      const jp = (c: Card) => japanese(c, state.useKanji);
      const prompt = pickKana ? question.target.answer : jp(question.target);
      labelEl.textContent = deck.labels[question.direction];
      promptEl.textContent = prompt;
      promptEl.className = `quiz-prompt${sizeClass(prompt)}`;
      // Kana decks' answers are romaji; numbers and greetings answer in plain English.
      promptEl.lang = pickKana ? (isScript(deck.id) ? 'ja-Latn' : 'en') : 'ja';
      feedbackEl.textContent = '';
      feedbackEl.className = 'quiz-feedback';
      if (question.isNew) introEl.innerHTML = intro(question.target, state.useKanji);
      setIntro(question.isNew);
      choicesEl.innerHTML = question.choices
        .map(
          (c, i) => `
          <button type="button" class="choice" data-id="${c.id}">
            <kbd>${KEYS[i]}</kbd>${
              pickKana
                ? `<span class="choice-kana${sizeClass(jp(c))}" lang="ja">${jp(c)}</span>`
                : `<span class="choice-romaji${sizeClass(c.answer)}">${c.answer}</span>`
            }
          </button>`,
        )
        .join('');
    },
    reveal(chosenId, reward) {
      if (!current) return;
      locked = true;
      const target = current.target;
      const chosen = current.choices.find((k) => k.id === chosenId);
      for (const btn of choicesEl.querySelectorAll<HTMLButtonElement>('.choice')) {
        btn.disabled = true;
        if (btn.dataset.id === target.id) btn.classList.add('is-correct');
        else if (btn.dataset.id === chosenId) btn.classList.add('is-wrong');
      }
      if (reward !== null) {
        feedbackEl.innerHTML = `${explain(target, state.useKanji)} &nbsp;${formatReward(reward)}`;
        feedbackEl.classList.add('is-good');
      } else if (chosen) {
        feedbackEl.innerHTML = `${explain(chosen, state.useKanji)} · ${explain(target, state.useKanji)}`;
        feedbackEl.classList.add('is-bad');
      }
    },
    get inIntro() {
      return inIntro;
    },
    confirm,
    choose(index) {
      if (inIntro) return confirm();
      const btn = choicesEl.querySelectorAll<HTMLButtonElement>('.choice')[index];
      if (btn?.dataset.id && !locked) onAnswer(btn.dataset.id);
    },
    updateReward(reward, detail) {
      if (!locked) setWorth(reward, detail);
    },
  };
}
