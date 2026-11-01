import { describeStamp, FAMILY_NAMES, nextStamps, stampBonuses, type Stamp, type StampFamily } from '../game/stamps';
import type { GameState } from '../game/state';
import { createSheet, type Sheet } from './sheet';

const fmt = (n: number) => Math.floor(n).toLocaleString('en-US');
const pct = (n: number) => `${Number((n * 100).toFixed(1))}%`;

/** A carved-seal look for one stamp; `earned` false draws an empty outline. */
export const sealHtml = (stamp: Pick<Stamp, 'seal'>, earned = true) =>
  `<span class="hanko${earned ? '' : ' is-empty'}" lang="ja" aria-hidden="true">${stamp.seal}</span>`;

/** Stamps sheet: what's next in each family, the bonuses so far, and every stamp earned. */
export function createStamps(root: HTMLElement, state: GameState): Sheet {
  const sheet = createSheet(root, 'stamps', 'Stamps <span lang="ja">はんこ</span>');

  function render(): void {
    const earned = Object.entries(state.stamps)
      .map(([id, at]) => ({ stamp: describeStamp(id), at }))
      .filter((e): e is { stamp: Stamp; at: number } => e.stamp !== null)
      .sort((a, b) => b.at - a.at);
    const byFamily = new Map<StampFamily, { stamp: Stamp; at: number }[]>();
    for (const e of earned) byFamily.set(e.stamp.family, [...(byFamily.get(e.stamp.family) ?? []), e]);
    const b = stampBonuses(state);

    sheet.body.innerHTML = `
      <p class="sheet-hint">Every stamp gives a lasting bonus, and most kinds never run out. Here’s what’s next:</p>
      <ul class="stamp-next">${nextStamps(state)
        .map(
          (n) => `
          <li>
            ${sealHtml(n, false)}
            <div>
              <p>${n.title} <small>${n.bonus}</small></p>
              <span class="stamp-bar"><span style="width: ${Math.min(n.have / n.need, 1) * 100}%"></span></span>
              <small>${fmt(n.have)} / ${fmt(n.need)}</small>
            </div>
          </li>`,
        )
        .join('')}
        <li class="stamp-more">${sealHtml({ seal: '覚' }, false)}<p>Master a row or a whole lesson, and open new lessons, for lesson bonuses.</p></li>
      </ul>
      <h3 class="stamp-head">Your bonuses</h3>
      <p class="stamp-bonuses">
        Answers +${pct(b.answer - 1)} · Kitchen +${pct(b.idle - 1)} · Max streak +×${Number(b.streakCap.toFixed(2))}
        · Away speed ${pct(b.away)} · Prices −${pct(b.discount)}
      </p>
      ${
        earned.length === 0
          ? '<p class="sheet-hint">No stamps yet. Answer a few questions to earn your first!</p>'
          : [...byFamily.entries()]
              .map(
                ([family, list]) => `
          <h3 class="stamp-head">${FAMILY_NAMES[family]} <small>${list.length}</small></h3>
          <ul class="stamp-grid">${list
            .map(
              ({ stamp, at }) => `
            <li title="${stamp.bonus} · ${new Date(at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}">
              ${sealHtml(stamp)}
              <span>${stamp.title}</span>
              <small>${stamp.bonus}</small>
            </li>`,
            )
            .join('')}</ul>`,
              )
              .join('')
      }`;
  }

  return {
    ...sheet,
    open() {
      render();
      sheet.open();
    },
    get isOpen() {
      return sheet.isOpen;
    },
  };
}
