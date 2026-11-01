import './style.css';
import { cardsInGroups, DECK_IDS } from './data/cards';
import { deckFor } from './data/decks';
import { AWAY_CAP_S, AWAY_THRESHOLD_S, buy, catchUp, earn, passiveRate, rewardMods } from './game/economy';
import { checkDailyGoal, checkUnlocks, countCorrect } from './game/progress';
import { nextQuestion, type Question } from './game/quiz';
import { formatDuration, formatSushi, rewardBreakdown, rewardFor } from './game/scoring';
import { checkStamps } from './game/stamps';
import { activeGroups, defaultState, load, save, type GameState } from './game/state';
import { STORAGE_PREFIX } from './game/storage';
import { createGuide } from './ui/guide';
import { createHud } from './ui/hud';
import { createKeys } from './ui/keys';
import { createLessons } from './ui/lessons';
import { createMenu } from './ui/menu';
import { createQuiz } from './ui/quiz';
import { createShop } from './ui/shop';
import { createSound } from './ui/sound';
import { createStamps, sealHtml } from './ui/stamps';
import { createStats } from './ui/stats';
import { createStudy } from './ui/study';
import { createToast } from './ui/toast';
import { createWhatsNew } from './ui/whatsnew';

const NEXT_DELAY_CORRECT = 450;
const NEXT_DELAY_WRONG = 1600;
const TICK_MS = 250;
const AUTOSAVE_MS = 10_000;
/** Only greet the player for absences longer than this. */
const WELCOME_BACK_S = 60;
/** Hitting the daily goal pays at least this many seconds of kitchen output. */
const DAILY_GIFT_S = 120;

const state = load(localStorage);
const persist = () => save(localStorage, state);
const $ = (sel: string) => document.querySelector<HTMLElement>(sel)!;
// New players haven't answered anything yet.
const firstVisit = Object.keys(state.stats).length === 0;

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
  onStats: () => stats.open(),
  onStamps: () => stamps.open(),
  onWhatsNew: () => {
    whatsNew.open();
    hud.setUnseen(false);
  },
  onMenu: () => menu.open(),
});
// Earlier updates aren't news to brand-new players.
const whatsNew = createWhatsNew($('.whatsnew-backdrop'), firstVisit);
hud.setUnseen(whatsNew.hasUnseen);
const quiz = createQuiz($('.quiz'), state, answer);
const shop = createShop($('.shop'), $('.shop-backdrop'), (tool) => {
  if (!buy(state, tool)) return;
  sound.buy();
  shop.flashBought(tool.id);
  announce(progressNews());
  persist();
  refresh();
  // The shown reward depends on knives and fans.
  updateShownReward();
});
const lessons = createLessons($('.lessons'), $('.lessons-backdrop'), state, {
  onChange: () => {
    persist();
    // A new question is only needed if the current card was just turned off (or the lesson changed).
    if (answering) return;
    if (question && cardsInGroups(activeGroups(state)).some((k) => k.id === question!.target.id)) updateShownReward();
    else ask();
  },
  onQuizMode: () => {
    persist();
    if (!answering) ask();
  },
  onWriting: () => {
    persist();
    // Same question, redrawn in kana or kanji.
    if (question && !answering) quiz.show(question, ...shownReward(question));
  },
  onLearn: (deck) => study.open(deck),
});
const study = createStudy($('.study-backdrop'), state, (key) => lessons.enableRow(key));
const stats = createStats($('.stats-backdrop'), state, () => {
  // A lower goal may already be reached today.
  announce(checkDailyGoal(state, Date.now()) ? [goalReached(), ...progressNews()] : []);
  persist();
  refresh();
});
const stamps = createStamps($('.stamps-backdrop'), state);
const guide = createGuide($('.guide-backdrop'));
const keys = createKeys($('.keys-backdrop'));
const menu = createMenu($('.menu-backdrop'), state, sound, {
  onLoad: (incoming: GameState) => {
    // Replace in place so every view keeps its reference to `state`.
    // Importing doesn't pay out time away; that could double-count with another device.
    Object.assign(state, incoming, { lastTick: Date.now() });
    announce(progressNews());
    persist();
    refresh();
    lessons.rebuild();
    ask();
  },
  onGuide: () => guide.open(),
  onKeys: () => keys.open(),
  onDev: (action) => {
    if (action === 'unlock') {
      state.unlocked = [...DECK_IDS];
      lessons.rebuild();
    } else if (action === 'sushi') {
      earn(state, 10_000);
    } else {
      Object.assign(state, defaultState());
      for (const key of ['guide-seen', 'seen-update']) localStorage.removeItem(`${STORAGE_PREFIX}:${key}`);
      persist();
      location.reload();
      return;
    }
    announce(progressNews());
    persist();
    refresh();
  },
});
const toast = createToast($('.toast'));
/** Sheets that Escape closes. */
const sheets = [keys, guide, stats, stamps, menu, whatsNew];

