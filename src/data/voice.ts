import type { Card } from './cards';

/** Required credit for the voice clips (VOICEVOX terms). */
export const VOICE_CREDIT = 'VOICEVOX:玄野武宏';

/** The VOICEVOX speaker and style the clips were made with; see scripts/make-voice.ts. */
export const VOICE_SPEAKER = { name: '玄野武宏', style: 'ノーマル' };

/**
 * File name (without ".mp3") of a card's clip in public/voice/, from its romaji:
 * "ka", "nijuusan", "ohayou-gozaimasu". Cards that sound the same share a clip (か and カ, じ and ぢ).
 */
export const voiceSlug = (card: Card) =>
  card.romaji
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Katakana to hiragana, so both kana lessons are read out the same way. */
export const toHiragana = (text: string) =>
  text.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
