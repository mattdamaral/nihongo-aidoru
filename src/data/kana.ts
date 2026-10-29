export type Script = 'hiragana' | 'katakana';

export interface Kana {
  /** Unique id, e.g. "hiragana:ka". */
  id: string;
  kana: string;
  /** Hepburn romanization shown as the quiz prompt. */
  romaji: string;
  script: Script;
  /** Row id, e.g. "ka". Combined with script it forms a group key. */
  group: string;
}

export interface KanaGroup {
  id: string;
  label: string;
  /** Each entry is [romaji, hiragana, katakana]. */
  rows: [string, string, string][];
}

// Gojūon rows plus dakuten/handakuten rows. Yōon (きゃ…) comes later.
export const GROUPS: KanaGroup[] = [
  { id: 'a', label: 'a', rows: [['a', 'あ', 'ア'], ['i', 'い', 'イ'], ['u', 'う', 'ウ'], ['e', 'え', 'エ'], ['o', 'お', 'オ']] },
  { id: 'ka', label: 'ka', rows: [['ka', 'か', 'カ'], ['ki', 'き', 'キ'], ['ku', 'く', 'ク'], ['ke', 'け', 'ケ'], ['ko', 'こ', 'コ']] },
  { id: 'sa', label: 'sa', rows: [['sa', 'さ', 'サ'], ['shi', 'し', 'シ'], ['su', 'す', 'ス'], ['se', 'せ', 'セ'], ['so', 'そ', 'ソ']] },
  { id: 'ta', label: 'ta', rows: [['ta', 'た', 'タ'], ['chi', 'ち', 'チ'], ['tsu', 'つ', 'ツ'], ['te', 'て', 'テ'], ['to', 'と', 'ト']] },
  { id: 'na', label: 'na', rows: [['na', 'な', 'ナ'], ['ni', 'に', 'ニ'], ['nu', 'ぬ', 'ヌ'], ['ne', 'ね', 'ネ'], ['no', 'の', 'ノ']] },
  { id: 'ha', label: 'ha', rows: [['ha', 'は', 'ハ'], ['hi', 'ひ', 'ヒ'], ['fu', 'ふ', 'フ'], ['he', 'へ', 'ヘ'], ['ho', 'ほ', 'ホ']] },
  { id: 'ma', label: 'ma', rows: [['ma', 'ま', 'マ'], ['mi', 'み', 'ミ'], ['mu', 'む', 'ム'], ['me', 'め', 'メ'], ['mo', 'も', 'モ']] },
  { id: 'ya', label: 'ya', rows: [['ya', 'や', 'ヤ'], ['yu', 'ゆ', 'ユ'], ['yo', 'よ', 'ヨ']] },
  { id: 'ra', label: 'ra', rows: [['ra', 'ら', 'ラ'], ['ri', 'り', 'リ'], ['ru', 'る', 'ル'], ['re', 'れ', 'レ'], ['ro', 'ろ', 'ロ']] },
  { id: 'wa', label: 'wa', rows: [['wa', 'わ', 'ワ'], ['wo', 'を', 'ヲ'], ['n', 'ん', 'ン']] },
  { id: 'ga', label: 'ga', rows: [['ga', 'が', 'ガ'], ['gi', 'ぎ', 'ギ'], ['gu', 'ぐ', 'グ'], ['ge', 'げ', 'ゲ'], ['go', 'ご', 'ゴ']] },
  { id: 'za', label: 'za', rows: [['za', 'ざ', 'ザ'], ['ji', 'じ', 'ジ'], ['zu', 'ず', 'ズ'], ['ze', 'ぜ', 'ゼ'], ['zo', 'ぞ', 'ゾ']] },
  { id: 'da', label: 'da', rows: [['da', 'だ', 'ダ'], ['ji', 'ぢ', 'ヂ'], ['zu', 'づ', 'ヅ'], ['de', 'で', 'デ'], ['do', 'ど', 'ド']] },
  { id: 'ba', label: 'ba', rows: [['ba', 'ば', 'バ'], ['bi', 'び', 'ビ'], ['bu', 'ぶ', 'ブ'], ['be', 'べ', 'ベ'], ['bo', 'ぼ', 'ボ']] },
  { id: 'pa', label: 'pa', rows: [['pa', 'ぱ', 'パ'], ['pi', 'ぴ', 'ピ'], ['pu', 'ぷ', 'プ'], ['pe', 'ぺ', 'ペ'], ['po', 'ぽ', 'ポ']] },
];

function build(): Kana[] {
  const out: Kana[] = [];
  for (const script of ['hiragana', 'katakana'] as const) {
    for (const g of GROUPS) {
      for (const [romaji, hira, kata] of g.rows) {
        const kana = script === 'hiragana' ? hira : kata;
        // ぢ/づ share romaji with じ/ず, so ids use the kana itself to stay unique.
        out.push({ id: `${script}:${kana}`, kana, romaji, script, group: g.id });
      }
    }
  }
  return out;
}

export const ALL_KANA: Kana[] = build();

export const groupKey = (script: Script, group: string) => `${script}:${group}`;

const GROUP_KEYS = new Set(
  (['hiragana', 'katakana'] as const).flatMap((script) => GROUPS.map((g) => groupKey(script, g.id))),
);

/** Number of distinct, real rows among `keys` (ignores junk from old saves). */
export function countRows(keys: Iterable<string>): number {
  return [...new Set(keys)].filter((k) => GROUP_KEYS.has(k)).length;
}

export function kanaInGroups(groupKeys: Iterable<string>): Kana[] {
  const keys = new Set(groupKeys);
  return ALL_KANA.filter((k) => keys.has(groupKey(k.script, k.group)));
}
