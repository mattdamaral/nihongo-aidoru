import { UPDATES } from '../data/changelog';
import { STORAGE_PREFIX } from '../game/storage';

const SEEN_KEY = `${STORAGE_PREFIX}:seen-update`;

export interface WhatsNewView {
  open(): void;
  close(): void;
  readonly isOpen: boolean;
  /** True while the newest update hasn't been opened yet. */
  readonly hasUnseen: boolean;
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });

/**
 * "What's new" modal listing past updates. `firstVisit` marks everything as
 * seen, so brand-new players only get the dot for later updates.
 */
export function createWhatsNew(root: HTMLElement, firstVisit: boolean): WhatsNewView {
  root.innerHTML = `
    <div class="sheet whatsnew" role="dialog" aria-modal="true" aria-labelledby="whatsnew-title">
      <header class="sheet-head">
        <h2 id="whatsnew-title">What’s new</h2>
        <button type="button" class="btn sheet-done">Done</button>
      </header>
      <div class="sheet-body">
        ${UPDATES.map(
          (u) => `
          <section class="update">
            <h3><span class="update-title">${u.title}</span> <time datetime="${u.date}">${formatDate(u.date)}</time></h3>
            <ul>${u.items.map((item) => `<li>${item}</li>`).join('')}</ul>
          </section>`,
        ).join('')}
      </div>
    </div>
  `;

  const latest = UPDATES[0]?.id ?? '';
  const readSeen = () => {
    try {
      return localStorage.getItem(SEEN_KEY);
    } catch {
      return null;
    }
  };
  const markSeen = () => {
    try {
      localStorage.setItem(SEEN_KEY, latest);
    } catch {
      // Storage blocked: the dot just comes back next visit.
    }
    seen = latest;
  };

  let seen = readSeen();
  if (seen === null && firstVisit) markSeen();
  let isOpen = false;

  const close = () => {
    isOpen = false;
    root.classList.remove('is-open');
  };
  root.querySelector('.sheet-done')!.addEventListener('click', close);
  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });

  return {
    open() {
      markSeen();
      isOpen = true;
      root.classList.add('is-open');
      root.querySelector<HTMLElement>('.sheet-done')!.focus();
    },
    close,
    get isOpen() {
      return isOpen;
    },
    get hasUnseen() {
      return seen !== latest;
    },
  };
}
