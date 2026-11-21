import { useMemo, useState } from 'react'
import { EmptyState } from '../../../components/ui/EmptyState'
import { formatNumber } from '../../../lib/format'
import type { DailyActivityPoint, UsagePeriodDays } from '../types'
import { bucketDailyActivity, type ActivityChartBucket } from '../usagePresentation'

interface SystemActivityChartProps {
  points: DailyActivityPoint[]
  periodDays: UsagePeriodDays
  totalEvents: number
}

function niceAxisMax(maxValue: number): number {
  if (maxValue <= 4) return 4
  if (maxValue <= 10) return Math.ceil(maxValue / 2) * 2
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)))
  const step = magnitude / 2
  return Math.ceil(maxValue / step) * step
}

function shouldShowAxisLabel(index: number, total: number, periodDays: UsagePeriodDays): boolean {
  if (index === 0 || index === total - 1) return true
  if (periodDays <= 7) return true
  if (periodDays <= 14) return index % 2 === 0
  if (periodDays <= 30) return index % 5 === 0
  return index % 2 === 0
}

export function SystemActivityChart({ points, periodDays, totalEvents }: SystemActivityChartProps) {
  const buckets = useMemo(() => bucketDailyActivity(points, periodDays), [points, periodDays])
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  const maxBucketValue = useMemo(
    () => Math.max(...buckets.map((bucket) => bucket.totalEvents), 0),
    [buckets],
  )
  const scaleMax = niceAxisMax(maxBucketValue)
  const scaleMid = Math.round(scaleMax / 2)

  const activeBucket: ActivityChartBucket | null = useMemo(() => {
    if (!hoveredKey) return null
    return buckets.find((bucket) => bucket.key === hoveredKey) ?? null
  }, [buckets, hoveredKey])

  const peakBucket = useMemo(() => {
    if (buckets.length === 0) return null
    return buckets.reduce((best, item) => (item.totalEvents > best.totalEvents ? item : best), buckets[0])
  }, [buckets])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-space-sm">
        <div>
          <h2 className="text-subsection text-text-main">Xu hướng hoạt động hệ thống</h2>
          <p className="mt-0.5 text-label-help text-text-muted">
            {periodDays > 30
              ? `Tổng hợp theo cụm 7 ngày trong ${periodDays} ngày gần nhất.`
              : `Số lượt sự kiện theo từng ngày trong ${periodDays} ngày gần nhất.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-badge-caption text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs bg-primary" aria-hidden="true" />
            Đăng nhập thành công
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs bg-info" aria-hidden="true" />
            Hoạt động khác
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs bg-danger" aria-hidden="true" />
            Đăng nhập thất bại
          </span>
        </div>
      </div>

      <div className="mt-space-md min-h-[34px] flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-muted/70 border border-border-subtle px-space-md py-1.5 text-badge-caption">
        {activeBucket ? (
          <>
            <span className="font-semibold text-text-main">{activeBucket.rangeLabel}</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 tabular-nums">
              <span className="text-text-main">
                Tổng: <strong>{formatNumber(activeBucket.totalEvents)}</strong>
              </span>
              <span className="text-primary">
                Đăng nhập: <strong>{formatNumber(activeBucket.loginSuccess)}</strong>
              </span>
              <span className="text-info">
                Khác: <strong>{formatNumber(activeBucket.otherEvents)}</strong>
              </span>
              <span className={activeBucket.loginFailed > 0 ? 'text-danger' : 'text-text-muted'}>
                Thất bại: <strong>{formatNumber(activeBucket.loginFailed)}</strong>
              </span>
            </div>
          </>
        ) : (
          <>
            <span className="text-text-muted">
              Di chuột lên từng cột để xem chi tiết sự kiện theo ngày.
            </span>
            {peakBucket && peakBucket.totalEvents > 0 && (
              <span className="text-text-main tabular-nums">
                Đỉnh cao nhất: <strong>{formatNumber(peakBucket.totalEvents)}</strong> sự kiện (
                {peakBucket.rangeLabel})
              </span>
            )}
          </>
        )}
      </div>

      {totalEvents === 0 ? (
        <div className="mt-space-md">
          <EmptyState
            icon="bar_chart"
            title="Chưa ghi nhận sự kiện hệ thống trong khoảng thời gian này."
            description="Khi người dùng đăng nhập, đăng ký hoặc quản trị viên thao tác, biểu đồ sẽ tự động cập nhật."
          />
        </div>
      ) : (
        <div
          className="mt-space-lg flex gap-space-sm"
          role="img"
          aria-label={`Biểu đồ hoạt động hệ thống trong ${periodDays} ngày gần nhất với tổng ${totalEvents} sự kiện`}
        >
          <div className="w-8 shrink-0 flex flex-col justify-between pb-6 text-right text-[11px] text-text-muted tabular-nums">
            <span>{formatNumber(scaleMax)}</span>
            <span>{formatNumber(scaleMid)}</span>
            <span>0</span>
          </div>

          <div className="relative flex-1 min-w-0">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between"
              aria-hidden="true"
            >
              <div className="border-t border-dashed border-border-subtle" />
              <div className="border-t border-dashed border-border-subtle" />
              <div className="border-t border-border-hairline" />
            </div>

            <div className="relative h-52 flex items-end gap-1 sm:gap-1.5 pb-6">
              {buckets.map((bucket, index) => {
                const isActive = hoveredKey === bucket.key
                const totalHeightPct = bucket.totalEvents === 0
                  ? 0
                  : Math.max(4, (bucket.totalEvents / scaleMax) * 100)
                const failedRatio = bucket.totalEvents > 0 ? (bucket.loginFailed / bucket.totalEvents) * 100 : 0
                const otherRatio = bucket.totalEvents > 0 ? (bucket.otherEvents / bucket.totalEvents) * 100 : 0
                const loginRatio = Math.max(0, 100 - failedRatio - otherRatio)
                const showTick = shouldShowAxisLabel(index, buckets.length, periodDays)

                return (
                  <button
                    key={bucket.key}
                    type="button"
                    onMouseEnter={() => setHoveredKey(bucket.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    onFocus={() => setHoveredKey(bucket.key)}
                    onBlur={() => setHoveredKey(null)}
                    aria-label={`${bucket.rangeLabel}: ${bucket.totalEvents} sự kiện (${bucket.loginSuccess} đăng nhập, ${bucket.otherEvents} khác, ${bucket.loginFailed} thất bại)`}
                    className={`group relative flex-1 min-w-0 h-full flex flex-col justify-end items-center rounded-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                      isActive ? 'bg-surface-muted/80' : 'hover:bg-surface-muted/50'
                    }`}
                  >
                    <div
                      className="w-full max-w-[26px] flex flex-col overflow-hidden rounded-t-sm transition-all duration-150"
                      style={{ height: `${totalHeightPct}%` }}
                    >
                      {bucket.loginFailed > 0 && (
                        <span
                          className="w-full bg-danger shrink-0"
                          style={{
                            height: `${failedRatio}%`,
                            minHeight: '3px',
                          }}
                        />
                      )}
                      {bucket.otherEvents > 0 && (
                        <span
                          className="w-full bg-info shrink-0"
                          style={{
                            height: `${otherRatio}%`,
                            minHeight: '3px',
                          }}
                        />
                      )}
                      {bucket.loginSuccess > 0 && (
                        <span
                          className="w-full bg-primary flex-1"
                          style={{
                            height: `${loginRatio}%`,
                            minHeight: '3px',
                          }}
                        />
                      )}
                    </div>
                    <span
                      className={`absolute -bottom-6 text-[10px] tabular-nums whitespace-nowrap ${
                        isActive
                          ? 'text-text-main font-semibold'
                          : showTick
                            ? 'text-text-muted'
                            : 'sr-only'
                      }`}
                    >
                      {bucket.axisLabel}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
