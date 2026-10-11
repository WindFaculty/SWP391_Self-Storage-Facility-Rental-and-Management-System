import { useMemo, useState } from 'react'
import { useSession } from '../../../app/providers/SessionProvider'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Modal } from '../../../components/ui/Modal'
import { formatDateTime, formatNumber } from '../../../lib/format'
import { assignTicket, closeTicket } from '../api/supportTicketsApi'
import { useStaffMembers, useTickets } from '../hooks/useRentalOps'
import { TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from '../supportRules'
import type { StaffMember, SupportTicket, TicketFilters, TicketStatus } from '../types'
import { toDatetimeLocalValue } from './AssignTaskModal'
import { TicketStatusLabel } from './StatusLabels'

const STATUS_OPTIONS: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

interface TicketsPanelProps {
  facilityId: number
  onMutated: () => void
}

export function TicketsPanel({ facilityId, onMutated }: TicketsPanelProps) {
  const { user } = useSession()
  const { staff } = useStaffMembers(facilityId)
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('')
  const [assignFor, setAssignFor] = useState<SupportTicket | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const filters: TicketFilters = useMemo(
    () => ({ facilityId, status: statusFilter || null, search: '' }),
    [facilityId, statusFilter],
  )

  const { tickets, activeCount, loading, error: loadError, reload } = useTickets(filters)

  const canAssign = user.role === 'FACILITY_MANAGER' || user.role === 'ADMIN'
  const canClaim = user.role === 'FACILITY_STAFF'

  const handleClaim = async (ticket: SupportTicket) => {
    setBusyId(ticket.id)
    setError(null)
    try {
      await assignTicket({
        facilityId,
        ticketId: ticket.id,
        staffId: user.id,
        scheduledAt: new Date().toISOString(),
      })
      setNotice(`Đã nhận ticket #${ticket.id}. Công việc hỗ trợ đã được tạo trong ca trực.`)
      await reload()
      onMutated()
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : 'Không nhận được ticket.')
    } finally {
      setBusyId(null)
    }
  }

  const handleClose = async (ticket: SupportTicket) => {
    setBusyId(ticket.id)
    setError(null)
    try {
      await closeTicket(ticket.id)
      setNotice(`Đã đóng ticket #${ticket.id}.`)
      await reload()
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : 'Không đóng được ticket.')
    } finally {
      setBusyId(null)
    }
  }

  const handleAssigned = async (message: string) => {
    setAssignFor(null)
    setNotice(message)
    await reload()
    onMutated()
  }

  return (
    <section className="bg-surface rounded-xl border border-border-hairline overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md px-space-lg py-space-md border-b border-border-hairline">
        <div>
          <h2 className="text-subsection text-text-main">Ticket hỗ trợ tại cơ sở</h2>
          <p className="text-label-help text-text-muted">
            {formatNumber(activeCount)} ticket đang mở hoặc đang xử lý
          </p>
        </div>
        <label htmlFor="ticket-status-filter" className="sr-only">
          Lọc trạng thái ticket
        </label>
        <select
          id="ticket-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as TicketStatus | '')}
          className="h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring lg:w-[190px]"
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {TICKET_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      {notice && (
        <div
          role="status"
          className="mx-space-lg mt-space-md flex items-center justify-between gap-space-md rounded-lg bg-success-bg px-space-lg py-space-md text-label-help text-success"
        >
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Đóng thông báo" className="hover:opacity-70">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mx-space-lg mt-space-md text-label-help text-danger">
          {error}
        </p>
      )}

      {loadError ? (
        <div className="p-space-xl text-center">
          <p role="alert" className="text-body-default text-danger">
            {loadError}
          </p>
          <Button variant="outline" className="mt-space-md" onClick={() => void reload()}>
            Thử lại
          </Button>
        </div>
      ) : loading ? (
        <div className="p-space-lg space-y-3" role="status">
          <span className="sr-only">Đang tải danh sách ticket…</span>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-12 rounded-lg bg-surface-muted animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon="support_agent"
          title="Không có ticket nào khớp bộ lọc."
          description="Ticket mới từ khách hàng sẽ xuất hiện tại đây để phân công xử lý."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-ui-table">
            <thead>
              <tr className="bg-surface-muted text-left text-text-muted">
                <th scope="col" className="px-space-lg py-space-md font-semibold">Ticket</th>
                <th scope="col" className="px-space-lg py-space-md font-semibold">Phân loại</th>
                <th scope="col" className="px-space-lg py-space-md font-semibold">Khách & Kho</th>
                <th scope="col" className="px-space-lg py-space-md font-semibold">Trạng thái</th>
                <th scope="col" className="px-space-lg py-space-md font-semibold">Ngày tạo</th>
                <th scope="col" className="px-space-lg py-space-md font-semibold">Phụ trách</th>
                <th scope="col" className="px-space-lg py-space-md font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-space-lg py-space-md">
                    <span className="block font-medium text-text-main">#{ticket.id} • {ticket.title}</span>
                    <span className="block text-badge-caption text-text-muted max-w-[320px] truncate">
                      {ticket.description}
                    </span>
                  </td>
                  <td className="px-space-lg py-space-md">{TICKET_CATEGORY_LABELS[ticket.category]}</td>
                  <td className="px-space-lg py-space-md">
                    <span className="block text-text-main">{ticket.customerName}</span>
                    <span className="block text-badge-caption text-text-muted">
                      {ticket.unitCode ? `Kho ${ticket.unitCode}` : 'Không gắn kho'}
                    </span>
                  </td>
                  <td className="px-space-lg py-space-md">
                    <TicketStatusLabel status={ticket.status} />
                  </td>
                  <td className="px-space-lg py-space-md">{formatDateTime(ticket.createdAt)}</td>
                  <td className="px-space-lg py-space-md">{ticket.assignedStaffName ?? '—'}</td>
                  <td className="px-space-lg py-space-md text-right">
                    {ticket.status === 'OPEN' && canAssign && (
                      <Button compact onClick={() => setAssignFor(ticket)}>
                        Phân công
                      </Button>
                    )}
                    {ticket.status === 'OPEN' && canClaim && (
                      <Button
                        compact
                        disabled={busyId === ticket.id}
                        onClick={() => void handleClaim(ticket)}
                      >
                        {busyId === ticket.id ? 'Đang nhận…' : 'Nhận ticket'}
                      </Button>
                    )}
                    {ticket.status === 'RESOLVED' && canAssign && (
                      <Button
                        variant="outline"
                        compact
                        disabled={busyId === ticket.id}
                        onClick={() => void handleClose(ticket)}
                      >
                        {busyId === ticket.id ? 'Đang xử lý…' : 'Đóng ticket'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {assignFor && (
        <AssignTicketModal
          facilityId={facilityId}
          ticket={assignFor}
          staff={staff}
          onClose={() => setAssignFor(null)}
          onAssigned={handleAssigned}
        />
      )}
    </section>
  )
}

interface AssignTicketModalProps {
  facilityId: number
  ticket: SupportTicket
  staff: StaffMember[]
  onClose: () => void
  onAssigned: (message: string) => Promise<void>
}

function AssignTicketModal({ facilityId, ticket, staff, onClose, onAssigned }: AssignTicketModalProps) {
  const [staffId, setStaffId] = useState<number>(staff[0]?.id ?? 0)
  const [scheduledLocal, setScheduledLocal] = useState(toDatetimeLocalValue(new Date().toISOString()))
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!staffId) {
      setError('Chọn nhân viên phụ trách.')
      return
    }
    if (!scheduledLocal) {
      setError('Chọn thời gian thực hiện công việc.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = await assignTicket({
        facilityId,
        ticketId: ticket.id,
        staffId,
        scheduledAt: new Date(scheduledLocal).toISOString(),
        notes,
      })
      await onAssigned(`Đã phân công ticket #${ticket.id} cho ${result.task.assignedStaffName}.`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không phân công được ticket.')
      setSubmitting(false)
    }
  }

  return (
    <Modal title={`Phân công ticket #${ticket.id}`} onClose={onClose}>
      <div className="rounded-lg bg-surface-muted border border-border-hairline p-space-md text-label-help text-text-muted">
        <p className="text-body-medium text-text-main">{ticket.title}</p>
        <p className="mt-0.5">
          {ticket.customerName}
          {ticket.unitCode ? ` • Kho ${ticket.unitCode}` : ''}
        </p>
      </div>

      <div className="mt-space-lg">
        <label htmlFor="ticket-staff" className="text-label-help font-medium text-text-main">
          Nhân viên phụ trách *
        </label>
        <select
          id="ticket-staff"
          value={staffId}
          onChange={(event) => setStaffId(Number(event.target.value))}
          className="mt-space-xs w-full h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.fullName}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-space-lg">
        <label htmlFor="ticket-schedule" className="text-label-help font-medium text-text-main">
          Thời gian thực hiện *
        </label>
        <input
          id="ticket-schedule"
          type="datetime-local"
          value={scheduledLocal}
          onChange={(event) => setScheduledLocal(event.target.value)}
          className="mt-space-xs w-full h-11 rounded-lg border border-border-hairline bg-surface px-space-md text-body-default text-text-main focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
      </div>

      <div className="mt-space-lg">
        <label htmlFor="ticket-notes" className="text-label-help font-medium text-text-main">
          Ghi chú cho nhân viên
        </label>
        <textarea
          id="ticket-notes"
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
        <Button disabled={submitting} onClick={() => void handleSubmit()}>
          {submitting ? 'Đang lưu…' : 'Phân công'}
        </Button>
      </div>
    </Modal>
  )
}
