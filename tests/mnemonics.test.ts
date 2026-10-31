import { describe, expect, it } from 'vitest';
import { ALL_KANA } from '../src/data/kana';
import { mnemonicFor } from '../src/data/mnemonics';

describe('mnemonics', () => {
  it('give every kana at least two tips', () => {
    for (const kana of ALL_KANA) {
      const { tips } = mnemonicFor(kana);
      expect(tips.length, kana.kana).toBeGreaterThanOrEqual(2);
      for (const tip of tips) expect(tip.trim().length, kana.kana).toBeGreaterThan(10);
    }
  });

  it('only point at real look-alikes from the same script', () => {
    for (const kana of ALL_KANA) {
      for (const other of mnemonicFor(kana).confuse) {
        const match = ALL_KANA.find((k) => k.kana === other);
        expect(match, `${kana.kana} → ${other}`).toBeDefined();
        expect(match!.deck, `${kana.kana} → ${other}`).toBe(kana.deck);
        expect(other).not.toBe(kana.kana);
      }
    }
  });

  it('explain voiced kana from their plain form', () => {
    const ga = ALL_KANA.find((k) => k.kana === 'が')!;
    expect(mnemonicFor(ga).tips[0]).toContain('か (ka)');
    const pa = ALL_KANA.find((k) => k.kana === 'パ')!;
    expect(mnemonicFor(pa).tips[0]).toContain('ハ (ha)');
    expect(mnemonicFor(pa).confuse).toEqual(['バ']);
    expect(mnemonicFor(ALL_KANA.find((k) => k.kana === 'ぢ')!).confuse).toContain('じ');
  });
});
