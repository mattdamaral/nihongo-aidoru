import { deckFor } from '../data/decks';
import type { Question } from '../game/quiz';
import { formatReward } from '../game/scoring';

export interface QuizView {
  /** `detail` explains the reward (shown as a tooltip). */
  show(question: Question, reward: number, detail: string): void;
  /** Marks the chosen and the correct answers and shows a short explanation. */
  reveal(chosenId: string, reward: number | null): void;
  /** Picks the answer at `index` (0–3), as if it was clicked. */
  choose(index: number): void;
  /** Updates the "+X sushi" label, e.g. after buying a tool. */
  updateReward(reward: number, detail: string): void;
}

const KEYS = ['1', '2', '3', '4'];

export function createQuiz(root: HTMLElement, onAnswer: (kanaId: string) => void): QuizView {
  root.innerHTML = `
    <div class="quiz-head">
      <span class="quiz-script"></span>
      <span class="quiz-worth"></span>
    </div>
    <p class="quiz-label">Pick the kana for</p>
    <p class="quiz-prompt" lang="ja-Latn"></p>
    <div class="choices"></div>
    <p class="quiz-feedback" aria-live="polite"></p>
  `;
  const scriptEl = root.querySelector<HTMLElement>('.quiz-script')!;
  const worthEl = root.querySelector<HTMLElement>('.quiz-worth')!;
  const promptEl = root.querySelector<HTMLElement>('.quiz-prompt')!;
  const choicesEl = root.querySelector<HTMLElement>('.choices')!;
  const feedbackEl = root.querySelector<HTMLElement>('.quiz-feedback')!;

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
      const deck = deckFor(question.target.script);
      scriptEl.textContent = `${deck.name} ${deck.jpName}`;
      scriptEl.dataset.script = deck.id;
      setWorth(reward, detail);
      promptEl.textContent = question.target.romaji;
      feedbackEl.textContent = '';
      feedbackEl.className = 'quiz-feedback';
      choicesEl.innerHTML = question.choices
        .map(
          (k, i) => `
          <button type="button" class="choice" data-id="${k.id}">
            <kbd>${KEYS[i]}</kbd><span class="choice-kana" lang="ja">${k.kana}</span>
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
        feedbackEl.textContent = `${target.kana} = ${target.romaji}  ${formatReward(reward)}`;
        feedbackEl.classList.add('is-good');
      } else if (chosen) {
        feedbackEl.innerHTML = `<span lang="ja">${chosen.kana}</span> is ${chosen.romaji} · <span lang="ja">${target.kana}</span> is ${target.romaji}`;
        feedbackEl.classList.add('is-bad');
      }
    },
    choose(index) {
      const btn = choicesEl.querySelectorAll<HTMLButtonElement>('.choice')[index];
      if (btn?.dataset.id && !locked) onAnswer(btn.dataset.id);
    },
    updateReward(reward, detail) {
      if (!locked) setWorth(reward, detail);
    },
  };
}
