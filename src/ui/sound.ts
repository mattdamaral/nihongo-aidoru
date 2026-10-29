const SETTINGS_KEY = 'nihongo-aidoru:settings';
/** Master volume at 100% on the slider; kept low so sounds stay in the background. */
const MAX_GAIN = 0.16;
/** The same sound won't restart more often than this. */
const MIN_GAP_MS = 80;

export interface SoundSettings {
  muted: boolean;
  /** 0–1 */
  volume: number;
}

export interface Sound {
  correct(): void;
  wrong(): void;
  buy(): void;
  readonly settings: SoundSettings;
  set(next: Partial<SoundSettings>): void;
}

interface Note {
  freq: number;
  /** Frequency to glide to by the end of the note. */
  to?: number;
  start: number;
  length: number;
  type: OscillatorType;
  gain: number;
}

// Short, soft envelopes: a quick fade-in avoids clicks, exponential decay sounds natural.
const SOUNDS: Record<'correct' | 'wrong' | 'buy', Note[]> = {
  correct: [
    { freq: 659, start: 0, length: 0.12, type: 'triangle', gain: 0.9 },
    { freq: 880, start: 0.07, length: 0.18, type: 'triangle', gain: 0.9 },
  ],
  wrong: [{ freq: 260, to: 170, start: 0, length: 0.2, type: 'sine', gain: 1 }],
  buy: [
    { freq: 520, to: 780, start: 0, length: 0.06, type: 'sine', gain: 0.7 },
    { freq: 1047, start: 0.05, length: 0.25, type: 'triangle', gain: 0.55 },
    { freq: 1568, start: 0.05, length: 0.18, type: 'sine', gain: 0.2 },
  ],
};

function loadSettings(): SoundSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<SoundSettings>;
    return {
      muted: raw.muted === true,
      volume: typeof raw.volume === 'number' && raw.volume >= 0 && raw.volume <= 1 ? raw.volume : 0.7,
    };
  } catch {
    return { muted: false, volume: 0.7 };
  }
}

/** Tiny synthesized sound effects (no audio files, so they work offline). */
export function createSound(): Sound {
  const settings = loadSettings();
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  const lastPlayed: Record<string, number> = {};

  // Browsers only allow audio after a user gesture, so create the context then.
  const unlock = () => {
    if (!ctx) {
      try {
        ctx = new AudioContext();
        master = ctx.createGain();
        master.connect(ctx.destination);
        applyVolume();
      } catch {
        return;
      }
    }
    if (ctx.state === 'suspended') void ctx.resume();
  };
  for (const type of ['pointerdown', 'keydown']) document.addEventListener(type, unlock, { capture: true });

  function applyVolume(): void {
    if (master) master.gain.value = settings.muted ? 0 : settings.volume * MAX_GAIN;
  }

  function play(name: keyof typeof SOUNDS): void {
    if (!ctx || !master || settings.muted || settings.volume === 0 || document.hidden) return;
    const now = performance.now();
    if (now - (lastPlayed[name] ?? 0) < MIN_GAP_MS) return;
    lastPlayed[name] = now;
    const t0 = ctx.currentTime;
    for (const note of SOUNDS[name]) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      const start = t0 + note.start;
      const end = start + note.length;
      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, start);
      if (note.to) osc.frequency.exponentialRampToValueAtTime(note.to, end);
      env.gain.setValueAtTime(0.0001, start);
      env.gain.exponentialRampToValueAtTime(note.gain, start + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(env).connect(master);
      osc.start(start);
      osc.stop(end + 0.02);
    }
  }

  return {
    correct: () => play('correct'),
    wrong: () => play('wrong'),
    buy: () => play('buy'),
    settings,
    set(next) {
      Object.assign(settings, next);
      applyVolume();
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch {
        // Blocked storage: the setting just won't stick.
      }
    },
  };
}
