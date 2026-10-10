import { Link } from 'react-router-dom'
import { useSession } from '../../../app/providers/SessionProvider'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { formatCurrency, formatDate, formatNumber } from '../../../lib/format'
import type { DashboardAttentionItem } from '../api/dashboardApi'
import { useFacilityDashboard } from '../hooks/useFacilityDashboard'

const SEVERITY_DOT: Record<DashboardAttentionItem['severity'], string> = {
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
}

export function FacilityDashboardPage() {
  const { activeFacilityId, facilitiesInScope } = useSession()
  const facilityId = activeFacilityId ?? 0
  const facility = facilitiesInScope.find((item) => item.id === facilityId)
  const { dashboard, revenuePoints, loading, error, reload } = useFacilityDashboard(facilityId)

  if (error) {
    return (
      <div className="text-center py-space-4xl">
        <p role="alert" className="text-body-default text-danger">
          {error}
        </p>
        <Button variant="outline" className="mt-space-md" onClick={() => void reload()}>
          Thử lại
        </Button>
      </div>
    )
  }

  if (loading || !dashboard) {
    return (
      <div className="space-y-3" role="status">
        <span className="sr-only">Đang tải tổng quan cơ sở…</span>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl bg-surface-muted animate-pulse" />
        ))}
      </div>
    )
  }

  const monthRevenue = revenuePoints[revenuePoints.length - 1]?.amount ?? 0
  const maxRevenue = Math.max(...revenuePoints.map((point) => point.amount), 1)

  const kpis = [
    {
      label: 'Tỷ lệ lấp đầy',
      value: `${dashboard.occupancyRate}%`,
      note: `${formatNumber(dashboard.unitOccupied)}/${formatNumber(dashboard.unitTotal)} kho đang thuê`,
    },
    {
      label: 'Kho khả dụng',
      value: formatNumber(dashboard.unitAvailable),
      note: 'Sẵn sàng bàn giao',
    },
    {
      label: 'Hợp đồng đang thuê',
      value: formatNumber(dashboard.activeRentals),
      note: `${formatNumber(dashboard.expiringRentals)} sắp hết hạn trong 14 ngày`,
    },
    {
      label: 'Hợp đồng quá hạn',
      value: formatNumber(dashboard.overdueRentals),
      note: 'Cần xử lý theo chính sách',
    },
  ]

  return (
    <div>
      <div>
        <p className="text-badge-caption uppercase tracking-wider text-text-muted">Cơ sở vận hành</p>
        <h1 className="mt-1 text-page-title text-text-main">
          Tổng quan cơ sở{facility ? ` — ${facility.name}` : ''}
        </h1>
        <p className="mt-space-xs text-body-default text-text-muted">
          Hôm nay có {formatNumber(dashboard.tasksOpen)} việc đang mở và{' '}
          {formatNumber(dashboard.activeTickets)} ticket cần xử lý tại cơ sở.
        </p>
      </div>

      <div className="mt-space-lg grid grid-cols-2 xl:grid-cols-4 gap-space-md">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-surface rounded-xl border border-border-hairline p-space-xl">
            <p className="text-label-help text-text-muted">{kpi.label}</p>
            <p className="mt-1 text-kpi-metric text-text-main tabular-nums">{kpi.value}</p>
            <p className="mt-1 text-badge-caption text-text-muted">{kpi.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-space-lg grid grid-cols-1 xl:grid-cols-3 gap-space-md">
        <section className="xl:col-span-2 bg-surface rounded-xl border border-border-hairline p-space-xl">
          <h2 className="text-subsection text-text-main">Việc cần chú ý hôm nay</h2>
          {dashboard.attention.length === 0 ? (
            <EmptyState
              icon="task_alt"
              title="Không có việc tồn đọng."
              description="Hợp đồng, kho và ticket tại cơ sở đều trong trạng thái bình thường."
            />
          ) : (
            <ul className="mt-space-sm divide-y divide-border-subtle">
              {dashboard.attention.slice(0, 8).map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-space-md py-space-sm">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${SEVERITY_DOT[item.severity]}`}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-body-medium text-text-main">{item.title}</p>
                      <p className="text-label-help text-text-muted">{item.detail}</p>
                    </div>
                  </div>
                  <Link
                    to={item.path}
                    className="shrink-0 text-label-help font-medium text-primary hover:underline"
                  >
                    Xử lý
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-surface rounded-xl border border-border-hairline p-space-xl">
          <h2 className="text-subsection text-text-main">Công việc & hỗ trợ</h2>
          <dl className="mt-space-sm">
            <div className="flex items-baseline justify-between py-space-sm border-b border-border-subtle">
              <dt className="text-label-help text-text-muted">Việc trong ca hôm nay</dt>
              <dd className="text-body-medium text-text-main tabular-nums">
                {formatNumber(dashboard.tasksToday)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between py-space-sm border-b border-border-subtle">
              <dt className="text-label-help text-text-muted">Việc đang mở</dt>
              <dd className="text-body-medium text-text-main tabular-nums">
                {formatNumber(dashboard.tasksOpen)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between py-space-sm">
              <dt className="text-label-help text-text-muted">Ticket đang xử lý</dt>
              <dd className="text-body-medium text-text-main tabular-nums">
                {formatNumber(dashboard.activeTickets)}
              </dd>
            </div>
          </dl>
          <div className="mt-space-md flex flex-col gap-2">
            <Link to="/staff/operations">
              <Button variant="outline" className="w-full">
                Mở danh sách công việc
              </Button>
            </Link>
            <Link to="/facility/units">
              <Button variant="outline" className="w-full">
                Quản lý kho lưu trữ
              </Button>
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-space-lg grid grid-cols-1 xl:grid-cols-2 gap-space-md">
        <section className="bg-surface rounded-xl border border-border-hairline p-space-xl">
          <div className="flex items-baseline justify-between">
            <h2 className="text-subsection text-text-main">Thực thu 6 tháng gần nhất</h2>
            <span className="text-label-help text-text-muted">
              Tháng này: {formatCurrency(monthRevenue)}
            </span>
          </div>
          <div className="mt-space-md flex items-end gap-2 h-40" role="img" aria-label="Biểu đồ thực thu 6 tháng">
            {revenuePoints.map((point) => (
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
        </section>

        <section className="bg-surface rounded-xl border border-border-hairline p-space-xl">
          <h2 className="text-subsection text-text-main">Công suất theo loại kho</h2>
          <ul className="mt-space-md space-y-space-md">
            {dashboard.occupancyByType.map((item) => (
              <li key={item.name}>
                <div className="flex items-baseline justify-between text-label-help">
                  <span className="text-text-main font-medium">{item.name}</span>
                  <span className="text-text-muted tabular-nums">
                    {item.occupied}/{item.total} • {item.rate}%
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${item.rate}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-space-lg bg-surface rounded-xl border border-border-hairline overflow-hidden">
        <div className="flex items-center justify-between gap-space-md px-space-lg py-space-md border-b border-border-hairline">
          <h2 className="text-subsection text-text-main">Hợp đồng sắp hết hạn trong 14 ngày</h2>
          <Link to="/facility/rentals" className="text-label-help font-medium text-primary hover:underline">
            Xem tất cả hợp đồng
          </Link>
        </div>
        {dashboard.expiringRentalList.length === 0 ? (
          <EmptyState icon="event_available" title="Không có hợp đồng sắp hết hạn." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-ui-table">
              <thead>
                <tr className="bg-surface-muted text-left text-text-muted">
                  <th scope="col" className="px-space-lg py-space-md font-semibold">Mã HĐ</th>
                  <th scope="col" className="px-space-lg py-space-md font-semibold">Khách hàng</th>
                  <th scope="col" className="px-space-lg py-space-md font-semibold">Kho</th>
                  <th scope="col" className="px-space-lg py-space-md font-semibold">Ngày hết hạn</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.expiringRentalList.slice(0, 6).map((rental) => (
                  <tr key={rental.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-space-lg py-space-md font-medium text-text-main">#{rental.id}</td>
                    <td className="px-space-lg py-space-md">{rental.customerName}</td>
                    <td className="px-space-lg py-space-md">
                      {rental.unitCode} ({rental.unitTypeName})
                    </td>
                    <td className="px-space-lg py-space-md">{formatDate(rental.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
