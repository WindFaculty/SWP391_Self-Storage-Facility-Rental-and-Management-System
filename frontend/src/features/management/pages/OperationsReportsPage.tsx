import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSession } from '../../../app/providers/SessionProvider'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { formatCurrency, formatNumber } from '../../../lib/format'
import { useReportSummary } from '../hooks/useManagement'
import type { FacilityReportRow, ReportPeriod } from '../types'

const PERIOD_OPTIONS: Array<{ id: ReportPeriod; label: string }> = [
  { id: 'month', label: 'Tháng này' },
  { id: 'quarter', label: 'Quý này' },
  { id: 'halfYear', label: '6 tháng gần nhất' },
  { id: 'year', label: 'Năm nay' },
]

const PERIOD_IDS = PERIOD_OPTIONS.map((option) => option.id)

type SortKey =
  | 'name'
  | 'unitTotal'
  | 'unitOccupied'
  | 'unitAvailable'
  | 'occupancyRate'
  | 'revenue'
  | 'activeRentals'
  | 'overdueRentals'

const SORT_COLUMNS: Array<{ key: SortKey; label: string; numeric: boolean }> = [
  { key: 'name', label: 'Cơ sở', numeric: false },
  { key: 'unitTotal', label: 'Tổng kho', numeric: true },
  { key: 'unitOccupied', label: 'Đang thuê', numeric: true },
  { key: 'unitAvailable', label: 'Khả dụng', numeric: true },
  { key: 'occupancyRate', label: 'Lấp đầy', numeric: true },
  { key: 'revenue', label: 'Doanh thu thực thu', numeric: true },
  { key: 'activeRentals', label: 'HĐ đang thuê', numeric: true },
  { key: 'overdueRentals', label: 'HĐ quá hạn', numeric: true },
]

