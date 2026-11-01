import { STORAGE_PREFIX } from '../game/storage';
import { createSheet, type Sheet } from './sheet';
import { HANGIRI, NIGIRI, SHAMOJI, spriteSvg } from './sprites';

const SEEN_KEY = `${STORAGE_PREFIX}:guide-seen`;

const STEPS = [
  {
    art: spriteSvg(NIGIRI),
    title: 'Pick the right answer',
    text: 'Each question shows a sound or word: pick the matching Japanese (or flip it in Lessons). New kana are shown to you first. Right answers make sushi, and a streak makes more.',
  },
  {
    art: spriteSvg(SHAMOJI),
    title: 'Sushi buys kitchen tools',
    text: 'Spend sushi in the Kitchen. Paddles, mats and tubs cook sushi on their own; knives and fans make every answer worth more.',
  },
  {
    art: spriteSvg(HANGIRI),
    title: 'Your kitchen never sleeps',
    text: 'Tools keep cooking while you’re away (at a slower pace), so there’s always sushi waiting when you come back.',
  },
  {
    art: '<span class="hanko" lang="ja" aria-hidden="true">印</span>',
    title: 'Lessons, stamps & daily goals',
    text: 'Master a lesson to open the next one. Earn hanko stamps for lasting bonuses, and hit your daily goal to build a day streak.',
  },
];

export interface GuideView extends Sheet {
  /** Shows the guide once, for players who haven't seen it. */
  openFirstTime(): void;
}

/** "How to play": a few short steps, shown on the first visit and from the menu. */
export function createGuide(root: HTMLElement): GuideView {
  const sheet = createSheet(root, 'guide', 'How to play');
  let step = 0;

  function render(): void {
    const s = STEPS[step]!;
    const last = step === STEPS.length - 1;
    sheet.body.innerHTML = `
      <div class="guide-step">
        <div class="guide-art">${s.art}</div>
        <h3>${s.title}</h3>
        <p>${s.text}</p>
        <p class="guide-dots" aria-label="Step ${step + 1} of ${STEPS.length}">${STEPS.map((_, i) => `<i${i === step ? ' class="is-on"' : ''}></i>`).join('')}</p>
      </div>
      <div class="study-nav">
        <button type="button" class="btn btn-small" data-guide="skip">${last ? 'Close' : 'Skip'}</button>
        <button type="button" class="btn btn-go" data-guide="next">${last ? 'Let’s cook!' : 'Next →'}</button>
      </div>`;
    sheet.body.querySelector<HTMLElement>('[data-guide="next"]')!.focus({ preventScroll: true });
  }

  sheet.body.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-guide]')?.dataset.guide;
    if (action === 'skip' || (action === 'next' && step === STEPS.length - 1)) return sheet.close();
    if (action === 'next') {
      step++;
      render();
    }
  });

  const open = () => {
    step = 0;
    render();
    sheet.open();
    sheet.body.querySelector<HTMLElement>('[data-guide="next"]')!.focus();
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Storage blocked: the guide just shows again next visit.
    }
  };

  return {
    ...sheet,
    open,
    openFirstTime() {
      let seen = false;
      try {
        seen = localStorage.getItem(SEEN_KEY) !== null;
      } catch {
        // Treat blocked storage as seen, so it doesn't pop up every visit.
        seen = true;
      }
      if (!seen) open();
    },
    get isOpen() {
      return sheet.isOpen;
    },
  };
}
