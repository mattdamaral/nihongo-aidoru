import { createSheet, type Sheet } from './sheet';

const GROUPS: [title: string, keys: [keys: string[], what: string][]][] = [
  [
    'Quiz',
    [
      [['1', '2', '3', '4'], 'Pick an answer'],
      [['A', 'S', 'D', 'F'], 'Pick an answer (home row)'],
      [['Enter'], '“Got it” on a new card'],
      [['R'], 'Hear it again'],
    ],
  ],
  [
    'Panels',
    [
      [['L'], 'Lessons'],
      [['B'], 'Kitchen shop'],
      [['T'], 'Stats'],
      [['H'], 'Stamps'],
      [['M'], 'Sound and voice on / off'],
      [['?'], 'This list'],
      [['Esc'], 'Close'],
    ],
  ],
  [
    'Learn mode',
    [
      [['←', '→'], 'Previous / next card'],
      [['R'], 'Hear it again'],
    ],
  ],
];

/** Keyboard shortcuts sheet, opened with "?" or from the menu. */
export function createKeys(root: HTMLElement): Sheet {
  const sheet = createSheet(root, 'keys', 'Keyboard shortcuts');
  sheet.body.innerHTML = GROUPS.map(
    ([title, rows]) => `
    <section class="keys-group">
      <h3>${title}</h3>
      <dl>${rows.map(([keys, what]) => `<div><dt>${keys.map((k) => `<kbd>${k}</kbd>`).join(' ')}</dt><dd>${what}</dd></div>`).join('')}</dl>
    </section>`,
  ).join('');
  return sheet;
}
