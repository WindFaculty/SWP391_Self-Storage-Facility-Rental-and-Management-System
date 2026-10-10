import {
  PAYMENT_STATE_LABELS,
  RENTAL_STATUS_LABELS,
  TASK_STATUS_LABELS,
} from '../rentalRules'
import { TICKET_STATUS_LABELS } from '../supportRules'
import type { PaymentState, RentalStatus, TaskStatus, TicketStatus } from '../types'

const RENTAL_STATUS_DOT: Record<RentalStatus, string> = {
  PENDING_PAYMENT: 'bg-text-muted',
  RESERVED: 'bg-info',
  ACTIVE: 'bg-success',
  OVERDUE: 'bg-danger',
  RETURNED: 'bg-text-muted',
  CANCELLED: 'bg-text-muted',
  EXPIRED: 'bg-text-muted',
}

const TASK_STATUS_DOT: Record<TaskStatus, string> = {
  ASSIGNED: 'bg-warning',
  IN_PROGRESS: 'bg-info',
  DONE: 'bg-success',
  CANCELLED: 'bg-text-muted',
}

const PAYMENT_STATE_DOT: Record<PaymentState, string> = {
  PAID: 'bg-success',
  PENDING: 'bg-warning',
  OVERDUE: 'bg-danger',
}

const TICKET_STATUS_DOT: Record<TicketStatus, string> = {
  OPEN: 'bg-warning',
  IN_PROGRESS: 'bg-info',
  RESOLVED: 'bg-success',
  CLOSED: 'bg-text-muted',
}

function DotLabel({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-label-help text-text-main">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  )
}

export function RentalStatusLabel({ status }: { status: RentalStatus }) {
  return <DotLabel dot={RENTAL_STATUS_DOT[status]} label={RENTAL_STATUS_LABELS[status]} />
}

export function TaskStatusLabel({ status }: { status: TaskStatus }) {
  return <DotLabel dot={TASK_STATUS_DOT[status]} label={TASK_STATUS_LABELS[status]} />
}

export function PaymentStateLabel({ state }: { state: PaymentState }) {
  return <DotLabel dot={PAYMENT_STATE_DOT[state]} label={PAYMENT_STATE_LABELS[state]} />
}

export function TicketStatusLabel({ status }: { status: TicketStatus }) {
  return <DotLabel dot={TICKET_STATUS_DOT[status]} label={TICKET_STATUS_LABELS[status]} />
}
