import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Drawer } from '../../../components/ui/Drawer'
import { formatCurrency, formatDate, formatDateTime } from '../../../lib/format'
import { ACCESS_METHOD_LABELS, TASK_TYPE_LABELS } from '../rentalRules'
import type { Rental, StaffTask } from '../types'
import { PaymentStateLabel, RentalStatusLabel, TaskStatusLabel } from './StatusLabels'

interface RentalDrawerProps {
  rental: Rental
  tasks: StaffTask[]
  tasksLoading: boolean
  onClose: () => void
  onAssign: () => void
}

export function RentalDrawer({ rental, tasks, tasksLoading, onClose, onAssign }: RentalDrawerProps) {
  return (
    <Drawer
      title={`Hợp đồng #${rental.id}`}
      onClose={onClose}
      footer={
        <Button variant="outline" onClick={onAssign}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            assignment_add
          </span>
          Phân công công việc
        </Button>
      }
    >
      <section>
        <h3 className="text-subsection text-text-main">Khách thuê</h3>
        <dl className="mt-space-sm">
          <SpecRow label="Khách hàng" value={rental.customerName} />
          <SpecRow label="Điện thoại" value={rental.customerPhone} />
        </dl>
      </section>

      <section className="mt-space-xl">
        <h3 className="text-subsection text-text-main">Kho & thời hạn thuê</h3>
        <dl className="mt-space-sm">
          <SpecRow label="Kho" value={`${rental.unitCode} (${rental.unitTypeName})`} />
          <SpecRow label="Thời hạn" value={`${formatDate(rental.startDate)} – ${formatDate(rental.endDate)}`} />
          <SpecRow label="Giá thuê/tháng" value={formatCurrency(rental.pricePerMonth)} />
          <SpecRow
            label="Lịch hẹn nhận kho"
            value={rental.appointmentAt ? formatDateTime(rental.appointmentAt) : '—'}
          />
        </dl>
      </section>

      <section className="mt-space-xl">
        <h3 className="text-subsection text-text-main">Trạng thái</h3>
        <div className="mt-space-sm flex flex-wrap items-center gap-space-lg">
          <RentalStatusLabel status={rental.status} />
          <PaymentStateLabel state={rental.paymentState} />
        </div>
      </section>

      {rental.checkedInAt && (
        <section className="mt-space-xl">
          <h3 className="text-subsection text-text-main">Bàn giao / Check-in</h3>
          <dl className="mt-space-sm">
            <SpecRow label="Thời điểm nhận kho" value={formatDateTime(rental.checkedInAt)} />
            <SpecRow
              label="Phương thức truy cập"
              value={rental.accessMethod ? ACCESS_METHOD_LABELS[rental.accessMethod] : '—'}
            />
            <SpecRow label="Tình trạng bàn giao" value={rental.handoverCondition ?? '—'} />
          </dl>
        </section>
      )}

      <section className="mt-space-xl">
        <h3 className="text-subsection text-text-main">Công việc của hợp đồng</h3>
        {tasksLoading ? (
          <div className="mt-space-sm space-y-2" role="status">
            <span className="sr-only">Đang tải công việc…</span>
            <div className="h-12 rounded-lg bg-surface-muted animate-pulse" />
            <div className="h-12 rounded-lg bg-surface-muted animate-pulse" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="mt-space-sm text-label-help text-text-muted">
            Chưa có công việc nào được phân công cho hợp đồng này.
          </p>
        ) : (
          <ul className="mt-space-sm space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="rounded-lg border border-border-hairline bg-surface-muted/60 p-space-md"
              >
                <div className="flex items-center justify-between gap-space-md">
                  <span className="text-label-help font-medium text-text-main">
                    #{task.id} • {TASK_TYPE_LABELS[task.taskType]}
                  </span>
                  <TaskStatusLabel status={task.status} />
                </div>
                <p className="mt-1 text-label-help text-text-muted">
                  {formatDateTime(task.scheduledAt)} • Phụ trách: {task.assignedStaffName}
                </p>
                {task.notes && <p className="mt-1 text-label-help text-text-muted">Ghi chú: {task.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-space-xl text-label-help text-text-muted">
        Bàn giao/check-in do nhân viên cơ sở thực hiện tại{' '}
        <Link to="/staff/operations" className="text-primary hover:underline">
          Công việc tại cơ sở
        </Link>
        .
      </p>
    </Drawer>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-space-lg py-space-sm border-b border-border-subtle last:border-b-0">
      <dt className="text-label-help text-text-muted">{label}</dt>
      <dd className="text-body-medium text-text-main text-right">{value}</dd>
    </div>
  )
}
