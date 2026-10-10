import { describe, expect, it } from 'vitest';
import {
  formatArea,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatMeters,
  formatPriceRange,
} from './format';

describe('format', () => {
  const normalize = (value: string) => value.replace(/\u00a0/g, ' ');

  it('formats VND currency in vi-VN', () => {
    expect(normalize(formatCurrency(1250000))).toBe('1.250.000 ₫');
  });

  it('formats price ranges only when min differs from max', () => {
    expect(normalize(formatPriceRange(650000, 650000))).toBe('650.000 ₫');
    expect(formatPriceRange(650000, 900000)).toContain('–');
  });

  it('formats ISO dates as dd/MM/yyyy', () => {
    expect(formatDate('2026-10-10')).toBe('10/10/2026');
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });

  it('formats area and height with vi-VN numbers', () => {
    expect(formatArea(2.5, 2)).toBe('5 m²');
    expect(formatMeters(2.4)).toBe('2,4 m');
  });

  it('formats ISO date-time values and keeps invalid input', () => {
    expect(formatDateTime('2026-10-10T10:30:00Z')).toContain('2026');
    expect(formatDateTime('không-hợp-lệ')).toBe('không-hợp-lệ');
  });
});
