import { describe, expect, it } from 'vitest';

import { getFrequencyIntervalMs, getNextExecutionDate } from './dca';

describe('dca helpers', () => {
  it('returns the correct interval for weekly plans', () => {
    expect(getFrequencyIntervalMs('weekly')).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('calculates the next execution date from a reference date', () => {
    const nextDate = getNextExecutionDate('biweekly', '2026-04-01T00:00:00.000Z');
    expect(nextDate).toBe('2026-04-15T00:00:00.000Z');
  });
});
