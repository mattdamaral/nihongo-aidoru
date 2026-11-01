import { exportCode, importCode, SaveCodeError } from '../game/savecode';
import type { GameState } from '../game/state';
import { formatSushi } from '../game/scoring';
import { IS_DEV_BUILD } from '../game/storage';
import { VOICE_CREDIT } from '../data/voice';
import type { Sound } from './sound';

export interface MenuView {
  open(): void;
  close(): void;
  readonly isOpen: boolean;
}

export type DevAction = 'unlock' | 'sushi' | 'reset';

export interface MenuActions {
  onLoad(incoming: GameState): void;
  onGuide(): void;
  onKeys(): void;
  /** Plays a short clip, to try the voice volume. */
  onVoiceSample(): void;
  /** Dev build only: testing shortcuts. `amount` is the sushi to add, for 'sushi'. */
  onDev(action: DevAction, amount?: number): void;
}

/** The ideas page sits next to the game, at the same base path (so the dev site links to its own copy). */
export const IDEAS_URL = `${import.meta.env.BASE_URL}ideas/`;

/** Menu modal: help, sound settings, a copyable save code, and loading pasted codes. */
export function createMenu(root: HTMLElement, state: GameState, sound: Sound, actions: MenuActions): MenuView {
  const { onLoad } = actions;
  root.innerHTML = `
    <div class="sheet menu" role="dialog" aria-modal="true" aria-labelledby="menu-title">
      <header class="sheet-head">
        <h2 id="menu-title">Menu</h2>
        <button type="button" class="btn sheet-done">Done</button>
      </header>
      <section class="menu-section">
        <h3>Help</h3>
        <div class="menu-row menu-links">
          <button type="button" class="btn guide-btn">How to play</button>
          <button type="button" class="btn keys-btn">Keyboard shortcuts <kbd>?</kbd></button>
          <a class="btn" href="${IDEAS_URL}">Ideas &amp; plans →</a>
        </div>
      </section>
      <section class="menu-section">
        <h3>Sound</h3>
        <div class="menu-row sound-row">
          <label class="toggle"><input type="checkbox" class="sound-on" /> Sound effects</label>
          <input type="range" class="sound-volume" min="0" max="100" step="5" aria-label="Volume" />
        </div>
        <div class="menu-row sound-row">
          <span class="voice-label">Japanese voice</span>
          <input type="range" class="voice-volume" min="0" max="100" step="5" aria-label="Voice volume" />
        </div>
        <p class="sheet-hint">Press M to mute or unmute both. Voice: ${VOICE_CREDIT}.</p>
      </section>
      <section class="menu-section">
        <h3>Your save code</h3>
        <p class="sheet-hint">Paste it somewhere safe, or into “Load” on another device. Your game also saves itself automatically.</p>
        <textarea class="code code-out" rows="3" readonly spellcheck="false" aria-label="Your save code"></textarea>
        <div class="menu-row">
          <button type="button" class="btn copy-btn">Copy</button>
          <span class="menu-status copy-status" aria-live="polite"></span>
        </div>
      </section>
      <section class="menu-section">
        <h3>Load a save</h3>
        <textarea class="code code-in" rows="3" spellcheck="false" placeholder="Paste a save code (NA1.…)" aria-label="Save code to load"></textarea>
        <div class="menu-row">
          <button type="button" class="btn load-btn">Load</button>
          <span class="menu-status load-status" aria-live="polite"></span>
        </div>
        <div class="menu-confirm" hidden>
          <p class="confirm-text"></p>
          <div class="menu-row">
            <button type="button" class="btn btn-danger confirm-yes">Replace</button>
            <button type="button" class="btn confirm-no">Cancel</button>
          </div>
        </div>
      </section>
      ${
        IS_DEV_BUILD
          ? `<section class="menu-section dev-tools">
        <h3>Dev tools</h3>
        <p class="sheet-hint">Only on the dev site, for testing. They change the dev save only.</p>
        <div class="menu-row menu-links">
          <button type="button" class="btn" data-dev="unlock">Unlock all lessons</button>
          <button type="button" class="btn" data-dev="sushi" data-amount="1000000">+1M sushi</button>
          <button type="button" class="btn btn-danger" data-dev="reset">Reset dev save</button>
        </div>
        <div class="menu-row dev-amount-row">
          <input type="number" class="code dev-amount" min="1" step="1" inputmode="numeric" placeholder="Amount" aria-label="Sushi to add" />
          <button type="button" class="btn" data-dev="sushi">Add sushi</button>
        </div>
      </section>`
          : ''
      }
    </div>
  `;

  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const out = $<HTMLTextAreaElement>('.code-out');
  const input = $<HTMLTextAreaElement>('.code-in');
  const copyStatus = $('.copy-status');
  const loadStatus = $('.load-status');
  const confirmBox = $('.menu-confirm');
  const soundOn = $<HTMLInputElement>('.sound-on');
  const volume = $<HTMLInputElement>('.sound-volume');
  const voiceVolume = $<HTMLInputElement>('.voice-volume');
  let pending: GameState | null = null;
  let isOpen = false;

  const syncSound = () => {
    soundOn.checked = !sound.settings.muted;
    volume.value = String(Math.round(sound.settings.volume * 100));
    volume.disabled = sound.settings.muted;
    voiceVolume.value = String(Math.round(sound.settings.voiceVolume * 100));
    voiceVolume.disabled = sound.settings.muted;
  };
  soundOn.addEventListener('change', () => {
    sound.set({ muted: !soundOn.checked });
    syncSound();
    sound.correct();
  });
  volume.addEventListener('change', () => {
    sound.set({ volume: Number(volume.value) / 100 });
    sound.correct();
  });
  voiceVolume.addEventListener('change', () => {
    sound.set({ voiceVolume: Number(voiceVolume.value) / 100 });
    actions.onVoiceSample();
  });

  const setStatus = (el: HTMLElement, text: string, bad = false) => {
    el.textContent = text;
    el.classList.toggle('is-bad', bad);
  };

  const resetLoad = () => {
    pending = null;
    confirmBox.hidden = true;
    setStatus(loadStatus, '');
  };

  $('.copy-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(out.value);
      setStatus(copyStatus, 'Copied!');
    } catch {
      // Clipboard blocked (e.g. insecure context): select it for manual copying.
      out.focus();
      out.select();
      setStatus(copyStatus, 'Selected — press Ctrl+C to copy.');
    }
  });

  $('.load-btn').addEventListener('click', async () => {
    resetLoad();
    if (!input.value.trim()) return setStatus(loadStatus, 'Paste a save code first.', true);
    try {
      pending = await importCode(input.value);
    } catch (err) {
      return setStatus(loadStatus, err instanceof SaveCodeError ? err.message : 'Something went wrong.', true);
    }
    $('.confirm-text').textContent =
      `Replace your current game (${formatSushi(state.sushi)} sushi) ` +
      `with this save (${formatSushi(pending.sushi)} sushi)?`;
    confirmBox.hidden = false;
  });

  $('.confirm-yes').addEventListener('click', () => {
    if (!pending) return;
    onLoad(pending);
    resetLoad();
    input.value = '';
    setStatus(loadStatus, 'Save loaded!');
    void refreshCode();
  });
  $('.confirm-no').addEventListener('click', resetLoad);

  async function refreshCode(): Promise<void> {
    out.value = await exportCode(state);
  }

  const close = () => {
    isOpen = false;
    root.classList.remove('is-open');
  };
  $('.sheet-done').addEventListener('click', close);
  $('.guide-btn').addEventListener('click', () => {
    close();
    actions.onGuide();
  });
  $('.keys-btn').addEventListener('click', () => {
    close();
    actions.onKeys();
  });
  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-dev]');
    const action = btn?.dataset.dev as DevAction | undefined;
    if (!action) return;
    if (action !== 'sushi') return actions.onDev(action);
    // Preset buttons carry their amount; "Add sushi" reads the box.
    const field = root.querySelector<HTMLInputElement>('.dev-amount')!;
    const amount = Math.floor(Number(btn!.dataset.amount ?? field.value));
    if (!Number.isFinite(amount) || amount <= 0) {
      field.focus();
      return;
    }
    actions.onDev(action, amount);
  });
  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });
  root.querySelector('.dev-amount')?.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') root.querySelector<HTMLElement>('.dev-amount-row [data-dev]')!.click();
  });

  return {
    open() {
      syncSound();
      resetLoad();
      setStatus(copyStatus, '');
      void refreshCode();
      isOpen = true;
      root.classList.add('is-open');
      $('.sheet-done').focus();
    },
    close,
    get isOpen() {
      return isOpen;
    },
  };
}
