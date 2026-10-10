import { MOCK_STAFF } from './rentalMockData'
import { idCounters, taskStore, ticketStore } from './opsStore'
import { filterTickets, isTicketActive, isTicketTransitionAllowed } from '../supportRules'
import type { StaffTask, SupportTicket, TicketFilters } from '../types'

const LATENCY_MS = 150

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, LATENCY_MS))
}

export async function listTickets(
  filters: TicketFilters,
): Promise<{ items: SupportTicket[]; activeCount: number }> {
  await delay()
  const facilityTickets = ticketStore.filter((ticket) => ticket.facilityId === filters.facilityId)
  return {
    items: filterTickets(facilityTickets, filters).map((ticket) => ({ ...ticket })),
    activeCount: facilityTickets.filter(isTicketActive).length,
  }
}

export async function getTicket(id: number): Promise<SupportTicket> {
  await delay()
  const ticket = ticketStore.find((item) => item.id === id)
  if (!ticket) {
    throw new Error('Không tìm thấy ticket.')
  }
  return { ...ticket }
}

export interface AssignTicketInput {
  facilityId: number
  ticketId: number
  staffId: number
  scheduledAt: string
  notes?: string
}

export async function assignTicket(
  input: AssignTicketInput,
): Promise<{ ticket: SupportTicket; task: StaffTask }> {
  await delay()
  const ticket = ticketStore.find(
    (item) => item.id === input.ticketId && item.facilityId === input.facilityId,
  )
  if (!ticket) {
    throw new Error('Không tìm thấy ticket tại cơ sở này.')
  }
  const staff = MOCK_STAFF.find(
    (member) => member.id === input.staffId && member.facilityId === input.facilityId,
  )
  if (!staff) {
    throw new Error('Nhân viên không thuộc cơ sở này.')
  }
  if (!input.scheduledAt) {
    throw new Error('Chọn thời gian thực hiện công việc.')
  }
  const existingOpen = taskStore.find(
    (task) =>
      task.ticketId === ticket.id &&
      task.taskType === 'SUPPORT' &&
      task.status !== 'DONE' &&
      task.status !== 'CANCELLED',
  )
  if (existingOpen) {
    throw new Error(`Ticket đã có công việc hỗ trợ đang mở (#${existingOpen.id}).`)
  }
  const transition = isTicketTransitionAllowed(ticket.status, 'IN_PROGRESS')
  if (!transition.allowed) {
    throw new Error(transition.reason)
  }
  idCounters.task += 1
  const task: StaffTask = {
    id: idCounters.task,
    facilityId: input.facilityId,
    taskType: 'SUPPORT',
    status: 'ASSIGNED',
    assignedStaffId: staff.id,
    assignedStaffName: staff.fullName,
    rentalId: null,
    ticketId: ticket.id,
    unitCode: ticket.unitCode,
    customerName: ticket.customerName,
    paymentState: null,
    scheduledAt: input.scheduledAt,
    completedAt: null,
    notes: input.notes?.trim() ? input.notes.trim() : null,
  }
  taskStore.push(task)
  ticket.status = 'IN_PROGRESS'
  ticket.assignedStaffName = staff.fullName
  return { ticket: { ...ticket }, task: { ...task } }
}

export async function closeTicket(ticketId: number): Promise<SupportTicket> {
  await delay()
  const ticket = ticketStore.find((item) => item.id === ticketId)
  if (!ticket) {
    throw new Error('Không tìm thấy ticket.')
  }
  const transition = isTicketTransitionAllowed(ticket.status, 'CLOSED')
  if (!transition.allowed) {
    throw new Error(transition.reason)
  }
  ticket.status = 'CLOSED'
  return { ...ticket }
}
