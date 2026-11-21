import { describe, expect, it } from 'vitest'
import type { DailyActivityPoint } from './types'
import {
  bucketDailyActivity,
  formatBytes,
  getEventTone,
  getUsageActionLabel,
  parseUsageDays,
} from './usagePresentation'

describe('usagePresentation helpers', () => {
  it('parses period query values into supported day buckets', () => {
    expect(parseUsageDays('7')).toBe(7)
    expect(parseUsageDays('14')).toBe(14)
    expect(parseUsageDays('90')).toBe(90)
    expect(parseUsageDays('30')).toBe(30)
    expect(parseUsageDays('unknown')).toBe(30)
    expect(parseUsageDays(null)).toBe(30)
  })

  it('maps action codes to readable Vietnamese labels and tones', () => {
    expect(getUsageActionLabel('LOGIN_SUCCESS')).toBe('Đăng nhập thành công')
    expect(getUsageActionLabel('LOGIN_FAILED')).toBe('Đăng nhập thất bại')
    expect(getUsageActionLabel('CUSTOM_EVENT')).toBe('CUSTOM_EVENT')

    expect(getEventTone('LOGIN_FAILED')).toBe('danger')
    expect(getEventTone('ADMIN_UPDATE_USER_STATUS')).toBe('warning')
    expect(getEventTone('LOGIN_SUCCESS')).toBe('success')
    expect(getEventTone('USER_CREATED')).toBe('info')
    expect(getEventTone('OTHER')).toBe('neutral')
  })

  it('formats media byte sizes cleanly', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toContain('KB')
    expect(formatBytes(2.5 * 1024 * 1024)).toContain('MB')
  })

  it('keeps daily buckets up to 30 days and aggregates weekly buckets for 90 days', () => {
    const points: DailyActivityPoint[] = Array.from({ length: 15 }, (_, index) => ({
      date: `2026-11-${String(index + 1).padStart(2, '0')}`,
      label: `${String(index + 1).padStart(2, '0')}/11`,
      totalEvents: 2,
      loginSuccess: 1,
      loginFailed: 0,
      otherEvents: 1,
    }))

    expect(bucketDailyActivity(points, 30)).toHaveLength(15)

    const weekly = bucketDailyActivity(points, 90)
    expect(weekly).toHaveLength(3)
    expect(weekly[0].totalEvents).toBe(14)
    expect(weekly[1].totalEvents).toBe(14)
    expect(weekly[2].totalEvents).toBe(2)
    expect(weekly[0].rangeLabel).toBe('01/11 – 07/11/2026')
  })
})
