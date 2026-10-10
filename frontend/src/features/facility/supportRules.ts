import type { SupportTicket, TicketFilters } from './types'

export const TICKET_CATEGORY_LABELS: Record<SupportTicket['category'], string> = {
  UNIT: 'Kho lưu trữ',
  LOCK: 'Ổ khóa / chìa khóa',
  ACCESS: 'Mã truy cập & thẻ từ',
  PAYMENT: 'Thanh toán / hóa đơn',
  ITEMS: 'Đồ đạc lưu trữ',
  OTHER: 'Vấn đề khác',
}

export const TICKET_STATUS_LABELS: Record<SupportTicket['status'], string> = {
  OPEN: 'Mới tiếp nhận',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
}

const TICKET_TRANSITIONS: Record<SupportTicket['status'], SupportTicket['status'][]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
}

export function isTicketTransitionAllowed(
  from: SupportTicket['status'],
  to: SupportTicket['status'],
): { allowed: boolean; reason?: string } {
  if (TICKET_TRANSITIONS[from].includes(to)) {
    return { allowed: true }
  }
  if (from === 'CLOSED') {
    return { allowed: false, reason: 'Ticket đã đóng, không thể thay đổi.' }
  }
  return { allowed: false, reason: 'Chuyển trạng thái ticket không hợp lệ.' }
}

export function filterTickets(tickets: SupportTicket[], filters: TicketFilters): SupportTicket[] {
  const search = filters.search.trim().toLowerCase()
  return tickets
    .filter((ticket) => ticket.facilityId === filters.facilityId)
    .filter((ticket) => (filters.status ? ticket.status === filters.status : true))
    .filter((ticket) =>
      search
        ? `#${ticket.id} ${ticket.title} ${ticket.customerName} ${ticket.unitCode ?? ''}`
            .toLowerCase()
            .includes(search)
        : true,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function isTicketActive(ticket: SupportTicket): boolean {
  return ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'
}
