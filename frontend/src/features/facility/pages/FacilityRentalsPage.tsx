import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSession } from '../../../app/providers/SessionProvider'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Tabs } from '../../../components/ui/Tabs'
import { formatDate, formatNumber, formatTime } from '../../../lib/format'
import { assignTask } from '../api/rentalOpsApi'
import { AssignTaskModal, type AssignTaskFormInput } from '../components/AssignTaskModal'
import { RentalDrawer } from '../components/RentalDrawer'
import { PaymentStateLabel, RentalStatusLabel } from '../components/StatusLabels'
import { useRentals, useStaffMembers, useStaffTasks } from '../hooks/useRentalOps'
import { useUnitTypes } from '../hooks/useUnitTypes'
import { isSameDay, PAYMENT_STATE_LABELS } from '../rentalRules'
import type { PaymentState, Rental, RentalFilters, RentalTab, TaskFilters } from '../types'

const PAGE_SIZE = 8
const RENTAL_TABS: RentalTab[] = ['all', 'reserved', 'active', 'expiring', 'overdue', 'ended']

type FilterKey = 'q' | 'tab' | 'payment' | 'type'

export function FacilityRentalsPage() {
  const { activeFacilityId, facilitiesInScope } = useSession()
  const { unitTypes } = useUnitTypes()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)
  const [assignFor, setAssignFor] = useState<Rental | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const facilityId = activeFacilityId ?? 0
  const facility = facilitiesInScope.find((item) => item.id === facilityId)
  const { staff } = useStaffMembers(facilityId)

  const filters: RentalFilters = useMemo(() => {
    const tabParam = searchParams.get('tab')
    const paymentParam = searchParams.get('payment')
    const typeParam = searchParams.get('type')
    return {
      facilityId,
      tab: tabParam && RENTAL_TABS.includes(tabParam as RentalTab) ? (tabParam as RentalTab) : 'all',
      search: searchParams.get('q') ?? '',
      paymentState:
        paymentParam && paymentParam in PAYMENT_STATE_LABELS ? (paymentParam as PaymentState) : null,
      unitTypeId: typeParam ? Number(typeParam) : null,
    }
  }, [facilityId, searchParams])

  const overviewFilters: RentalFilters = useMemo(
    () => ({ facilityId, tab: 'all', search: '', paymentState: null, unitTypeId: null }),
    [facilityId],
  )

  const taskFilters: TaskFilters = useMemo(
    () => ({ facilityId, tab: 'all', status: null, slot: 'all', day: 'all', rentalId: null, search: '' }),
    [facilityId],
  )

  const overview = useRentals(overviewFilters)
  const list = useRentals(filters)
  const allTasks = useStaffTasks(taskFilters)

  const reloadAll = async () => {
    await Promise.all([overview.reload(), list.reload(), allTasks.reload()])
  }

  const setFilter = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setSearchParams(next, { replace: true })
    setPage(1)
  }

  const setTab = (tab: string) => {
    setFilter('tab', tab === 'all' ? '' : tab)
  }

  const resetFilters = () => {
    setSearchParams({}, { replace: true })
    setPage(1)
  }

  const hasActiveFilters = Boolean(filters.search || filters.paymentState || filters.unitTypeId)

  const appointments = useMemo(
    () =>
      overview.rentals
        .filter(
          (rental) =>
            rental.appointmentAt &&
            isSameDay(rental.appointmentAt, new Date()) &&
            (rental.status === 'RESERVED' || rental.status === 'PENDING_PAYMENT'),
        )
        .sort((a, b) => (a.appointmentAt ?? '').localeCompare(b.appointmentAt ?? '')),
    [overview.rentals],
  )

  const handleAssignSubmit = async (input: AssignTaskFormInput) => {
    if (!assignFor) {
      return
    }
    const task = await assignTask({ facilityId, rentalId: assignFor.id, ...input })
    setAssignFor(null)
    setNotice(`Đã phân công công việc #${task.id} cho ${task.assignedStaffName}.`)
    await reloadAll()
  }

  const tabItems = [
    { id: 'all', label: 'Tất cả', count: overview.summary.total },
    { id: 'reserved', label: 'Chờ nhận kho', count: overview.summary.byTab.reserved },
    { id: 'active', label: 'Đang thuê', count: overview.summary.byTab.active },
    { id: 'expiring', label: 'Sắp hết hạn', count: overview.summary.byTab.expiring },
    { id: 'overdue', label: 'Quá hạn', count: overview.summary.byTab.overdue },
    { id: 'ended', label: 'Đã kết thúc', count: overview.summary.byTab.ended },
  ]

  const kpis = [
    {
      label: 'Chờ nhận kho',
      value: overview.summary.byStatus.RESERVED,
      note: `Hôm nay: ${formatNumber(appointments.length)} lịch hẹn`,
    },
    { label: 'Đang thuê', value: overview.summary.byStatus.ACTIVE, note: 'Hợp đồng đang hiệu lực' },
    {
      label: 'Sắp hết hạn (14 ngày)',
      value: overview.summary.byTab.expiring,
      note: 'Cần nhắc gia hạn hoặc trả kho',
    },
    { label: 'Quá hạn', value: overview.summary.byStatus.OVERDUE, note: 'Cần xử lý theo chính sách' },
  ]

  const totalPages = Math.max(1, Math.ceil(list.rentals.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = list.rentals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const drawerTasks = selectedRental
    ? allTasks.tasks.filter((task) => task.rentalId === selectedRental.id)
    : []

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
        <div>
          <p className="text-badge-caption uppercase tracking-wider text-text-muted">Cơ sở vận hành</p>
          <h1 className="mt-1 text-page-title text-text-main">
            Hợp đồng & Phân công{facility ? ` — ${facility.name}` : ''}
          </h1>
          <p className="mt-space-xs text-body-default text-text-muted">
            Theo dõi trạng thái thuê, lịch bàn giao và phân công công việc tại cơ sở.
          </p>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="mt-space-lg flex items-center justify-between gap-space-md rounded-lg bg-success-bg px-space-lg py-space-md text-label-help text-success"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              check_circle
            </span>
            {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Đóng thông báo" className="hover:opacity-70">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      <div className="mt-space-lg grid grid-cols-2 xl:grid-cols-4 gap-space-md">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-surface rounded-xl border border-border-hairline p-space-xl">
            <p className="text-label-help text-text-muted">{kpi.label}</p>
            <p className="mt-1 text-kpi-metric text-text-main tabular-nums">{formatNumber(kpi.value)}</p>
            <p className="mt-1 text-badge-caption text-text-muted">{kpi.note}</p>
          </div>
        ))}
      </div>

      <section className="mt-space-lg">
        <h2 className="text-subsection text-text-main">Lịch hẹn nhận kho hôm nay</h2>
        {appointments.length === 0 ? (
          <p className="mt-space-sm text-label-help text-text-muted">Hôm nay không có lịch hẹn nhận kho.</p>
        ) : (
          <div className="mt-space-sm grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-space-md">
            {appointments.map((rental) => (
              <div key={rental.id} className="bg-surface rounded-xl border border-border-hairline p-space-lg">
                <div className="flex items-start justify-between gap-space-md">
                  <div>
                    <p className="text-body-medium text-text-main">
                      {rental.appointmentAt ? formatTime(rental.appointmentAt) : '—'} • #{rental.id}
                    </p>
                    <p className="mt-0.5 text-label-help text-text-muted">
                      {rental.customerName} • Kho {rental.unitCode}
                    </p>
                  </div>
                  <PaymentStateLabel state={rental.paymentState} />
                </div>
                <div className="mt-space-md flex items-center justify-between gap-space-md">
                  <span className="text-label-help text-text-muted">
                    {rental.assignedStaffName ? `Phụ trách: ${rental.assignedStaffName}` : 'Chưa phân công'}
                  </span>
                  {rental.openHandoverTaskId ? (
                    <Button variant="outline" compact onClick={() => setSelectedRental(rental)}>
                      Xem hồ sơ
                    </Button>
                  ) : (
                    <Button compact onClick={() => setAssignFor(rental)}>
                      Phân công bàn giao
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-space-xl">
        <Tabs items={tabItems} active={filters.tab} onChange={setTab} />
      </div>

      <div className="mt-space-lg flex flex-col lg:flex-row lg:items-center gap-space-md">
        <div className="relative flex-1 min-w-[220px]">
          <label htmlFor="rental-search" className="sr-only">
            Tìm hợp đồng
          </label>
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-text-muted"
            aria-hidden="true"
          >
            search
          </span>
          <input
            id="rental-search"
            type="search"
            value={filters.search}
            onChange={(event) => setFilter('q', event.target.value)}
            placeholder="Tìm mã hợp đồng, khách hàng, số điện thoại, mã kho…"
            className="w-full h-11 rounded-lg border border-border-hairline bg-surface pl-10 pr-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring"
          />
        </div>

        <label htmlFor="rental-type-filter" className="sr-only">
          Loại kho
        </label>
        <select
          id="rental-type-filter"
          value={filters.unitTypeId ?? ''}
          onChange={(event) => setFilter('type', event.target.value)}
          className="h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring lg:w-[180px]"
        >
          <option value="">Tất cả loại kho</option>
          {unitTypes.map((unitType) => (
            <option key={unitType.id} value={unitType.id}>
              {unitType.name}
            </option>
          ))}
        </select>

        <label htmlFor="rental-payment-filter" className="sr-only">
          Thanh toán
        </label>
        <select
          id="rental-payment-filter"
          value={filters.paymentState ?? ''}
          onChange={(event) => setFilter('payment', event.target.value)}
          className="h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring lg:w-[180px]"
        >
          <option value="">Mọi thanh toán</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="PENDING">Chờ thanh toán</option>
          <option value="OVERDUE">Quá hạn thanh toán</option>
        </select>

        <Button variant="outline" onClick={resetFilters} disabled={!hasActiveFilters} className="shrink-0">
          Xóa bộ lọc
        </Button>
      </div>

      <div className="mt-space-lg bg-surface rounded-xl border border-border-hairline overflow-hidden">
        {list.error ? (
          <div className="p-space-xl text-center">
            <p role="alert" className="text-body-default text-danger">
              {list.error}
            </p>
            <Button variant="outline" className="mt-space-md" onClick={() => void list.reload()}>
              Thử lại
            </Button>
          </div>
        ) : list.loading ? (
          <div className="p-space-lg space-y-3" role="status">
            <span className="sr-only">Đang tải danh sách hợp đồng…</span>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 rounded-lg bg-surface-muted animate-pulse" />
            ))}
          </div>
        ) : list.rentals.length === 0 ? (
          overview.summary.total === 0 ? (
            <EmptyState title="Cơ sở chưa có hợp đồng nào." description="Hợp đồng sẽ xuất hiện khi khách đặt kho và thanh toán." />
          ) : (
            <EmptyState
              icon="search_off"
              title="Không có hợp đồng khớp bộ lọc."
              description="Thử đổi tab, từ khóa hoặc xóa bộ lọc."
              action={
                <Button variant="outline" onClick={resetFilters}>
                  Xóa bộ lọc
                </Button>
              }
            />
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-ui-table">
                <thead>
                  <tr className="bg-surface-muted text-left text-text-muted">
                    <th scope="col" className="px-space-lg py-space-md font-semibold">Mã HĐ</th>
                    <th scope="col" className="px-space-lg py-space-md font-semibold">Khách hàng</th>
                    <th scope="col" className="px-space-lg py-space-md font-semibold">Kho & Loại</th>
                    <th scope="col" className="px-space-lg py-space-md font-semibold">Thời hạn thuê</th>
                    <th scope="col" className="px-space-lg py-space-md font-semibold">Trạng thái</th>
                    <th scope="col" className="px-space-lg py-space-md font-semibold">Thanh toán</th>
                    <th scope="col" className="px-space-lg py-space-md font-semibold">Phụ trách</th>
                    <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((rental) => (
                    <tr
                      key={rental.id}
                      onClick={() => setSelectedRental(rental)}
                      className="border-b border-border-subtle last:border-b-0 hover:bg-surface-muted/60 cursor-pointer"
                    >
                      <td className="px-space-lg py-space-md font-medium text-text-main">#{rental.id}</td>
                      <td className="px-space-lg py-space-md">
                        <span className="block text-text-main">{rental.customerName}</span>
                        <span className="block text-badge-caption text-text-muted">{rental.customerPhone}</span>
                      </td>
                      <td className="px-space-lg py-space-md">
                        <span className="block text-text-main">{rental.unitCode}</span>
                        <span className="block text-badge-caption text-text-muted">{rental.unitTypeName}</span>
                      </td>
                      <td className="px-space-lg py-space-md">
                        {formatDate(rental.startDate)} – {formatDate(rental.endDate)}
                      </td>
                      <td className="px-space-lg py-space-md">
                        <RentalStatusLabel status={rental.status} />
                      </td>
                      <td className="px-space-lg py-space-md">
                        <PaymentStateLabel state={rental.paymentState} />
                      </td>
                      <td className="px-space-lg py-space-md">{rental.assignedStaffName ?? '—'}</td>
                      <td className="px-space-lg py-space-md text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedRental(rental)
                          }}
                          className="text-label-help font-medium text-primary hover:underline"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-space-md px-space-lg py-space-md border-t border-border-hairline">
              <p className="text-label-help text-text-muted">
                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, list.rentals.length)} trên{' '}
                {formatNumber(list.rentals.length)} hợp đồng
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" compact disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                  Trước
                </Button>
                <span className="text-label-help text-text-muted">
                  Trang {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  compact
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedRental && (
        <RentalDrawer
          rental={selectedRental}
          tasks={drawerTasks}
          tasksLoading={allTasks.loading}
          onClose={() => setSelectedRental(null)}
          onAssign={() => setAssignFor(selectedRental)}
        />
      )}

      {assignFor && (
        <AssignTaskModal
          rental={assignFor}
          staff={staff}
          defaultType={assignFor.status === 'RESERVED' ? 'HANDOVER' : 'UNIT_INSPECTION'}
          onClose={() => setAssignFor(null)}
          onSubmit={handleAssignSubmit}
        />
      )}
    </div>
  )
}
