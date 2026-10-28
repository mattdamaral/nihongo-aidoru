import { describe, expect, it } from 'vitest';
import { exportCode, importCode, SaveCodeError } from '../src/game/savecode';
import { defaultState } from '../src/game/state';

function sampleState() {
  const state = defaultState(1_700_000_000_000);
  state.sushi = 1234.56;
  state.streak = 7;
  state.enabledGroups = ['hiragana:a', 'katakana:ka'];
  state.stats['katakana:カ'] = { right: 5, wrong: 2, lastSeen: 42 };
  state.tools = { shamoji: 4, yanagiba: 2 };
  state.toolProgress = { shamoji: 3.25 };
  return state;
}

describe('save codes', () => {
  it('round-trips a state', async () => {
    const state = sampleState();
    const code = await exportCode(state);
    expect(code).toMatch(/^NA1\.[\w-]+\.[0-9A-F]{6}$/);
    expect(await importCode(code)).toEqual(state);
  });

  it('tolerates whitespace and line breaks from pasting', async () => {
    const code = await exportCode(sampleState());
    const mangled = `  ${code.slice(0, 20)}\n${code.slice(20)}  `;
    expect((await importCode(mangled)).sushi).toBe(1234.56);
  });

  it('rejects a code with a typo', async () => {
    const code = await exportCode(sampleState());
    const i = 10;
    const typo = code.slice(0, i) + (code[i] === 'A' ? 'B' : 'A') + code.slice(i + 1);
    await expect(importCode(typo)).rejects.toThrow(/typo/);
  });

  it('rejects a cut-off code', async () => {
    const code = await exportCode(sampleState());
    await expect(importCode(code.slice(0, -10))).rejects.toBeInstanceOf(SaveCodeError);
  });

  it.each(['', 'hello', 'NA2.abc.123456', 'NA1..000000'])('rejects junk: %j', async (junk) => {
    await expect(importCode(junk)).rejects.toBeInstanceOf(SaveCodeError);
  });
});
