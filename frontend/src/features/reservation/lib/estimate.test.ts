import { describe, expect, it } from 'vitest';
import { estimateRent } from './estimate';

describe('estimateRent', () => {
  it('multiplies monthly price range by rental months', () => {
    expect(estimateRent(1250000, 1500000, 3)).toEqual({
      minTotal: 3750000,
      maxTotal: 4500000,
    });
  });

  it('keeps a single value when min equals max', () => {
    expect(estimateRent(650000, 650000, 1)).toEqual({ minTotal: 650000, maxTotal: 650000 });
  });
});
