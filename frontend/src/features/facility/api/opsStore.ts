import type { ActivityLog, Facility, Rental, StaffTask, SupportTicket } from '../types'
import { MOCK_FACILITIES } from './mockData'
import { MOCK_RENTALS, MOCK_STAFF_TASKS } from './rentalMockData'
import { MOCK_TICKETS } from './supportMockData'

export const facilityStore: Facility[] = MOCK_FACILITIES.map((item) => ({ ...item }))
export const rentalStore: Rental[] = MOCK_RENTALS.map((item) => ({ ...item }))
export const taskStore: StaffTask[] = MOCK_STAFF_TASKS.map((item) => ({ ...item }))
export const ticketStore: SupportTicket[] = MOCK_TICKETS.map((item) => ({ ...item }))

function daysAgoIso(days: number, hour: number, minute: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

export const logStore: ActivityLog[] = [
  {
    id: 1,
    actorName: 'Lê Phương Mai',
    action: 'POLICY_UPDATED',
    entityType: 'business_policies',
    entityId: 1,
    detail: 'Cập nhật chính sách: gia hạn 7 ngày, ân hạn quá hạn 3 ngày',
    ipAddress: '113.190.45.102',
    createdAt: daysAgoIso(1, 14, 28),
  },
  {
    id: 2,
    actorName: 'Lê Hoàng Nam',
    action: 'TASK_ASSIGNED',
    entityType: 'staff_tasks',
    entityId: 2,
    detail: 'Phân công bàn giao kho #12 cho Trần Thị Mai',
    ipAddress: '118.70.182.42',
    createdAt: daysAgoIso(0, 13, 50),
  },
  {
    id: 3,
    actorName: 'Đỗ Văn Tuấn',
    action: 'UNIT_STATUS_CHANGED',
    entityType: 'storage_units',
    entityId: 5,
    detail: 'Kiểm tra kho định kỳ: đạt yêu cầu',
    ipAddress: '118.70.182.55',
    createdAt: daysAgoIso(0, 8, 40),
  },
  {
    id: 4,
    actorName: 'system_worker',
    action: 'AUTO_OVERDUE_CHECK',
    entityType: 'rentals',
    entityId: 8,
    detail: 'Đánh dấu hợp đồng quá hạn trả kho',
    ipAddress: '127.0.0.1',
    createdAt: daysAgoIso(1, 0, 5),
  },
]

export const idCounters = {
  task: taskStore.reduce((max, item) => Math.max(max, item.id), 0),
  facility: facilityStore.reduce((max, item) => Math.max(max, item.id), 0),
  log: logStore.reduce((max, item) => Math.max(max, item.id), 0),
}

export interface ActivityLogInput {
  actorName: string
  action: string
  entityType: string | null
  entityId: number | null
  detail: string
  ipAddress: string
}

export function appendActivityLog(input: ActivityLogInput): ActivityLog {
  idCounters.log += 1
  const log: ActivityLog = {
    id: idCounters.log,
    createdAt: new Date().toISOString(),
    ...input,
  }
  logStore.push(log)
  return log
}
