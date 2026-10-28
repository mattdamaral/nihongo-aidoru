import { exportCode, importCode, SaveCodeError } from '../game/savecode';
import type { GameState } from '../game/state';
import { formatSushi } from '../game/scoring';

export interface MenuView {
  open(): void;
  close(): void;
  readonly isOpen: boolean;
}

/** Save / Load modal: shows a copyable save code and loads pasted ones. */
export function createMenu(root: HTMLElement, state: GameState, onLoad: (incoming: GameState) => void): MenuView {
  root.innerHTML = `
    <div class="sheet menu" role="dialog" aria-modal="true" aria-labelledby="menu-title">
      <header class="sheet-head">
        <h2 id="menu-title">Save</h2>
        <button type="button" class="btn sheet-done">Done</button>
      </header>
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
    </div>
  `;

  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const out = $<HTMLTextAreaElement>('.code-out');
  const input = $<HTMLTextAreaElement>('.code-in');
  const copyStatus = $('.copy-status');
  const loadStatus = $('.load-status');
  const confirmBox = $('.menu-confirm');
  let pending: GameState | null = null;
  let isOpen = false;

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
  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });

  return {
    open() {
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
