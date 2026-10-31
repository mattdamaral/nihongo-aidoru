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
