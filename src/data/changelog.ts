export interface Update {
  /** Stable id; the newest one seen is remembered to show the "new" dot. */
  id: string;
  /** ISO date, e.g. "2026-10-31". */
  date: string;
  title: string;
  items: string[];
}

/** Player-facing update notes, newest first. Add a new entry at the top for each release. */
export const UPDATES: Update[] = [
  {
    id: '2026-11-01-voice',
    date: '2026-11-01',
    title: 'Hear it: Japanese voice',
    items: [
      'Every kana, number and greeting is now spoken by a natural Japanese voice (VOICEVOX:玄野武宏).',
      'Speaker buttons on questions, new-card intros and Learn cards; press R to hear it again.',
      'New Listen quiz: hear the Japanese, then pick the kana, number or meaning.',
      'Voice volume in the menu. The clips work offline too.',
    ],
  },
  {
    id: '2026-11-01-stamps',
    date: '2026-11-01',
    title: 'Stamps, daily goals & more',
    items: [
      'Hanko stamps: earn stamps for answers, streaks, sushi, mastered rows, tools and daily goals. Each one gives a lasting bonus, and most kinds never run out.',
      'Daily goal (20, 50 or 100 correct answers) with a day streak and a sushi gift, shown in the top bar.',
      'New Stats screen: today’s goal, totals, progress in each lesson and the cards you miss most.',
      'Lessons now open one by one: master enough of a lesson to unlock the next. Lessons you already played stay open.',
      'New kana and words are introduced before you’re quizzed on them, a few at a time.',
      'Wrong choices get trickier as you improve: look-alikes like ね / れ / わ show up once you know a card.',
      'A miss now halves your streak instead of resetting it.',
      'Five new kitchen tools, from a deba knife to your own itamae chef.',
      'Buy max: buy as many of a tool as your sushi allows, in one click.',
      'How to play guide, and a keyboard shortcuts list (press ?).',
      'An Ideas page with what might come next (Menu → Ideas & plans).',
    ],
  },
  {
    id: '2026-10-31-numbers-greetings',
    date: '2026-10-31',
    title: 'Numbers & greetings',
    items: [
      'New Numbers lesson (×2 sushi): 1–9, every ten up to 99, then hundreds, thousands, 万 (10,000) and beyond, with tips for the tricky ones like さんびゃく and はっせん.',
      'New Greetings lesson (×3 sushi): 25 everyday phrases in 5 groups, from おはようございます to いただきます.',
      'Learn mode works for both, with notes on how each number is built and when to use each phrase.',
      'One lesson at a time: pick a lesson to play it on its own. Each lesson remembers the rows you picked.',
      'New Writing switch (かな / 漢字) for numbers and greetings: see words in kanji, the way they’re usually written.',
      'Questions you just got wrong now come back sooner, until you get them right.',
    ],
  },
  {
    id: '2026-10-31-quiz-both-ways',
    date: '2026-10-31',
    title: 'Quiz both ways',
    items: [
      'New quiz switch in Lessons: see the kana and pick the romaji (あ → a), or Mixed for a bit of both.',
      'This “What’s new” panel, so you can see what changed in each update.',
    ],
  },
  {
    id: '2026-10-29-lessons',
    date: '2026-10-29',
    title: 'Lessons & Learn mode',
    items: [
      'Lessons panel to pick which kana rows to practice, with a mastery bar for each row.',
      'Learn mode: a kana chart and study cards with memory tricks and look-alike warnings.',
      'Row bonus: +5% sushi for every row you practice after the first.',
      'Soft sound effects, with mute (M) and volume in the menu.',
    ],
  },
  {
    id: '2026-10-27-launch',
    date: '2026-10-27',
    title: 'Opening day',
    items: [
      'Hiragana and katakana quiz that brings back the kana you miss most.',
      'Streak bonus for answers in a row.',
      'Kitchen shop with 5 tools that make sushi on their own or boost your answers.',
      'Earn sushi while away, and move your game between devices with a save code.',
      'Installable as an app, and playable offline.',
    ],
  },
];
