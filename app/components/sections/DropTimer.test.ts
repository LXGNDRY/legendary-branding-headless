import {describe, expect, it} from 'vitest';
import {calculateTimeLeft} from './DropTimer';

describe('calculateTimeLeft', () => {
  const now = Date.UTC(2026, 0, 1, 0, 0, 0);
  it('splits a future gap into units', () => {
    const target = now + ((2 * 24 + 3) * 60 * 60 + 4 * 60 + 5) * 1000;
    expect(calculateTimeLeft(target, now)).toEqual({days: 2, hours: 3, minutes: 4, seconds: 5});
  });
  it('clamps past dates to zero', () => {
    expect(calculateTimeLeft(now - 1000, now)).toEqual({days: 0, hours: 0, minutes: 0, seconds: 0});
  });
  it('never returns NaN for an invalid date', () => {
    const t = calculateTimeLeft(Date.parse('not a date'), now);
    expect(Object.values(t).every(Number.isFinite)).toBe(true);
  });
});
