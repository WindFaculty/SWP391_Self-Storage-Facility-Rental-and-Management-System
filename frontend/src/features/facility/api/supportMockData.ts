import { at, MOCK_RENTALS } from './rentalMockData'
import type { SupportTicket, TicketCategory, TicketStatus } from '../types'

interface TicketSeed {
  rentalId: number | null
  customerName: string
  category: TicketCategory
  title: string
  description: string
  status: TicketStatus
  created: { dayOffset: number; hour: number; minute?: number }
  resolved?: { dayOffset: number; hour: number; minute?: number }
  assignedStaffName?: string
}

function makeTicket(id: number, seed: TicketSeed): SupportTicket {
  const rental = seed.rentalId
    ? MOCK_RENTALS.find((item) => item.id === seed.rentalId)
    : undefined
  return {
    id,
    facilityId: 1,
    customerName: seed.customerName,
    rentalId: seed.rentalId,
    unitCode: rental?.unitCode ?? null,
    category: seed.category,
    title: seed.title,
    description: seed.description,
    status: seed.status,
    createdAt: at(seed.created.dayOffset, seed.created.hour, seed.created.minute ?? 0),
    resolvedAt: seed.resolved ? at(seed.resolved.dayOffset, seed.resolved.hour, seed.resolved.minute ?? 0) : null,
    assignedStaffName: seed.assignedStaffName ?? null,
  }
}

export const MOCK_TICKETS: SupportTicket[] = [
  makeTicket(1, {
    rentalId: 4,
    customerName: 'Vũ Quốc Bảo',
    category: 'ACCESS',
    title: 'Thẻ từ không mở được cửa kho',
    description: 'Thẻ quẹt không nhận, đèn đỏ nhấp nháy tại kho #08.',
    status: 'IN_PROGRESS',
    created: { dayOffset: -1, hour: 8, minute: 20 },
    assignedStaffName: 'Lê Văn Đức',
  }),
  makeTicket(2, {
    rentalId: 5,
    customerName: 'Công ty TNHH VietLog',
    category: 'UNIT',
    title: 'Độ ẩm trong kho tăng cao',
    description: 'Cảm biến báo độ ẩm 68% RH, đề nghị kiểm tra thông gió.',
    status: 'OPEN',
    created: { dayOffset: 0, hour: 7, minute: 45 },
  }),
  makeTicket(3, {
    rentalId: 11,
    customerName: 'Trịnh Mai Phương',
    category: 'PAYMENT',
    title: 'Chưa nhận được hóa đơn tháng này',
    description: 'Khách báo chưa thấy hóa đơn trong mục thanh toán.',
    status: 'OPEN',
    created: { dayOffset: 0, hour: 9, minute: 15 },
  }),
  makeTicket(4, {
    rentalId: 6,
    customerName: 'Đỗ Thùy Linh',
    category: 'ITEMS',
    title: 'Cần hỗ trợ di chuyển thùng hàng',
    description: 'Nhờ nhân viên hỗ trợ xe đẩy lên tầng 3.',
    status: 'RESOLVED',
    created: { dayOffset: -1, hour: 13 },
    resolved: { dayOffset: -1, hour: 15 },
    assignedStaffName: 'Trần Thị Mai',
  }),
  makeTicket(5, {
    rentalId: null,
    customerName: 'Khách vãng lai',
    category: 'OTHER',
    title: 'Hỏi thủ tục thuê kho ngắn hạn',
    description: 'Khách hỏi thủ tục và bảng giá thuê 1 tháng.',
    status: 'CLOSED',
    created: { dayOffset: -3, hour: 10 },
    resolved: { dayOffset: -3, hour: 11 },
    assignedStaffName: 'Đỗ Văn Tuấn',
  }),
]
