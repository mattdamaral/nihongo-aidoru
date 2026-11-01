import { describe, expect, it } from 'vitest';
import { AREAS, IDEAS } from '../src/data/ideas';

describe('ideas page', () => {
  it('has unique ids, a known area and text for every idea', () => {
    expect(new Set(IDEAS.map((i) => i.id)).size).toBe(IDEAS.length);
    for (const idea of IDEAS) {
      expect(Object.keys(AREAS), idea.id).toContain(idea.area);
      expect(idea.title.length, idea.id).toBeGreaterThan(0);
      expect(idea.text.length, idea.id).toBeGreaterThan(20);
    }
  });

  it('has something in every area', () => {
    for (const area of Object.keys(AREAS)) expect(IDEAS.some((i) => i.area === area), area).toBe(true);
  });
});
