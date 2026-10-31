import type { Card } from './cards';

export type Script = 'hiragana' | 'katakana';

export const isScript = (deck: string): deck is Script => deck === 'hiragana' || deck === 'katakana';

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

function build(): Card[] {
  const out: Card[] = [];
  for (const deck of ['hiragana', 'katakana'] as const) {
    for (const g of GROUPS) {
      for (const [romaji, hira, kata] of g.rows) {
        const kana = deck === 'hiragana' ? hira : kata;
        // ぢ/づ share romaji with じ/ず, so ids use the kana itself to stay unique.
        out.push({ id: `${deck}:${kana}`, deck, group: g.id, kana, romaji, answer: romaji });
      }
    }
  }
  return out;
}

export const ALL_KANA: Card[] = build();
