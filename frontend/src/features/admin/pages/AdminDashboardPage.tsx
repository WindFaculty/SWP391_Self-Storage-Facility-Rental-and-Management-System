import {
  Activity,
  ArrowRight,
  Building2,
  CreditCard,
  FileText,
  HardDrive,
  LifeBuoy,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { ROLE_LABELS } from '../../../app/providers/session-context'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import type { StatusTone } from '../../../components/ui/StatusLabel'
import { formatDateTime, formatNumber, formatTime } from '../../../lib/format'
import { SystemActivityChart } from '../components/SystemActivityChart'
import { useSystemUsage } from '../hooks/useAdmin'
import type { UsagePeriodDays } from '../types'
import {
  formatBytes,
  getEventTone,
  getUsageActionLabel,
  parseUsageDays,
  ROLE_BAR_CLASSES,
  USAGE_PERIOD_OPTIONS,
} from '../usagePresentation'

const TONE_DOT: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-neutral-strong',
}

export function AdminDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const days = parseUsageDays(searchParams.get('days'))
  const { dashboard, loading, refreshing, error, reload } = useSystemUsage(days)

  const selectDays = (nextDays: UsagePeriodDays) => {
    const next = new URLSearchParams(searchParams)
    next.set('days', String(nextDays))
    setSearchParams(next, { replace: true })
  }

  return (
    <div>
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-lg">
        <div>
          <p className="text-badge-caption uppercase tracking-wider text-text-muted">
            Quản trị hệ thống
          </p>
          <h1 className="mt-1 text-page-title text-text-main">Dashboard sử dụng hệ thống</h1>
          <p className="mt-space-xs text-body-default text-text-muted">
            Theo dõi mức độ sử dụng nền tảng, phiên truy cập, trạng thái phân hệ và tín hiệu bảo mật
            toàn hệ thống.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm">
          <div
            className="inline-flex items-center gap-1 rounded-lg bg-surface p-1 border border-border-hairline"
            role="group"
            aria-label="Khoảng thời gian thống kê"
          >
            {USAGE_PERIOD_OPTIONS.map((option) => (
              <button
                key={option.days}
                type="button"
                aria-pressed={days === option.days}
                onClick={() => selectDays(option.days)}
                className={`h-9 px-3 rounded-md text-label-help font-medium transition-colors cursor-pointer ${
                  days === option.days
                    ? 'bg-primary text-on-primary'
                    : 'text-text-muted hover:text-text-main hover:bg-surface-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            isLoading={refreshing}
            onClick={() => void reload()}
            className="h-11"
          >
            Làm mới
          </Button>

          <Link
            to="/admin/security"
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-md bg-forest-tint px-3 text-label font-medium text-secondary-text transition duration-150 ease-standard hover:brightness-95 dark:hover:brightness-110"
          >
            <ShieldCheck className="size-4" aria-hidden="true" />
            Quản trị & Bảo mật
          </Link>
        </div>
      </div>

      {dashboard && (
        <p className="mt-space-sm text-badge-caption text-text-muted">
          Dữ liệu tổng hợp trực tiếp từ cơ sở dữ liệu • Cập nhật lúc{' '}
          <span className="text-text-main font-medium tabular-nums">
            {formatTime(dashboard.generatedAt)}
          </span>
        </p>
      )}

      {error ? (
        <div className="mt-space-xl bg-surface rounded-xl border border-border-hairline p-space-3xl text-center">
          <p role="alert" className="text-body-default text-danger">
            {error}
          </p>
          <Button variant="outline" className="mt-space-md" onClick={() => void reload()}>
            Thử lại
          </Button>
        </div>
      ) : loading || !dashboard ? (
        <DashboardSkeleton />
      ) : (
        <DashboardContent dashboard={dashboard} days={days} />
      )}
    </div>
  )
}

function DashboardContent({
  dashboard,
  days,
}: {
  dashboard: NonNullable<ReturnType<typeof useSystemUsage>['dashboard']>
  days: UsagePeriodDays
}) {
  const { overview, auth, usersByRole, dailyActivity, topActions, platform, recentEvents } =
    dashboard

  const hasLoginWarnings = auth.loginFailedCount > 0
  const maxActionCount = Math.max(...topActions.map((item) => item.count), 1)

  const rentalPipelineCount =
    platform.activeRentals +
    platform.reservedRentals +
    platform.pendingPaymentRentals +
    platform.returnRequestedRentals +
    platform.overdueRentals

  const rentalSegments = [
    { key: 'active', label: 'Đang thuê', value: platform.activeRentals, bar: 'bg-primary' },
    {
      key: 'reserved',
      label: 'Giữ chỗ / Chờ TT',
      value: platform.reservedRentals + platform.pendingPaymentRentals,
      bar: 'bg-info',
    },
    {
      key: 'return',
      label: 'Yêu cầu trả kho',
      value: platform.returnRequestedRentals,
      bar: 'bg-warning',
    },
    { key: 'overdue', label: 'Quá hạn', value: platform.overdueRentals, bar: 'bg-danger' },
  ]

  return (
    <>
      <section
        aria-label="Chỉ số tổng quan hệ thống"
        className="mt-space-lg grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md"
      >
        <div className="bg-surface rounded-xl border border-border-hairline p-space-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-label-help text-text-muted">Tài khoản hoạt động</p>
            <span className="size-9 rounded-lg bg-forest-tint text-primary flex items-center justify-center shrink-0">
              <Users className="size-[18px]" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-space-md flex items-baseline gap-2 tabular-nums">
            <span className="text-kpi-metric text-text-main">
              {formatNumber(overview.activeUsers)}
            </span>
            <span className="text-body-default text-text-muted">
              / {formatNumber(overview.totalUsers)}
            </span>
          </div>
          <p className="mt-space-xs text-badge-caption text-text-muted">
            <span className="text-primary font-medium">+{formatNumber(overview.newUsersInPeriod)}</span>{' '}
            mới ({days} ngày) • {formatNumber(overview.disabledUsers)} vô hiệu hóa
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-border-hairline p-space-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-label-help text-text-muted">Tương tác & Phiên truy cập</p>
            <span className="size-9 rounded-lg bg-info-bg text-info flex items-center justify-center shrink-0">
              <Activity className="size-[18px]" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-space-md flex items-baseline gap-2 tabular-nums">
            <span className="text-kpi-metric text-text-main">
              {formatNumber(overview.totalEventsInPeriod)}
            </span>
            <span className="text-label-help text-text-muted">sự kiện</span>
          </div>
          <p className="mt-space-xs text-badge-caption text-text-muted">
            {formatNumber(overview.activeSessionUsers)} tài khoản có phiên (
            {formatNumber(overview.activeSessions)} token) • {formatNumber(overview.uniqueIpsInPeriod)}{' '}
            IP
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-border-hairline p-space-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-label-help text-text-muted">An toàn đăng nhập</p>
            <span
              className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                hasLoginWarnings ? 'bg-warning-bg text-warning' : 'bg-success-bg text-success'
              }`}
            >
              {hasLoginWarnings ? (
                <ShieldAlert className="size-[18px]" aria-hidden="true" />
              ) : (
                <ShieldCheck className="size-[18px]" aria-hidden="true" />
              )}
            </span>
          </div>
          <div className="mt-space-md flex items-baseline gap-2 tabular-nums">
            <span className="text-kpi-metric text-text-main">
              {auth.loginSuccessRate === null ? '—' : `${auth.loginSuccessRate}%`}
            </span>
            <span className="text-label-help text-text-muted">thành công</span>
          </div>
          <p className="mt-space-xs text-badge-caption text-text-muted">
            {formatNumber(auth.loginSuccessCount)} thành công •{' '}
            <span className={hasLoginWarnings ? 'text-danger font-medium' : ''}>
              {formatNumber(auth.loginFailedCount)} thất bại
            </span>
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-border-hairline p-space-xl flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-label-help text-text-muted">Khai thác hạ tầng kho</p>
            <span className="size-9 rounded-lg bg-forest-tint text-primary flex items-center justify-center shrink-0">
              <Building2 className="size-[18px]" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-space-md flex items-baseline gap-2 tabular-nums">
            <span className="text-kpi-metric text-text-main">{overview.occupancyRate}%</span>
            <span className="text-label-help text-text-muted">lấp đầy</span>
          </div>
          <p className="mt-space-xs text-badge-caption text-text-muted">
            {formatNumber(overview.occupiedUnits)}/{formatNumber(overview.totalUnits)} ô kho •{' '}
            {formatNumber(overview.activeFacilities)}/{formatNumber(overview.totalFacilities)} cơ sở
            mở
          </p>
        </div>
      </section>

      <div className="mt-space-lg grid grid-cols-1 xl:grid-cols-12 gap-space-md">
        <section className="xl:col-span-8 bg-surface rounded-xl border border-border-hairline p-space-xl flex flex-col justify-between">
          <SystemActivityChart
            points={dailyActivity}
            periodDays={days}
            totalEvents={overview.totalEventsInPeriod}
          />

          <dl className="mt-space-lg pt-space-md border-t border-border-subtle grid grid-cols-2 sm:grid-cols-4 gap-space-md">
            <div>
              <dt className="text-badge-caption text-text-muted">Tài khoản tương tác</dt>
              <dd className="mt-0.5 text-subsection text-text-main tabular-nums">
                {formatNumber(overview.activeActorsInPeriod)}
              </dd>
            </div>
            <div>
              <dt className="text-badge-caption text-text-muted">Đăng ký mới ({days} ngày)</dt>
              <dd className="mt-0.5 text-subsection text-text-main tabular-nums">
                {formatNumber(auth.registrationsCount)}
              </dd>
            </div>
            <div>
              <dt className="text-badge-caption text-text-muted">Thao tác quản trị</dt>
              <dd className="mt-0.5 text-subsection text-text-main tabular-nums">
                {formatNumber(auth.adminChangesCount)}
              </dd>
            </div>
            <div>
              <dt className="text-badge-caption text-text-muted">Tài khoản liên kết Google</dt>
              <dd className="mt-0.5 text-subsection text-text-main tabular-nums">
                {formatNumber(overview.googleLinkedUsers)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="xl:col-span-4 bg-surface rounded-xl border border-border-hairline p-space-xl flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-subsection text-text-main">Phân bổ theo vai trò</h2>
              <span className="text-badge-caption text-text-muted tabular-nums">
                {formatNumber(overview.totalUsers)} tài khoản
              </span>
            </div>
            <p className="mt-0.5 text-label-help text-text-muted">
              Mô hình một vai trò chính trên toàn nền tảng.
            </p>

            <ul className="mt-space-lg space-y-space-md">
              {usersByRole.map((row) => {
                const share =
                  overview.totalUsers > 0
                    ? Math.round((row.total / overview.totalUsers) * 1000) / 10
                    : 0
                return (
                  <li key={row.role}>
                    <div className="flex items-baseline justify-between gap-2 text-label-help">
                      <span className="text-text-main font-medium truncate">
                        {ROLE_LABELS[row.role] ?? row.role}
                      </span>
                      <span className="text-text-muted tabular-nums shrink-0">
                        <strong className="text-text-main">{formatNumber(row.active)}</strong>
                        {row.disabled > 0 && (
                          <span className="text-danger"> / {formatNumber(row.total)}</span>
                        )}{' '}
                        ({share}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-surface-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${ROLE_BAR_CLASSES[row.role] ?? 'bg-primary'}`}
                        style={{ width: `${row.total === 0 ? 0 : Math.max(4, share)}%` }}
                      />
                    </div>
                    {(row.newInPeriod > 0 || row.disabled > 0) && (
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-text-muted tabular-nums">
                        {row.newInPeriod > 0 && (
                          <span className="text-primary">+{formatNumber(row.newInPeriod)} mới</span>
                        )}
                        {row.disabled > 0 && (
                          <span className="text-danger">
                            {formatNumber(row.disabled)} vô hiệu hóa
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="mt-space-lg pt-space-md border-t border-border-subtle">
            <Link
              to="/admin/security"
              className="inline-flex items-center gap-1.5 text-label-help font-medium text-primary hover:underline"
            >
              Quản lý tài khoản & phân quyền
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>

      <section aria-label="Mức độ sử dụng theo phân hệ" className="mt-space-lg">
        <h2 className="text-subsection text-text-main">Mức độ sử dụng theo phân hệ</h2>
        <div className="mt-space-md grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
          <div className="bg-surface rounded-xl border border-border-hairline p-space-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-body-medium text-text-main">Hợp đồng lưu trữ</h3>
                <FileText className="size-4 text-primary shrink-0" aria-hidden="true" />
              </div>
              <div className="mt-space-sm flex items-baseline gap-2 tabular-nums">
                <span className="text-section-title text-text-main">
                  {formatNumber(platform.totalRentals)}
                </span>
                <span className="text-badge-caption text-primary">
                  +{formatNumber(platform.newRentalsInPeriod)} ({days} ngày)
                </span>
              </div>

              <div
                className="mt-space-md h-2 rounded-full bg-surface-muted overflow-hidden flex"
                aria-hidden="true"
              >
                {rentalPipelineCount > 0 &&
                  rentalSegments
                    .filter((segment) => segment.value > 0)
                    .map((segment) => (
                      <span
                        key={segment.key}
                        className={`h-full ${segment.bar}`}
                        style={{ width: `${(segment.value / rentalPipelineCount) * 100}%` }}
                      />
                    ))}
              </div>
            </div>

            <dl className="mt-space-md space-y-1.5 text-label-help">
              {rentalSegments.map((segment) => (
                <div key={segment.key} className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-text-muted">
                    <span className={`size-2 rounded-full ${segment.bar}`} aria-hidden="true" />
                    {segment.label}
                  </dt>
                  <dd
                    className={`tabular-nums font-medium ${
                      segment.key === 'overdue' && segment.value > 0
                        ? 'text-danger'
                        : 'text-text-main'
                    }`}
                  >
                    {formatNumber(segment.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-surface rounded-xl border border-border-hairline p-space-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-body-medium text-text-main">Thanh toán & Hóa đơn</h3>
                <CreditCard className="size-4 text-primary shrink-0" aria-hidden="true" />
              </div>
              <div className="mt-space-sm flex items-baseline gap-2 tabular-nums">
                <span className="text-section-title text-text-main">
                  {platform.paymentSuccessRate === null ? '—' : `${platform.paymentSuccessRate}%`}
                </span>
                <span className="text-badge-caption text-text-muted">
                  thành công ({days} ngày)
                </span>
              </div>
              <div className="mt-space-md h-2 rounded-full bg-surface-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${platform.paymentSuccessRate ?? 0}%` }}
                />
              </div>
            </div>

            <dl className="mt-space-md space-y-1.5 text-label-help">
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Lượt TT ({days} ngày)</dt>
                <dd className="tabular-nums font-medium text-text-main">
                  {formatNumber(platform.paymentAttemptsInPeriod)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Thành công / Thất bại</dt>
                <dd className="tabular-nums font-medium text-text-main">
                  <span className="text-success">{formatNumber(platform.paymentSuccessInPeriod)}</span>
                  {' / '}
                  <span className={platform.paymentFailedInPeriod > 0 ? 'text-danger' : ''}>
                    {formatNumber(platform.paymentFailedInPeriod)}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Hóa đơn đã thu</dt>
                <dd className="tabular-nums font-medium text-text-main">
                  {formatNumber(platform.paidInvoices)} / {formatNumber(platform.totalInvoices)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Hóa đơn chờ thanh toán</dt>
                <dd
                  className={`tabular-nums font-medium ${
                    platform.pendingInvoices > 0 ? 'text-warning' : 'text-text-main'
                  }`}
                >
                  {formatNumber(platform.pendingInvoices)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-surface rounded-xl border border-border-hairline p-space-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-body-medium text-text-main">Hỗ trợ & Công việc</h3>
                <LifeBuoy className="size-4 text-primary shrink-0" aria-hidden="true" />
              </div>
              <div className="mt-space-sm flex items-baseline gap-2 tabular-nums">
                <span className="text-section-title text-text-main">
                  {formatNumber(platform.openTickets + platform.openTasks)}
                </span>
                <span className="text-badge-caption text-text-muted">đầu việc đang mở</span>
              </div>
            </div>

            <dl className="mt-space-md space-y-1.5 text-label-help">
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Ticket đang mở</dt>
                <dd
                  className={`tabular-nums font-medium ${
                    platform.openTickets > 0 ? 'text-warning' : 'text-text-main'
                  }`}
                >
                  {formatNumber(platform.openTickets)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Ticket đã xử lý</dt>
                <dd className="tabular-nums font-medium text-text-main">
                  {formatNumber(platform.resolvedTickets)} / {formatNumber(platform.totalTickets)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Ticket mới ({days} ngày)</dt>
                <dd className="tabular-nums font-medium text-text-main">
                  {formatNumber(platform.ticketsInPeriod)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Công việc mở / hoàn thành</dt>
                <dd className="tabular-nums font-medium text-text-main">
                  {formatNumber(platform.openTasks)} / {formatNumber(platform.completedTasks)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-surface rounded-xl border border-border-hairline p-space-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-body-medium text-text-main">Hành vi & Lưu trữ media</h3>
                <HardDrive className="size-4 text-primary shrink-0" aria-hidden="true" />
              </div>

              {topActions.length === 0 ? (
                <p className="mt-space-md text-label-help text-text-muted">
                  Chưa có hành vi nào được ghi nhận trong {days} ngày qua.
                </p>
              ) : (
                <ul className="mt-space-md space-y-2">
                  {topActions.slice(0, 4).map((item) => (
                    <li key={item.action}>
                      <div className="flex items-baseline justify-between gap-2 text-badge-caption">
                        <span className="text-text-main truncate">
                          {getUsageActionLabel(item.action)}
                        </span>
                        <span className="text-text-muted tabular-nums shrink-0">
                          {formatNumber(item.count)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-surface-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/75"
                          style={{
                            width: `${Math.max(8, (item.count / maxActionCount) * 100)}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-space-md pt-space-sm border-t border-border-subtle flex items-center justify-between text-badge-caption text-text-muted tabular-nums">
              <span>{formatNumber(platform.uploadedImageCount)} tệp ảnh tải lên</span>
              <span className="text-text-main font-medium">
                {formatBytes(platform.mediaStorageBytes)} • {formatNumber(platform.totalImageCount)}{' '}
                ảnh
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-space-lg bg-surface rounded-xl border border-border-hairline overflow-hidden">
        <div className="px-space-xl py-space-md border-b border-border-hairline flex items-center justify-between gap-2">
          <div>
            <h2 className="text-subsection text-text-main">Nhật ký hệ thống gần đây</h2>
            <p className="text-label-help text-text-muted">
              Các sự kiện đăng nhập và thao tác quản trị mới nhất trên toàn hệ thống.
            </p>
          </div>
          <Link
            to="/admin/security"
            className="shrink-0 text-label-help font-medium text-primary hover:underline"
          >
            Xem toàn bộ
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <EmptyState icon="history" title="Chưa có nhật ký hoạt động nào." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-ui-table">
              <thead>
                <tr className="bg-surface-muted text-left text-text-muted">
                  <th scope="col" className="px-space-xl py-space-md font-semibold">
                    Thời gian
                  </th>
                  <th scope="col" className="px-space-lg py-space-md font-semibold">
                    Hành vi
                  </th>
                  <th scope="col" className="px-space-lg py-space-md font-semibold">
                    Người thực hiện
                  </th>
                  <th scope="col" className="px-space-lg py-space-md font-semibold">
                    Đối tượng
                  </th>
                  <th scope="col" className="px-space-xl py-space-md font-semibold text-right">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event) => {
                  const tone = getEventTone(event.action)
                  return (
                    <tr
                      key={event.id}
                      className="border-b border-border-subtle last:border-b-0"
                    >
                      <td className="px-space-xl py-space-md whitespace-nowrap tabular-nums text-text-main">
                        {event.createdAt ? formatDateTime(event.createdAt) : '—'}
                      </td>
                      <td className="px-space-lg py-space-md">
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full shrink-0 ${TONE_DOT[tone]}`}
                            aria-hidden="true"
                          />
                          <div>
                            <span className="block font-medium text-text-main">
                              {getUsageActionLabel(event.action)}
                            </span>
                            <span className="block text-badge-caption text-text-muted">
                              {event.action}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-space-lg py-space-md text-text-main">
                        {event.actorName ?? 'Hệ thống / Chưa xác thực'}
                      </td>
                      <td className="px-space-lg py-space-md text-text-muted">
                        {event.entityType
                          ? `${event.entityType}${event.entityId ? ` #${event.entityId}` : ''}`
                          : '—'}
                      </td>
                      <td className="px-space-xl py-space-md text-right font-mono text-badge-caption text-text-muted">
                        {event.ipAddress ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <div className="mt-space-lg space-y-space-lg" role="status">
      <span className="sr-only">Đang tải dashboard sử dụng hệ thống…</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 rounded-xl bg-surface-muted animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md">
        <div className="xl:col-span-8 h-80 rounded-xl bg-surface-muted animate-pulse" />
        <div className="xl:col-span-4 h-80 rounded-xl bg-surface-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-44 rounded-xl bg-surface-muted animate-pulse" />
        ))}
      </div>
    </div>
  )
}
