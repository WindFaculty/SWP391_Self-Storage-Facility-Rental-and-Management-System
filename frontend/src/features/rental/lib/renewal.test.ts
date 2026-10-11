import { describe, expect, it } from 'vitest';
import { buildRenewalQuote } from './renewal';

describe('buildRenewalQuote', () => {
  it('computes total amount from monthly price and months', () => {
    expect(buildRenewalQuote(1250000, '2026-12-10', 3)).toEqual({
      totalAmount: 3750000,
      newEndDate: '2027-03-10',
    });
  });

  it('extends from the current end date with month clamping', () => {
    expect(buildRenewalQuote(650000, '2026-01-31', 1)).toEqual({
      totalAmount: 650000,
      newEndDate: '2026-02-28',
    });
  });
});
