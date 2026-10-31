import { describe, expect, it } from 'vitest';
import { UPDATES } from '../src/data/changelog';

describe('changelog', () => {
  it('has unique ids, valid dates and newest first', () => {
    expect(new Set(UPDATES.map((u) => u.id)).size).toBe(UPDATES.length);
    for (const u of UPDATES) {
      expect(u.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(u.items.length).toBeGreaterThan(0);
    }
    const dates = UPDATES.map((u) => u.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});
