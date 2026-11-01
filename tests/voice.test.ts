import { describe, expect, it } from 'vitest';
import { ALL_CARDS } from '../src/data/cards';
import { toHiragana, voiceSlug } from '../src/data/voice';

/** The clips on disk, by slug. */
const CLIPS = new Set(Object.keys(import.meta.glob('../public/voice/*.mp3')).map((p) => p.replace(/^.*\/|\.mp3$/g, '')));

/** Different kana, same sound: these share a clip on purpose. */
const HOMOPHONES = [new Set(['じ', 'ぢ']), new Set(['ず', 'づ'])];

describe('voice clips', () => {
  it('has a clip for every card (run npm run voice after adding cards)', () => {
    const missing = ALL_CARDS.filter((c) => !CLIPS.has(voiceSlug(c))).map((c) => c.id);
    expect(missing).toEqual([]);
  });

  it('only shares a clip between cards that sound the same', () => {
    const readings = new Map<string, string>();
    for (const card of ALL_CARDS) {
      const slug = voiceSlug(card);
      const reading = toHiragana(card.kana);
      const first = readings.get(slug) ?? reading;
      readings.set(slug, first);
      if (first !== reading) expect(HOMOPHONES.some((h) => h.has(first) && h.has(reading)), `${slug}: ${first} / ${reading}`).toBe(true);
    }
  });

  it('uses URL-safe names', () => {
    for (const card of ALL_CARDS) expect(voiceSlug(card)).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});
