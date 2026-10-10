import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSession } from '../../../app/providers/SessionProvider'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Tabs } from '../../../components/ui/Tabs'
import { PaymentStateLabel, TaskStatusLabel } from '../../facility/components/StatusLabels'
import { TicketsPanel } from '../../facility/components/TicketsPanel'
import { useStaffTasks } from '../../facility/hooks/useRentalOps'
import { TASK_STATUS_LABELS, TASK_TYPE_LABELS } from '../../facility/rentalRules'
import type { StaffTask, TaskFilters, TaskSlot, TaskStatus, TaskType } from '../../facility/types'
import { formatNumber, formatTime } from '../../../lib/format'
import { TaskDrawer } from '../components/TaskDrawer'

const PAGE_SIZE = 8
const TASK_TABS: Array<TaskType | 'all'> = [
  'all',
  'HANDOVER',
  'RETURN_INSPECTION',
  'UNIT_INSPECTION',
  'SUPPORT',
]

const STATUS_OPTIONS: TaskStatus[] = ['ASSIGNED', 'IN_PROGRESS', 'DONE']

type FilterKey = 'q' | 'tab' | 'status' | 'slot'

export function StaffOperationsPage() {
  const { activeFacilityId, facilitiesInScope } = useSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedTask, setSelectedTask] = useState<StaffTask | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const facilityId = activeFacilityId ?? 0
  const facility = facilitiesInScope.find((item) => item.id === facilityId)

  const filters: TaskFilters = useMemo(() => {
    const tabParam = searchParams.get('tab')
    const statusParam = searchParams.get('status')
    const slotParam = searchParams.get('slot')
    return {
      facilityId,
      tab: tabParam && TASK_TABS.includes(tabParam as TaskType) ? (tabParam as TaskType) : 'all',
      status: statusParam && statusParam in TASK_STATUS_LABELS ? (statusParam as TaskStatus) : null,
      slot: slotParam === 'morning' || slotParam === 'afternoon' ? (slotParam as TaskSlot) : 'all',
      day: 'today',
      rentalId: null,
      search: searchParams.get('q') ?? '',
    }
  }, [facilityId, searchParams])

  const { tasks, summary, loading, error, reload } = useStaffTasks(filters)

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

  const hasActiveFilters = Boolean(filters.search || filters.status || filters.slot !== 'all')

  const taskCount = Object.values(summary.byStatus).reduce((total, value) => total + value, 0)

  const tabItems = [
    { id: 'all', label: 'Tất cả công việc', count: taskCount },
    { id: 'HANDOVER', label: 'Nhận kho', count: summary.byType.HANDOVER },
    { id: 'RETURN_INSPECTION', label: 'Trả kho', count: summary.byType.RETURN_INSPECTION },
    { id: 'UNIT_INSPECTION', label: 'Kiểm tra & bảo trì', count: summary.byType.UNIT_INSPECTION },
    { id: 'SUPPORT', label: 'Hỗ trợ tại quầy', count: summary.byType.SUPPORT },
  ]

  const kpis = [
    { label: 'Chưa tiếp nhận', value: summary.byStatus.ASSIGNED },
    { label: 'Lịch nhận kho (Check-in)', value: summary.byType.HANDOVER },
    { label: 'Lịch trả kho (Inspection)', value: summary.byType.RETURN_INSPECTION },
    { label: 'Đã hoàn thành', value: summary.byStatus.DONE },
  ]

  const totalPages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = tasks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
        <div>
          <p className="text-badge-caption uppercase tracking-wider text-text-muted">
            Ca trực hôm nay{facility ? ` • ${facility.name}` : ''}
          </p>
          <h1 className="mt-1 text-page-title text-text-main">Công việc hôm nay</h1>
          <p className="mt-space-xs text-body-default text-text-muted">
            Điều phối lượt khách nhận kho, kiểm định trả kho và công việc được phân công tại cơ sở.
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
          </div>
        ))}
      </div>

      <div className="mt-space-lg">
        <Tabs items={tabItems} active={filters.tab} onChange={setTab} />
      </div>

      <div className="mt-space-lg flex flex-col lg:flex-row lg:items-center gap-space-md">
        <div className="relative flex-1 min-w-[220px]">
          <label htmlFor="task-search" className="sr-only">
            Tìm công việc
          </label>
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-text-muted"
            aria-hidden="true"
          >
            search
          </span>
          <input
            id="task-search"
            type="search"
            value={filters.search}
            onChange={(event) => setFilter('q', event.target.value)}
            placeholder="Tìm mã việc, khách hàng, mã kho…"
            className="w-full h-11 rounded-lg border border-border-hairline bg-surface pl-10 pr-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring"
          />
        </div>

        <label htmlFor="task-slot-filter" className="sr-only">
          Khung giờ
        </label>
        <select
          id="task-slot-filter"
          value={filters.slot}
          onChange={(event) => setFilter('slot', event.target.value === 'all' ? '' : event.target.value)}
          className="h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring lg:w-[180px]"
        >
          <option value="all">Mọi khung giờ</option>
          <option value="morning">Sáng (trước 12:00)</option>
          <option value="afternoon">Chiều (từ 12:00)</option>
        </select>

        <label htmlFor="task-status-filter" className="sr-only">
          Trạng thái
        </label>
        <select
          id="task-status-filter"
          value={filters.status ?? ''}
          onChange={(event) => setFilter('status', event.target.value)}
          className="h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring lg:w-[180px]"
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {TASK_STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <Button variant="outline" onClick={resetFilters} disabled={!hasActiveFilters} className="shrink-0">
          Xóa bộ lọc
        </Button>
      </div>

      <div className="mt-space-lg bg-surface rounded-xl border border-border-hairline overflow-hidden">
        {error ? (
          <div className="p-space-xl text-center">
            <p role="alert" className="text-body-default text-danger">
              {error}
            </p>
            <Button variant="outline" className="mt-space-md" onClick={() => void reload()}>
              Thử lại
            </Button>
          </div>
        ) : loading ? (
          <div className="p-space-lg space-y-3" role="status">
            <span className="sr-only">Đang tải danh sách công việc…</span>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 rounded-lg bg-surface-muted animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          taskCount === 0 ? (
            <EmptyState
              title="Hôm nay chưa có công việc được giao."
              description="Công việc mới sẽ xuất hiện khi quản lý phân công hoặc khách có lịch hẹn."
            />
          ) : (
            <EmptyState
              icon="search_off"
              title="Không có công việc khớp bộ lọc."
              description="Thử đổi tab, khung giờ hoặc xóa bộ lọc."
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
                    <th scope="col" className="px-space-lg py-space-md font-semibold">Mã việc</th>
                    <th scope="col" className="px-space-lg py-space-md font-semibold">Loại việc</th>
                    <th scope="col" className="px-space-lg py-space-md font-semibold">Khách & Kho</th>
                    <th scope="col" className="px-space-lg py-space-md font-semibold">Khung giờ</th>
                    <th scope="col" className="px-space-lg py-space-md font-semibold">Thanh toán</th>
                    <th scope="col" className="px-space-lg py-space-md font-semibold">Trạng thái</th>
                    <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="border-b border-border-subtle last:border-b-0 hover:bg-surface-muted/60 cursor-pointer"
                    >
                      <td className="px-space-lg py-space-md font-medium text-text-main">#{task.id}</td>
                      <td className="px-space-lg py-space-md">{TASK_TYPE_LABELS[task.taskType]}</td>
                      <td className="px-space-lg py-space-md">
                        <span className="block text-text-main">{task.customerName ?? '—'}</span>
                        <span className="block text-badge-caption text-text-muted">
                          {task.unitCode ? `Kho ${task.unitCode}` : task.ticketId ? `Ticket #${task.ticketId}` : '—'}
                        </span>
                      </td>
                      <td className="px-space-lg py-space-md">{formatTime(task.scheduledAt)}</td>
                      <td className="px-space-lg py-space-md">
                        {task.paymentState ? <PaymentStateLabel state={task.paymentState} /> : '—'}
                      </td>
                      <td className="px-space-lg py-space-md">
                        <TaskStatusLabel status={task.status} />
                      </td>
                      <td className="px-space-lg py-space-md text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedTask(task)
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
                {Math.min(currentPage * PAGE_SIZE, tasks.length)} trên {formatNumber(tasks.length)} công việc
                của ca trực
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

      {selectedTask && (
        <TaskDrawer
          key={selectedTask.id}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onMutated={() => {
            void reload()
          }}
          onCompleted={(message) => {
            setSelectedTask(null)
            setNotice(message)
            void reload()
          }}
        />
      )}

      <div className="mt-space-xl">
        <TicketsPanel facilityId={facilityId} onMutated={() => void reload()} />
      </div>
    </div>
  )
}