function exportCsv(rows: FacilityReportRow[], period: ReportPeriod) {
  const header = [
    'Cơ sở',
    'Tổng kho',
    'Đang thuê',
    'Khả dụng',
    'Tỷ lệ lấp đầy (%)',
    'Doanh thu thực thu (VND)',
    'HĐ đang thuê',
    'HĐ quá hạn',
  ]
  const lines = rows.map((row) =>
    [
      `"${row.name.replace(/"/g, '""')}"`,
      row.unitTotal,
      row.unitOccupied,
      row.unitAvailable,
      row.occupancyRate,
      row.revenue,
      row.activeRentals,
      row.overdueRentals,
    ].join(','),
  )
  const csv = `\uFEFF${[header.join(','), ...lines].join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `bao-cao-van-hanh-${period}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function OperationsReportsPage() {
  const { facilities } = useSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sortKey, setSortKey] = useState<SortKey>('revenue')
  const [sortAsc, setSortAsc] = useState(false)

  const periodParam = searchParams.get('period')
  const facilityParam = searchParams.get('facility')
  const period: ReportPeriod =
    periodParam && PERIOD_IDS.includes(periodParam as ReportPeriod)
      ? (periodParam as ReportPeriod)
      : 'quarter'
  const facilityId = facilityParam ? Number(facilityParam) : null

  const { summary, loading, error, reload } = useReportSummary({ period, facilityId })

  const setFilter = (key: 'period' | 'facility', value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setSearchParams(next, { replace: true })
  }

  const sortedRows = useMemo(() => {
    if (!summary) {
      return []
    }
    return [...summary.rows].sort((a, b) => {
      const left = a[sortKey]
      const right = b[sortKey]
      const result =
        typeof left === 'string' && typeof right === 'string'
          ? left.localeCompare(right, 'vi')
          : Number(left) - Number(right)
      return sortAsc ? result : -result
    })
  }, [summary, sortKey, sortAsc])

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc((current) => !current)
    } else {
      setSortKey(key)
      setSortAsc(key === 'name')
    }
  }

  const maxRevenue = summary ? Math.max(...summary.revenuePoints.map((point) => point.amount), 1) : 1

  return (
    <div>
      <div>
        <p className="text-badge-caption uppercase tracking-wider text-text-muted">Trụ sở & Quản trị</p>
        <h1 className="mt-1 text-page-title text-text-main">Báo cáo vận hành toàn mạng</h1>
        <p className="mt-space-xs text-body-default text-text-muted">
          Chỉ số lấp đầy, doanh thu thực thu và hợp đồng trên toàn hệ thống cơ sở.
        </p>
      </div>

      <div className="mt-space-lg flex flex-col lg:flex-row lg:items-center gap-space-md">
        <div className="flex items-center gap-1 flex-wrap">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={period === option.id}
              onClick={() => setFilter('period', option.id)}
              className={`h-11 px-space-md rounded-lg text-label-help font-medium transition-colors ${
                period === option.id
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-text-muted border border-border-hairline hover:text-text-main'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label htmlFor="report-facility" className="sr-only">
          Cơ sở
        </label>
        <select
          id="report-facility"
          value={facilityParam ?? ''}
          onChange={(event) => setFilter('facility', event.target.value)}
          className="h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring lg:w-[240px]"
        >
          <option value="">Tất cả cơ sở</option>
          {facilities.map((facility) => (
            <option key={facility.id} value={facility.id}>
              {facility.name}
            </option>
          ))}
        </select>
        <div className="lg:ml-auto">
          <Button
            variant="outline"
            disabled={!summary || sortedRows.length === 0}
            onClick={() => summary && exportCsv(sortedRows, period)}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              download
            </span>
            Xuất CSV
          </Button>
        </div>
      </div>

      {error ? (
        <div className="text-center py-space-4xl">
          <p role="alert" className="text-body-default text-danger">
            {error}
          </p>
          <Button variant="outline" className="mt-space-md" onClick={() => void reload()}>
            Thử lại
          </Button>
        </div>
      ) : loading || !summary ? (
        <div className="mt-space-lg space-y-3" role="status">
          <span className="sr-only">Đang tải báo cáo…</span>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 rounded-xl bg-surface-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-space-lg grid grid-cols-2 xl:grid-cols-4 gap-space-md">
            <div
              className="bg-surface rounded-xl border border-border-hairline p-space-xl"
              title="Tổng các khoản thanh toán thành công trong khoảng thời gian đã chọn."
            >
              <p className="text-label-help text-text-muted">Doanh thu thực thu</p>
              <p className="mt-1 text-kpi-metric text-text-main tabular-nums">
                {formatCurrency(summary.totalRevenue)}
              </p>
              <p className="mt-1 text-badge-caption text-text-muted">Kỳ đã chọn • chưa gồm VAT</p>
            </div>
            <div
              className="bg-surface rounded-xl border border-border-hairline p-space-xl"
              title="Kho đang thuê / tổng kho tại thời điểm hiện tại (không phụ thuộc kỳ đã chọn)."
            >
              <p className="text-label-help text-text-muted">Tỷ lệ lấp đầy</p>
              <p className="mt-1 text-kpi-metric text-text-main tabular-nums">{summary.occupancyRate}%</p>
              <p className="mt-1 text-badge-caption text-text-muted">Toàn mạng • thời điểm hiện tại</p>
            </div>
            <div
              className="bg-surface rounded-xl border border-border-hairline p-space-xl"
              title="Số hợp đồng ở trạng thái Đang thuê tại thời điểm hiện tại."
            >
              <p className="text-label-help text-text-muted">Hợp đồng đang thuê</p>
              <p className="mt-1 text-kpi-metric text-text-main tabular-nums">
                {formatNumber(summary.activeRentals)}
              </p>
              <p className="mt-1 text-badge-caption text-text-muted">Toàn mạng • thời điểm hiện tại</p>
            </div>
            <div
              className="bg-surface rounded-xl border border-border-hairline p-space-xl"
              title="Số hợp đồng ở trạng thái Quá hạn tại thời điểm hiện tại."
            >
              <p className="text-label-help text-text-muted">Hợp đồng quá hạn</p>
              <p className="mt-1 text-kpi-metric text-text-main tabular-nums">
                {formatNumber(summary.overdueRentals)}
              </p>
              <p className="mt-1 text-badge-caption text-text-muted">Toàn mạng • thời điểm hiện tại</p>
            </div>
          </div>

          <div className="mt-space-lg grid grid-cols-1 xl:grid-cols-2 gap-space-md">
            <section className="bg-surface rounded-xl border border-border-hairline p-space-xl">
              <h2 className="text-subsection text-text-main">Doanh thu thực thu theo tháng</h2>
              {summary.revenuePoints.length === 0 ? (
                <EmptyState icon="bar_chart" title="Không có dữ liệu trong kỳ đã chọn." />
              ) : (
                <div className="mt-space-md flex items-end gap-2 h-44" role="img" aria-label="Biểu đồ doanh thu theo tháng">
                  {summary.revenuePoints.map((point) => (
                    <div key={point.month} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                      <span className="text-[10px] text-text-muted tabular-nums">
                        {Math.round(point.amount / 1_000_000)}Tr
                      </span>
                      <div
                        className="w-full rounded-t bg-primary/80"
                        style={{ height: `${Math.max(4, (point.amount / maxRevenue) * 100)}%` }}
                      />
                      <span className="text-[10px] text-text-muted">{point.label.split('/')[0]}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-surface rounded-xl border border-border-hairline p-space-xl">
              <h2 className="text-subsection text-text-main">Tỷ lệ lấp đầy theo cơ sở</h2>
              <ul className="mt-space-md space-y-space-md">
                {sortedRows.map((row) => (
                  <li key={row.facilityId}>
                    <div className="flex items-baseline justify-between text-label-help">
                      <span className="text-text-main font-medium">{row.name}</span>
                      <span className="text-text-muted tabular-nums">
                        {row.unitOccupied}/{row.unitTotal} • {row.occupancyRate}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-surface-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${row.occupancyRate}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-space-lg bg-surface rounded-xl border border-border-hairline overflow-hidden">
            <div className="px-space-lg py-space-md border-b border-border-hairline">
              <h2 className="text-subsection text-text-main">Hiệu quả vận hành theo cơ sở</h2>
              <p className="text-label-help text-text-muted">
                Nhấn tiêu đề cột để sắp xếp. Doanh thu tính theo thanh toán thành công trong kỳ.
              </p>
            </div>
            {sortedRows.length === 0 ? (
              <EmptyState
                title="Không có dữ liệu trong khoảng thời gian đã chọn."
                action={
                  <Button variant="outline" onClick={() => setFilter('period', 'year')}>
                    Đổi khoảng thời gian
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-ui-table">
                  <thead>
                    <tr className="bg-surface-muted text-left text-text-muted">
                      {SORT_COLUMNS.map((column) => (
                        <th
                          key={column.key}
                          scope="col"
                          className={`px-space-lg py-space-md font-semibold ${
                            column.numeric ? 'text-right' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSort(column.key)}
                            className={`inline-flex items-center gap-1 hover:text-text-main ${
                              sortKey === column.key ? 'text-primary font-semibold' : ''
                            }`}
                          >
                            {column.label}
                            {sortKey === column.key && (
                              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                                {sortAsc ? 'arrow_upward' : 'arrow_downward'}
                              </span>
                            )}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row) => (
                      <tr key={row.facilityId} className="border-b border-border-subtle last:border-b-0">
                        <td className="px-space-lg py-space-md font-medium text-text-main">{row.name}</td>
                        <td className="px-space-lg py-space-md text-right tabular-nums">
                          {formatNumber(row.unitTotal)}
                        </td>
                        <td className="px-space-lg py-space-md text-right tabular-nums">
                          {formatNumber(row.unitOccupied)}
                        </td>
                        <td className="px-space-lg py-space-md text-right tabular-nums">
                          {formatNumber(row.unitAvailable)}
                        </td>
                        <td className="px-space-lg py-space-md text-right tabular-nums">{row.occupancyRate}%</td>
                        <td className="px-space-lg py-space-md text-right tabular-nums">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="px-space-lg py-space-md text-right tabular-nums">
                          {formatNumber(row.activeRentals)}
                        </td>
                        <td className="px-space-lg py-space-md text-right tabular-nums">
                          {formatNumber(row.overdueRentals)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
