import { TOOLS, type Tool } from '../data/tools';
import { nextCost, nextMilestone, owned, passiveRate, payout, rewardMods, type Payout } from '../game/economy';
import type { GameState } from '../game/state';
import { formatRate, formatReward, formatSushi } from '../game/scoring';
import { replay } from './hud';
import { NIGIRI, spriteSvg } from './sprites';

export interface ShopView {
  /** Refreshes numbers, bars and buy buttons; cheap enough to call every tick. */
  update(state: GameState): void;
  showPayouts(payouts: Payout[]): void;
  flashBought(toolId: string): void;
  open(): void;
  close(): void;
  toggle(): void;
  readonly isOpen: boolean;
}

function effectText(tool: Tool): string {
  const e = tool.effect;
  switch (e.kind) {
    case 'passive':
      return `+${e.amount} sushi every ${e.interval}s`;
    case 'answer':
      return `+${e.amount} sushi per correct answer`;
    case 'streak':
      return `Streak bonus +${Math.round(e.step * 100)}% per 5 · max +${Math.round(e.cap * 100)}%`;
  }
}

function totalText(tool: Tool, state: GameState): string {
  const n = owned(state, tool);
  if (n === 0) return 'Not owned yet';
  const e = tool.effect;
  if (e.kind === 'passive') {
    const next = nextMilestone(n);
    const milestone = next ? ` · ×2 at ${next}` : '';
    return `Making +${formatSushi(payout(tool, n))} every ${e.interval}s${milestone}`;
  }
  const mods = rewardMods(state);
  if (e.kind === 'answer') return `Answers: ${formatReward(1 + mods.answerBonus)} base sushi`;
  return `Streak: +${Math.round(mods.streakStep * 100)}% per 5 · max ×${Number(mods.streakCap.toFixed(2))}`;
}

/** Right-hand shop: always visible on wide screens, a slide-in drawer on phones. */
export function createShop(root: HTMLElement, backdrop: HTMLElement, onBuy: (tool: Tool) => void): ShopView {
  root.innerHTML = `
    <header class="shop-head">
      <div>
        <h2>Kitchen</h2>
        <p class="shop-rate">+0 sushi/s</p>
      </div>
      <button type="button" class="btn btn-small shop-close" aria-label="Close shop">Close</button>
    </header>
    <div class="shop-list">
      ${TOOLS.map(
        (tool) => `
        <article class="tool" data-tool="${tool.id}">
          <div class="tool-icon">${spriteSvg(tool.sprite)}<span class="tool-owned">0</span></div>
          <div class="tool-info">
            <h3><span lang="ja">${tool.kana}</span> <small>${tool.name} · ${tool.english}</small></h3>
            <p class="tool-effect">${effectText(tool)}</p>
            <p class="tool-total"></p>
            ${tool.effect.kind === 'passive' ? '<div class="tool-bar"><span></span><i class="tool-pops"></i></div>' : ''}
          </div>
          <button type="button" class="buy" data-buy="${tool.id}">
            ${spriteSvg(NIGIRI, 'buy-icon')}<span class="buy-cost"></span>
          </button>
        </article>`,
      ).join('')}
    </div>
  `;

  const rateEl = root.querySelector<HTMLElement>('.shop-rate')!;
  const cards = new Map(
    TOOLS.map((tool) => {
      const el = root.querySelector<HTMLElement>(`[data-tool="${tool.id}"]`)!;
      return [
        tool.id,
        {
          el,
          owned: el.querySelector<HTMLElement>('.tool-owned')!,
          total: el.querySelector<HTMLElement>('.tool-total')!,
          bar: el.querySelector<HTMLElement>('.tool-bar span'),
          pops: el.querySelector<HTMLElement>('.tool-pops'),
          buy: el.querySelector<HTMLButtonElement>('.buy')!,
          cost: el.querySelector<HTMLElement>('.buy-cost')!,
        },
      ];
    }),
  );

  let isOpen = false;
  const setOpen = (open: boolean) => {
    isOpen = open;
    root.classList.toggle('is-open', open);
    backdrop.classList.toggle('is-open', open);
  };

  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-buy]');
    const tool = TOOLS.find((t) => t.id === btn?.dataset.buy);
    if (tool) onBuy(tool);
  });
  root.querySelector('.shop-close')!.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));

  return {
    update(state) {
      rateEl.textContent = `+${formatRate(passiveRate(state))} sushi/s`;
      for (const tool of TOOLS) {
        const card = cards.get(tool.id)!;
        const n = owned(state, tool);
        const cost = nextCost(state, tool);
        card.owned.textContent = String(n);
        card.owned.hidden = n === 0;
        card.total.textContent = totalText(tool, state);
        card.cost.textContent = formatSushi(cost);
        card.buy.disabled = state.sushi < cost;
        card.buy.title = `Buy for ${cost} sushi`;
        if (card.bar && tool.effect.kind === 'passive') {
          const pct = n === 0 ? 0 : ((state.toolProgress[tool.id] ?? 0) / tool.effect.interval) * 100;
          card.bar.style.width = `${Math.min(pct, 100)}%`;
        }
      }
    },
    showPayouts(payouts) {
      for (const p of payouts) {
        const pops = cards.get(p.toolId)?.pops;
        if (!pops) continue;
        const pop = document.createElement('span');
        pop.className = 'tool-pop';
        pop.textContent = formatReward(p.amount);
        pops.append(pop);
        pop.addEventListener('animationend', () => pop.remove());
      }
    },
    flashBought(toolId) {
      const card = cards.get(toolId);
      if (card) replay(card.el, 'bought');
    },
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!isOpen),
    get isOpen() {
      return isOpen;
    },
  };
}
