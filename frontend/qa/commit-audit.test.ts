import { describe, expect, it, vi } from 'vitest'
import { isValidIsoDate, todayIso } from '../src/features/catalog/lib/rentalRange'

// Historical FE1 date regressions; removed operations stores are no longer tested here.
describe('historical b3f63d4 date regressions', () => {
  it('rejects nonexistent calendar dates', () => {
    expect(isValidIsoDate('2026-02-31')).toBe(false)
  })

  it('defaults to the correct Vietnam date shortly after midnight', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-10-10T00:30:00+07:00'))
      expect(todayIso()).toBe('2026-10-10')
    } finally {
      vi.useRealTimers()
    }
  })
})
