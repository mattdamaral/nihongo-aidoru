import { passiveRate, rewardMods } from '../game/economy';
import type { GameState } from '../game/state';
import { formatRate, formatReward, formatSushi, streakBonus } from '../game/scoring';
import { FLAME, NIGIRI, spriteSvg } from './sprites';

export interface Hud {
  update(state: GameState): void;
  celebrate(reward: number): void;
  wobble(): void;
}

export interface HudActions {
  onLessons(): void;
  onShop(): void;
  onMenu(): void;
}

/** Restarts a CSS animation class even if it is already applied. */
export function replay(el: Element, cls: string): void {
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
}

export function createHud(topbar: HTMLElement, stage: HTMLElement, actions: HudActions): Hud {
  topbar.innerHTML = `
    <div class="counter" aria-live="polite">
      ${spriteSvg(NIGIRI, 'counter-icon')}
      <div class="counter-text">
        <span class="counter-value">0</span>
        <span class="counter-rate" title="Idle sushi per second from your kitchen tools">+0/s</span>
      </div>
    </div>
    <div class="streak">
      ${spriteSvg(FLAME, 'streak-icon')}
      <span class="streak-value">0</span>
      <span class="streak-bonus">×1.0</span>
    </div>
    <nav class="topbar-actions">
      <button type="button" class="btn btn-icon lessons-btn" title="Lessons (L)">Lessons</button>
      <button type="button" class="btn btn-icon shop-btn" title="Shop (B)" aria-label="Shop">Shop</button>
      <button type="button" class="btn btn-icon menu-btn" title="Menu: sound, save / load" aria-label="Menu">≡</button>
    </nav>
  `;
  stage.innerHTML = `
    <div class="sushi-wrap">
      ${spriteSvg(NIGIRI, 'sushi')}
      <div class="plate"></div>
      <div class="popups"></div>
    </div>
  `;

  const value = topbar.querySelector<HTMLElement>('.counter-value')!;
  const rate = topbar.querySelector<HTMLElement>('.counter-rate')!;
  const streakEl = topbar.querySelector<HTMLElement>('.streak')!;
  const streakValue = topbar.querySelector<HTMLElement>('.streak-value')!;
  const streakBonusEl = topbar.querySelector<HTMLElement>('.streak-bonus')!;
  const sushi = stage.querySelector<SVGElement>('.sushi')!;
  const popups = stage.querySelector<HTMLElement>('.popups')!;
  topbar.querySelector('.lessons-btn')!.addEventListener('click', actions.onLessons);
  topbar.querySelector('.shop-btn')!.addEventListener('click', actions.onShop);
  topbar.querySelector('.menu-btn')!.addEventListener('click', actions.onMenu);

  return {
    update(state) {
      const mods = rewardMods(state);
      value.textContent = formatSushi(state.sushi);
      rate.textContent = `+${formatRate(passiveRate(state))}/s`;
      streakValue.textContent = String(state.streak);
      streakBonusEl.textContent = `×${streakBonus(state.streak, mods.streakStep, mods.streakCap).toFixed(1)}`;
      streakEl.title =
        `Streak: +${Math.round(mods.streakStep * 100)}% sushi for every 5 correct in a row ` +
        `(max ×${Number(mods.streakCap.toFixed(2))})`;
      streakEl.classList.toggle('is-cold', state.streak === 0);
    },
    celebrate(reward) {
      replay(sushi, 'bounce');
      replay(value, 'pulse');
      const pop = document.createElement('span');
      pop.className = 'popup';
      pop.textContent = formatReward(reward);
      pop.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 80)}px`);
      popups.append(pop);
      pop.addEventListener('animationend', () => pop.remove());
    },
    wobble() {
      replay(sushi, 'wobble');
    },
  };
}
