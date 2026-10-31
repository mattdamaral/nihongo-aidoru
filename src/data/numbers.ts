import type { Card, CardGroup } from './cards';

/** [kana, romaji, kanji] for 1–9, using the usual counting readings. */
const DIGITS: [string, string, string][] = [
  ['いち', 'ichi', '一'],
  ['に', 'ni', '二'],
  ['さん', 'san', '三'],
  ['よん', 'yon', '四'],
  ['ご', 'go', '五'],
  ['ろく', 'roku', '六'],
  ['なな', 'nana', '七'],
  ['はち', 'hachi', '八'],
  ['きゅう', 'kyuu', '九'],
];

const DIGIT_NOTES = [
  'Sounds like “itchy”: one itchy finger.',
  'Sounds like “knee”: you have two knees.',
  'Sounds like “sun”: three rays of sunshine.',
  'Also read し (shi), but よん is safer: し sounds like the word for death.',
  '“Go!”: five fingers up, ready, set, go!',
  'Sounds like “rock”: six rocks in a pile.',
  'Also read しち (shichi); なな is clearer, since しち sounds a lot like いち.',
  'Sounds like a sneeze: “ha-CHI!”',
  'Also read く (ku), but く sounds like the word for suffering, so きゅう is used for counting.',
];

/** Other readings heard in the teens: 14, 17 and 19. */
const TEEN_ALTERNATIVES: Record<number, string> = {
  4: 'You may also hear じゅうし, but じゅうよん is the usual choice.',
  7: 'You may also hear じゅうしち.',
  9: 'You may also hear じゅうく.',
};

// Hundreds and thousands have sound changes, so they're written out rather than built.
const HUNDREDS: [string, string][] = [
  ['ひゃく', 'hyaku'],
  ['にひゃく', 'nihyaku'],
  ['さんびゃく', 'sanbyaku'],
  ['よんひゃく', 'yonhyaku'],
  ['ごひゃく', 'gohyaku'],
  ['ろっぴゃく', 'roppyaku'],
  ['ななひゃく', 'nanahyaku'],
  ['はっぴゃく', 'happyaku'],
  ['きゅうひゃく', 'kyuuhyaku'],
];

const THOUSANDS: [string, string][] = [
  ['せん', 'sen'],
  ['にせん', 'nisen'],
  ['さんぜん', 'sanzen'],
  ['よんせん', 'yonsen'],
  ['ごせん', 'gosen'],
  ['ろくせん', 'rokusen'],
  ['ななせん', 'nanasen'],
  ['はっせん', 'hassen'],
  ['きゅうせん', 'kyuusen'],
];

const SOUND_CHANGES: Record<number, string> = {
  300: 'Sound change: after さん, ひゃく becomes びゃく → さんびゃく.',
  600: 'Sound change: ろく + ひゃく shrinks to ろっぴゃく (a small っ, and ひゃく → ぴゃく).',
  800: 'Sound change: はち + ひゃく shrinks to はっぴゃく.',
  3000: 'Sound change: after さん, せん becomes ぜん → さんぜん.',
  8000: 'Sound change: はち + せん shrinks to はっせん.',
};

const BIG: [n: number, kana: string, romaji: string, kanji: string, note: string][] = [
  [100_000, 'じゅうまん', 'juuman', '十万', 'There’s no word for “hundred thousand”: it’s 10 × 万 = じゅうまん.'],
  [1_000_000, 'ひゃくまん', 'hyakuman', '百万', 'A million is 100 × 万 = ひゃくまん.'],
  [10_000_000, 'せんまん', 'senman', '千万', 'Ten million is 1,000 × 万 = せんまん (also いっせんまん).'],
  [100_000_000, 'いちおく', 'ichioku', '一億', 'A new unit: 億 (oku) is 10,000 × 万, so a hundred million is いちおく, “one oku”.'],
];

const format = (n: number) => n.toLocaleString('en-US');

