import './style.css';
import { kanaInGroups } from './data/kana';
import { AWAY_CAP_S, AWAY_EFFICIENCY, buy, catchUp, rewardMods } from './game/economy';
import { nextQuestion, type Question } from './game/quiz';
import { formatDuration, formatSushi, rewardFor } from './game/scoring';
import { load, save, type GameState } from './game/state';
import { createHud } from './ui/hud';
import { createLessons } from './ui/lessons';
import { createMenu } from './ui/menu';
import { createQuiz } from './ui/quiz';
import { createShop } from './ui/shop';
import { createToast } from './ui/toast';

const NEXT_DELAY_CORRECT = 450;
const NEXT_DELAY_WRONG = 1600;
const TICK_MS = 250;
const AUTOSAVE_MS = 10_000;
/** Only greet the player for absences longer than this. */
const WELCOME_BACK_S = 60;

const state = load(localStorage);
const persist = () => save(localStorage, state);
const $ = (sel: string) => document.querySelector<HTMLElement>(sel)!;

let question: Question | null = null;
let groupsChanged = false;

const hud = createHud($('.topbar'), $('.stage'), {
  onLessons: () => lessons.open(),
  onShop: () => shop.toggle(),
  onMenu: () => menu.open(),
});
const quiz = createQuiz($('.quiz'), answer);
const shop = createShop($('.shop'), $('.shop-backdrop'), (tool) => {
  if (!buy(state, tool)) return;
  shop.flashBought(tool.id);
  persist();
  refresh();
  // The shown reward depends on knives and fans.
  if (question) quiz.updateReward(rewardFor(question.target, state.streak + 1, rewardMods(state)));
});
const lessons = createLessons(
  $('.lessons-backdrop'),
  state,
  () => {
    groupsChanged = true;
    persist();
  },
  () => {
    if (groupsChanged) {
      groupsChanged = false;
      ask();
    }
  },
);
const menu = createMenu($('.menu-backdrop'), state, (incoming: GameState) => {
  // Replace in place so every view keeps its reference to `state`.
  // Importing doesn't pay out time away; that could double-count with another device.
  Object.assign(state, incoming, { lastTick: Date.now() });
  persist();
  refresh();
  ask();
});
const toast = createToast($('.toast'));

function refresh(): void {
  hud.update(state);
  shop.update(state);
}

function ask(): void {
  const pool = kanaInGroups(state.enabledGroups);
  question = nextQuestion(pool, state.stats, question?.target.id ?? null);
  // Shown reward assumes this answer extends the streak.
  quiz.show(question, rewardFor(question.target, state.streak + 1, rewardMods(state)));
}

function answer(kanaId: string): void {
  if (!question) return;
  const target = question.target;
  const stat = (state.stats[target.id] ??= { right: 0, wrong: 0, lastSeen: 0 });
  stat.lastSeen = Date.now();

  if (kanaId === target.id) {
    stat.right++;
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    const reward = rewardFor(target, state.streak, rewardMods(state));
    state.sushi += reward;
    state.totalEarned += reward;
    hud.celebrate(reward);
    quiz.reveal(kanaId, reward);
    setTimeout(ask, NEXT_DELAY_CORRECT);
  } else {
    stat.wrong++;
    state.streak = 0;
    hud.wobble();
    quiz.reveal(kanaId, null);
    setTimeout(ask, NEXT_DELAY_WRONG);
  }
  refresh();
  persist();
}

function tick(): void {
  const { payouts, away } = catchUp(state, Date.now());
  if (payouts.length > 0) shop.showPayouts(payouts);
  if (away && away.seconds >= WELCOME_BACK_S && away.gained >= 1) {
    const capped = away.seconds > away.countedSeconds ? ` (counted ${formatDuration(AWAY_CAP_S)})` : '';
    toast.show(
      `<strong>Welcome back!</strong> While you were away for ${formatDuration(away.seconds)}${capped}, ` +
        `your kitchen made <strong>+${formatSushi(away.gained)} sushi</strong>.` +
        `<small>Idle speed while away: ${AWAY_EFFICIENCY * 100}%, up to ${formatDuration(AWAY_CAP_S)}.</small>`,
    );
    persist();
  }
  refresh();
}

const KEY_TO_INDEX: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, s: 1, d: 2, f: 3 };

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  // Don't steal keys while the player types a save code.
  if ((e.target as HTMLElement).closest('textarea, input')) return;
  const key = e.key.toLowerCase();
  if (menu.isOpen) {
    if (key === 'escape') menu.close();
    return;
  }
  if (lessons.isOpen) {
    if (key === 'escape' || key === 'l') lessons.close();
    return;
  }
  if (key === 'escape' && shop.isOpen) shop.close();
  else if (key === 'b') shop.toggle();
  else if (key === 'l') lessons.open();
  else {
    const index = KEY_TO_INDEX[key];
    if (index !== undefined) quiz.choose(index);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') persist();
  else tick();
});

tick();
ask();
setInterval(tick, TICK_MS);
setInterval(persist, AUTOSAVE_MS);
