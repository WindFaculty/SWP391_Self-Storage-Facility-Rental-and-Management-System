import type { StatusTone } from '../../components/ui/StatusLabel'
import { formatDate, formatNumber } from '../../lib/format'
import type { UserRole } from '../facility/types'
import { ACTION_LABELS } from './adminRules'
import type { DailyActivityPoint, UsagePeriodDays } from './types'

export const USAGE_PERIOD_OPTIONS: Array<{ days: UsagePeriodDays; label: string }> = [
  { days: 7, label: '7 ngày' },
  { days: 14, label: '14 ngày' },
  { days: 30, label: '30 ngày' },
  { days: 90, label: '90 ngày' },
]

export const USAGE_ACTION_LABELS: Record<string, string> = {
  ...ACTION_LABELS,
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGIN_FAILED: 'Đăng nhập thất bại',
  USER_REGISTERED: 'Khách hàng đăng ký mới',
  ADMIN_UPDATE_USER_STATUS: 'Đổi trạng thái tài khoản',
  SUPPORT_TICKET_CREATED: 'Tạo ticket hỗ trợ',
}

export function getUsageActionLabel(action: string): string {
  return USAGE_ACTION_LABELS[action] ?? action
}

export function getEventTone(action: string): StatusTone {
  if (action === 'LOGIN_FAILED' || action === 'USER_DISABLED') {
    return 'danger'
  }
  if (action === 'ADMIN_UPDATE_USER_STATUS' || action === 'FACILITY_STATUS_CHANGED') {
    return 'warning'
  }
  if (action === 'LOGIN_SUCCESS' || action === 'USER_REGISTERED' || action === 'USER_ENABLED') {
    return 'success'
  }
  if (action === 'USER_CREATED' || action === 'USER_UPDATED' || action === 'SUPPORT_TICKET_CREATED') {
    return 'info'
  }
  return 'neutral'
}

export const ROLE_BAR_CLASSES: Record<UserRole, string> = {
  CUSTOMER: 'bg-primary',
  FACILITY_STAFF: 'bg-info',
  FACILITY_MANAGER: 'bg-sage-500',
  BUSINESS_MANAGER: 'bg-warning',
  ADMIN: 'bg-danger',
}

export function parseUsageDays(raw: string | null): UsagePeriodDays {
  if (raw === '7') return 7
  if (raw === '14') return 14
  if (raw === '90') return 90
  return 30
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`
  }
  if (bytes < 1024 * 1024) {
    return `${formatNumber(bytes / 1024)} KB`
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${formatNumber(bytes / (1024 * 1024))} MB`
  }
  return `${formatNumber(bytes / (1024 * 1024 * 1024))} GB`
}

export interface ActivityChartBucket {
  key: string
  axisLabel: string
  rangeLabel: string
  totalEvents: number
  loginSuccess: number
  loginFailed: number
  otherEvents: number
}

export function bucketDailyActivity(
  points: DailyActivityPoint[],
  periodDays: UsagePeriodDays,
): ActivityChartBucket[] {
  if (periodDays <= 30) {
    return points.map((point) => ({
      key: point.date,
      axisLabel: point.label,
      rangeLabel: formatDate(point.date),
      totalEvents: point.totalEvents,
      loginSuccess: point.loginSuccess,
      loginFailed: point.loginFailed,
      otherEvents: point.otherEvents,
    }))
  }

  const chunkSize = 7
  const buckets: ActivityChartBucket[] = []
  for (let i = 0; i < points.length; i += chunkSize) {
    const slice = points.slice(i, i + chunkSize)
    const first = slice[0]
    const last = slice[slice.length - 1]
    buckets.push({
      key: `${first.date}_${last.date}`,
      axisLabel: first.label,
      rangeLabel:
        first.date === last.date
          ? formatDate(first.date)
          : `${first.label} – ${formatDate(last.date)}`,
      totalEvents: slice.reduce((sum, item) => sum + item.totalEvents, 0),
      loginSuccess: slice.reduce((sum, item) => sum + item.loginSuccess, 0),
      loginFailed: slice.reduce((sum, item) => sum + item.loginFailed, 0),
      otherEvents: slice.reduce((sum, item) => sum + item.otherEvents, 0),
    })
  }
  return buckets
}
