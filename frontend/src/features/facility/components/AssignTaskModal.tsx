import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { formatDate } from '../../../lib/format'
import { TASK_TYPE_LABELS } from '../rentalRules'
import type { Rental, StaffMember, TaskType } from '../types'

const INPUT_CLASS =
  'mt-space-xs w-full h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring'

const ASSIGNABLE_TYPES: TaskType[] = ['HANDOVER', 'RETURN_INSPECTION', 'UNIT_INSPECTION']

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export interface AssignTaskFormInput {
  taskType: TaskType
  assignedStaffId: number
  scheduledAt: string
  notes: string
}

interface AssignTaskModalProps {
  rental: Rental
  staff: StaffMember[]
  defaultType: TaskType
  onClose: () => void
  onSubmit: (input: AssignTaskFormInput) => Promise<void>
}

export function AssignTaskModal({ rental, staff, defaultType, onClose, onSubmit }: AssignTaskModalProps) {
  const [taskType, setTaskType] = useState<TaskType>(defaultType)
  const [assignedStaffId, setAssignedStaffId] = useState<number>(staff[0]?.id ?? 0)
  const [scheduledLocal, setScheduledLocal] = useState(
    toDatetimeLocalValue(rental.appointmentAt ?? new Date().toISOString()),
  )
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!assignedStaffId) {
      setError('Chọn nhân viên phụ trách.')
      return
    }
    if (!scheduledLocal) {
      setError('Chọn thời gian thực hiện công việc.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        taskType,
        assignedStaffId,
        scheduledAt: new Date(scheduledLocal).toISOString(),
        notes,
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không phân công được công việc.')
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Phân công công việc" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="rounded-lg bg-surface-muted border border-border-hairline p-space-md text-label-help text-text-muted">
          <p className="text-body-medium text-text-main">
            #{rental.id} • {rental.customerName}
          </p>
          <p className="mt-0.5">
            Kho {rental.unitCode} ({rental.unitTypeName}) • {formatDate(rental.startDate)} –{' '}
            {formatDate(rental.endDate)}
          </p>
        </div>

        <div className="mt-space-lg">
          <label htmlFor="task-type" className="text-label-help font-medium text-text-main">
            Loại công việc *
          </label>
          <select
            id="task-type"
            value={taskType}
            onChange={(event) => setTaskType(event.target.value as TaskType)}
            className={INPUT_CLASS}
          >
            {ASSIGNABLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {TASK_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-space-lg">
          <label htmlFor="task-staff" className="text-label-help font-medium text-text-main">
            Nhân viên phụ trách *
          </label>
          <select
            id="task-staff"
            value={assignedStaffId}
            onChange={(event) => setAssignedStaffId(Number(event.target.value))}
            className={INPUT_CLASS}
          >
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-space-lg">
          <label htmlFor="task-schedule" className="text-label-help font-medium text-text-main">
            Thời gian thực hiện *
          </label>
          <input
            id="task-schedule"
            type="datetime-local"
            value={scheduledLocal}
            onChange={(event) => setScheduledLocal(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div className="mt-space-lg">
          <label htmlFor="task-notes" className="text-label-help font-medium text-text-main">
            Ghi chú
          </label>
          <textarea
            id="task-notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-space-xs w-full rounded-lg border border-border-hairline bg-surface px-space-md py-space-sm text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring"
          />
        </div>

        {error && (
          <p role="alert" className="mt-space-md text-label-help text-danger">
            {error}
          </p>
        )}

        <div className="mt-space-2xl flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Đang lưu…' : 'Phân công'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