export const NUMBER_GROUPS: CardGroup[] = [
  { id: 'n1', label: '1–9', preview: 'いち' },
  ...DIGITS.map(([kana], i) => {
    const t = (i + 1) * 10;
    return { id: `n${t}`, label: `${t}–${t + 9}`, preview: i === 0 ? 'じゅう' : `${kana}じゅう` };
  }),
  { id: 'n100', label: '100–900', preview: 'ひゃく' },
  { id: 'n1000', label: '1,000–9,000', preview: 'せん' },
  { id: 'n10000', label: '10,000–90,000', preview: 'まん' },
  { id: 'big', label: '100,000+', preview: 'おく' },
];

function build(): Card[] {
  const out: Card[] = [];
  const add = (n: number, group: string, kana: string, romaji: string, kanji: string, notes: string[]) =>
    out.push({ id: `numbers:${n}`, deck: 'numbers', group, kana, romaji, answer: format(n), kanji, notes });

  DIGITS.forEach(([kana, romaji, kanji], i) => add(i + 1, 'n1', kana, romaji, kanji, [DIGIT_NOTES[i]!]));

  // 10–99: (digit ×) じゅう, then the unit digit. No sound changes.
  DIGITS.forEach(([dk, dr, dj], ti) => {
    const t = ti + 1;
    const group = `n${t * 10}`;
    const tens = t === 1 ? ['じゅう', 'juu', '十'] : [`${dk}じゅう`, `${dr}juu`, `${dj}十`];
    const [tk, tr, tj] = tens as [string, string, string];
    add(t * 10, group, tk, tr, tj, [
      t === 1 ? 'じゅう is ten. 11–19 are just じゅう + the digit: 11 is じゅういち.' : `${dk} (${t}) × じゅう (10)`,
    ]);
    DIGITS.forEach(([uk, ur, uj], ui) => {
      const u = ui + 1;
      const alt = t === 1 ? TEEN_ALTERNATIVES[u] : undefined;
      add(t * 10 + u, group, tk + uk, tr + ur, tj + uj, [`${tk} (${t * 10}) + ${uk} (${u})`, ...(alt ? [alt] : [])]);
    });
  });

  HUNDREDS.forEach(([kana, romaji], i) => {
    const n = (i + 1) * 100;
    const [dk, , dj] = DIGITS[i]!;
    const how = i === 0 ? 'Just ひゃく: no いち in front, like じゅう for 10.' : `${dk} (${i + 1}) × ひゃく (100)`;
    add(n, 'n100', kana, romaji, i === 0 ? '百' : `${dj}百`, [how, ...(SOUND_CHANGES[n] ? [SOUND_CHANGES[n]!] : [])]);
  });

  THOUSANDS.forEach(([kana, romaji], i) => {
    const n = (i + 1) * 1000;
    const [dk, , dj] = DIGITS[i]!;
    const how = i === 0 ? 'Just せん: no いち in front, like ひゃく for 100.' : `${dk} (${i + 1}) × せん (1,000)`;
    add(n, 'n1000', kana, romaji, i === 0 ? '千' : `${dj}千`, [how, ...(SOUND_CHANGES[n] ? [SOUND_CHANGES[n]!] : [])]);
  });

  // 万 is where the structure changes: Japanese groups big numbers by 10,000, not 1,000.
  DIGITS.forEach(([dk, dr, dj], i) => {
    const how =
      i === 0
        ? 'Japanese counts big numbers in 万 (man, 10,000), not in thousands. 10,000 is いちまん, “one man”; unlike 100 and 1,000, it keeps the いち.'
        : `${dk} (${i + 1}) × まん (10,000): ${format((i + 1) * 10)} thousand is ${i + 1} man.`;
    add((i + 1) * 10_000, 'n10000', `${dk}まん`, `${dr}man`, `${dj}万`, [how]);
  });

  for (const [n, kana, romaji, kanji, note] of BIG) add(n, 'big', kana, romaji, kanji, [note]);
  return out;
}

export const NUMBERS: Card[] = build();
