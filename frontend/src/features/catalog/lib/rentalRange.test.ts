import { describe, expect, it } from 'vitest';
import { addMonths, buildRentalRange, isValidIsoDate } from './rentalRange';

describe('rentalRange', () => {
  it('adds calendar months keeping the day', () => {
    expect(addMonths('2026-10-10', 3)).toBe('2027-01-10');
    expect(addMonths('2026-10-10', 12)).toBe('2027-10-10');
  });

  it('clamps to the last day of shorter months', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-03-31', 1)).toBe('2026-04-30');
  });

  it('builds a half-open range [start, end)', () => {
    expect(buildRentalRange('2026-10-10', 1)).toEqual({
      startDate: '2026-10-10',
      endDate: '2026-11-10',
    });
  });

  it('validates ISO dates', () => {
    expect(isValidIsoDate('2026-10-10')).toBe(true);
    expect(isValidIsoDate('2026-13-40')).toBe(false);
    expect(isValidIsoDate('10/10/2026')).toBe(false);
  });
});
