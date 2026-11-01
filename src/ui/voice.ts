import type { Card } from '../data/cards';
import { voiceSlug } from '../data/voice';
import type { Sound } from './sound';
import { SPEAKER, spriteSvg } from './sprites';

/**
 * How a clip went: "blocked" is the browser refusing sound before the first tap,
 * "failed" a clip that couldn't load (offline before it was cached).
 */
export type SpeakResult = 'played' | 'muted' | 'blocked' | 'failed';

export interface Voice {
  /** Says `card`'s Japanese, cutting off whatever was playing. */
  play(card: Card): Promise<SpeakResult>;
  stop(): void;
}

export const voiceUrl = (card: Card) => `${import.meta.env.BASE_URL}voice/${voiceSlug(card)}.mp3`;

/** A "hear it" button; clicks are handled by whoever renders it, via `data-speak`. */
export const speakButton = (className = '', label = '') => `
  <button type="button" class="speak ${className}" data-speak title="Hear it (R)" aria-label="Hear it">
    ${spriteSvg(SPEAKER, 'speak-icon')}${label ? `<span class="speak-label">${label}</span>` : ''}
  </button>`;

/** Plays the recorded clips in public/voice/, one at a time, at the menu's voice volume. */
export function createVoice(sound: Sound): Voice {
  const audio = new Audio();
  audio.preload = 'auto';

  return {
    async play(card) {
      const { muted, voiceVolume } = sound.settings;
      if (muted || voiceVolume === 0) return 'muted';
      const url = new URL(voiceUrl(card), location.href).href;
      if (audio.src !== url) audio.src = url;
      audio.currentTime = 0;
      audio.volume = voiceVolume;
      try {
        await audio.play();
        return 'played';
      } catch (err) {
        const name = err instanceof DOMException ? err.name : '';
        // AbortError: a newer clip took over, which is fine.
        return name === 'AbortError' ? 'played' : name === 'NotAllowedError' ? 'blocked' : 'failed';
      }
    },
    stop() {
      audio.pause();
    },
  };
}
