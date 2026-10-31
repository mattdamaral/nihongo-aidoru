import './style.css';
import { kanaInGroups } from './data/kana';
import { AWAY_CAP_S, AWAY_EFFICIENCY, buy, catchUp, rewardMods } from './game/economy';
import { nextQuestion, type Question } from './game/quiz';
import { formatDuration, formatSushi, rewardBreakdown, rewardFor } from './game/scoring';
import { load, save, type GameState } from './game/state';
import { createHud } from './ui/hud';
import { createLessons } from './ui/lessons';
import { createMenu } from './ui/menu';
import { createQuiz } from './ui/quiz';
import { createShop } from './ui/shop';
import { createSound } from './ui/sound';
import { createStudy } from './ui/study';
import { createToast } from './ui/toast';
import { createWhatsNew } from './ui/whatsnew';

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
/** True between an answer and the next question appearing. */
let answering = false;

const sound = createSound();
const hud = createHud($('.topbar'), $('.stage'), {
  onLessons: () => {
    shop.close();
    lessons.toggle();
  },
  onShop: () => {
    lessons.close();
    shop.toggle();
  },
  onWhatsNew: () => {
    whatsNew.open();
    hud.setUnseen(false);
  },
  onMenu: () => menu.open(),
});
// Players who haven't answered anything yet are new, so earlier updates aren't news to them.
const whatsNew = createWhatsNew($('.whatsnew-backdrop'), Object.keys(state.stats).length === 0);
hud.setUnseen(whatsNew.hasUnseen);
const quiz = createQuiz($('.quiz'), answer);
const shop = createShop($('.shop'), $('.shop-backdrop'), (tool) => {
  if (!buy(state, tool)) return;
  sound.buy();
  shop.flashBought(tool.id);
  persist();
  refresh();
  // The shown reward depends on knives and fans.
  updateShownReward();
});
const lessons = createLessons($('.lessons'), $('.lessons-backdrop'), state, {
  onChange: () => {
    persist();
    // A new question is only needed if the current kana was just turned off.
    if (answering) return;
    if (question && kanaInGroups(state.enabledGroups).some((k) => k.id === question!.target.id)) updateShownReward();
    else ask();
  },
  onQuizMode: () => {
    persist();
    if (!answering) ask();
  },
  onLearn: (script) => study.open(script),
});
const study = createStudy($('.study-backdrop'), state, (key) => lessons.enableRow(key));
const menu = createMenu($('.menu-backdrop'), state, sound, (incoming: GameState) => {
  // Replace in place so every view keeps its reference to `state`.
  // Importing doesn't pay out time away; that could double-count with another device.
  Object.assign(state, incoming, { lastTick: Date.now() });
  persist();
  refresh();
  lessons.rebuild();
  ask();
});
const toast = createToast($('.toast'));

function refresh(): void {
  hud.update(state);
  shop.update(state);
}

/** Reward for the current question, assuming this answer extends the streak. */
function shownReward(q: Question): [number, string] {
  const mods = rewardMods(state);
  return [rewardFor(q.target, state.streak + 1, mods), rewardBreakdown(q.target, state.streak + 1, mods)];
}

function updateShownReward(): void {
  if (question) quiz.updateReward(...shownReward(question));
}

function ask(): void {
  answering = false;
  const pool = kanaInGroups(state.enabledGroups);
  question = nextQuestion(pool, state.stats, question?.target.id ?? null, state.quizMode);
  quiz.show(question, ...shownReward(question));
}

function answer(kanaId: string): void {
  if (!question) return;
  answering = true;
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
    sound.correct();
    hud.celebrate(reward);
    quiz.reveal(kanaId, reward);
    setTimeout(ask, NEXT_DELAY_CORRECT);
  } else {
    stat.wrong++;
    state.streak = 0;
    sound.wrong();
    hud.wobble();
    quiz.reveal(kanaId, null);
    setTimeout(ask, NEXT_DELAY_WRONG);
  }
  refresh();
  lessons.update();
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
  // Don't steal keys while the player types a save code or uses a slider.
  if ((e.target as HTMLElement).closest('textarea, input')) return;
  const key = e.key.toLowerCase();
  if (study.isOpen) {
    if (key === 'escape') study.close();
    else if (key === 'arrowleft') study.prev();
    else if (key === 'arrowright') study.next();
    return;
  }
  if (menu.isOpen) {
    if (key === 'escape') menu.close();
    return;
  }
  if (whatsNew.isOpen) {
    if (key === 'escape') whatsNew.close();
    return;
  }
  if (key === 'escape') {
    lessons.close();
    shop.close();
  } else if (key === 'b') {
    lessons.close();
    shop.toggle();
  } else if (key === 'l') {
    shop.close();
    lessons.toggle();
  } else if (key === 'm') {
    sound.set({ muted: !sound.settings.muted });
    toast.show(sound.settings.muted ? 'Sound off' : 'Sound on', 1200);
  } else {
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