function refresh(): void {
  hud.update(state);
  shop.update(state);
}

/** Shows several pieces of news in one toast, so none of them gets overwritten. */
function announce(news: string[]): void {
  if (news.length > 0) toast.show(news.join('<hr />'), 4000 + 2000 * news.length);
}

/** Opens lessons and awards stamps the player now qualifies for; returns what to announce. */
function progressNews(): string[] {
  const news: string[] = [];
  const opened = checkUnlocks(state);
  for (const deck of opened) news.push(`<strong>${deckFor(deck).name} is open!</strong> Find it in Lessons.`);
  if (opened.length > 0) lessons.rebuild();
  const earned = checkStamps(state, Date.now());
  if (earned.length === 1) {
    const s = earned[0]!;
    news.push(`${sealHtml(s)}<strong>Stamp earned: ${s.title}</strong><small>${s.bonus}</small>`);
  } else if (earned.length > 1) {
    news.push(`${sealHtml(earned[0]!)}<strong>${earned.length} stamps earned!</strong><small>Open Stamps to see them and their bonuses.</small>`);
  }
  if (earned.length > 0) sound.buy();
  return news;
}

/** Pays the daily-goal gift and describes it. */
function goalReached(): string {
  const gift = Math.max(passiveRate(state) * DAILY_GIFT_S, state.daily.goal * deckFor(state.activeDeck).multiplier);
  earn(state, gift);
  const days = state.dayStreak.count;
  return `<strong>Daily goal done!</strong> +${formatSushi(gift)} sushi. Day streak: ${days} ${days === 1 ? 'day' : 'days'}.`;
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
  const pool = cardsInGroups(activeGroups(state));
  question = nextQuestion(pool, state.stats, question?.target.id ?? null, state.quizMode);
  quiz.show(question, ...shownReward(question));
}

function answer(cardId: string): void {
  if (!question) return;
  answering = true;
  const now = Date.now();
  const target = question.target;
  const stat = (state.stats[target.id] ??= { right: 0, wrong: 0, lastSeen: 0, lastWrong: false });
  stat.lastSeen = now;
  const news: string[] = [];

  if (cardId === target.id) {
    stat.right++;
    stat.lastWrong = false;
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    const reward = rewardFor(target, state.streak, rewardMods(state));
    earn(state, reward);
    if (countCorrect(state, now)) news.push(goalReached());
    sound.correct();
    hud.celebrate(reward);
    quiz.reveal(cardId, reward);
    setTimeout(ask, NEXT_DELAY_CORRECT);
  } else {
    stat.wrong++;
    stat.lastWrong = true;
    // A miss halves the streak instead of wiping it out.
    state.streak = Math.floor(state.streak / 2);
    sound.wrong();
    hud.wobble();
    quiz.reveal(cardId, null);
    setTimeout(ask, NEXT_DELAY_WRONG);
  }
  announce([...news, ...progressNews()]);
  refresh();
  lessons.update();
  persist();
}

function tick(): void {
  const now = Date.now();
  const gap = (now - state.lastTick) / 1000;
  if (gap > 0 && gap <= AWAY_THRESHOLD_S && document.visibilityState === 'visible') state.playSeconds += gap;
  const { payouts, away } = catchUp(state, now);
  if (payouts.length > 0) shop.showPayouts(payouts);
  const news = progressNews();
  if (away && away.seconds >= WELCOME_BACK_S && away.gained >= 1) {
    const capped = away.seconds > away.countedSeconds ? ` (counted ${formatDuration(AWAY_CAP_S)})` : '';
    news.unshift(
      `<strong>Welcome back!</strong> While you were away for ${formatDuration(away.seconds)}${capped}, ` +
        `your kitchen made <strong>+${formatSushi(away.gained)} sushi</strong>.` +
        `<small>Idle speed while away: ${Math.round(away.efficiency * 100)}%, up to ${formatDuration(AWAY_CAP_S)}.</small>`,
    );
  }
  announce(news);
  if (news.length > 0) persist();
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
  const open = sheets.find((s) => s.isOpen);
  if (open) {
    if (key === 'escape') open.close();
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
  } else if (key === 't') {
    stats.open();
  } else if (key === 'h') {
    stamps.open();
  } else if (key === '?') {
    keys.open();
  } else if (key === 'm') {
    sound.set({ muted: !sound.settings.muted });
    toast.show(sound.settings.muted ? 'Sound off' : 'Sound on', 1200);
  } else if (quiz.inIntro && (key === 'enter' || key === ' ')) {
    // Stops the browser from also pressing whatever button gets focus next.
    e.preventDefault();
    quiz.confirm();
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
if (firstVisit) guide.openFirstTime();
setInterval(tick, TICK_MS);
setInterval(persist, AUTOSAVE_MS);
