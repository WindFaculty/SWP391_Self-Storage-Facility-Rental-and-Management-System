import type {
  AccessMethod,
  PaymentState,
  Rental,
  RentalFilters,
  RentalStatus,
  RentalTab,
  StaffTask,
  TaskFilters,
  TaskStatus,
  TaskType,
} from './types'

export const RENTAL_STATUS_LABELS: Record<RentalStatus, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  RESERVED: 'Chờ nhận kho',
  ACTIVE: 'Đang thuê',
  OVERDUE: 'Quá hạn',
  RETURNED: 'Đã trả kho',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn giữ chỗ',
}

export const PAYMENT_STATE_LABELS: Record<PaymentState, string> = {
  PAID: 'Đã thanh toán',
  PENDING: 'Chờ thanh toán',
  OVERDUE: 'Quá hạn thanh toán',
}

export const ACCESS_METHOD_LABELS: Record<AccessMethod, string> = {
  KEY: 'Chìa khóa',
  ACCESS_CARD: 'Thẻ truy cập',
  ACCESS_CODE: 'Mã truy cập',
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  HANDOVER: 'Bàn giao / Check-in',
  RETURN_INSPECTION: 'Kiểm tra trả kho',
  UNIT_INSPECTION: 'Kiểm tra kho',
  SUPPORT: 'Hỗ trợ khách hàng',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  ASSIGNED: 'Chờ tiếp nhận',
  IN_PROGRESS: 'Đang xử lý',
  DONE: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
}

export const EXPIRING_WINDOW_DAYS = 14

const DAY_MS = 86_400_000

export function daysUntilDate(dateIso: string, today: Date): number {
  const target = new Date(`${dateIso}T00:00:00`)
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target.getTime() - base.getTime()) / DAY_MS)
}

export function isRentalExpiring(rental: Rental, today: Date): boolean {
  if (rental.status !== 'ACTIVE') {
    return false
  }
  const days = daysUntilDate(rental.endDate, today)
  return days >= 0 && days <= EXPIRING_WINDOW_DAYS
}

export function matchesRentalTab(rental: Rental, tab: RentalTab, today: Date): boolean {
  switch (tab) {
    case 'all':
      return true
    case 'reserved':
      return rental.status === 'RESERVED'
    case 'active':
      return rental.status === 'ACTIVE'
    case 'expiring':
      return isRentalExpiring(rental, today)
    case 'overdue':
      return rental.status === 'OVERDUE'
    case 'ended':
      return (
        rental.status === 'RETURNED' ||
        rental.status === 'CANCELLED' ||
        rental.status === 'EXPIRED'
      )
  }
}

export function filterRentals(rentals: Rental[], filters: RentalFilters, today: Date): Rental[] {
  const search = filters.search.trim().toLowerCase()
  return rentals
    .filter((rental) => rental.facilityId === filters.facilityId)
    .filter((rental) => matchesRentalTab(rental, filters.tab, today))
    .filter((rental) => (filters.paymentState ? rental.paymentState === filters.paymentState : true))
    .filter((rental) => (filters.unitTypeId ? rental.unitTypeId === filters.unitTypeId : true))
    .filter((rental) =>
      search
        ? `#${rental.id} ${rental.customerName} ${rental.customerPhone} ${rental.unitCode}`
            .toLowerCase()
            .includes(search)
        : true,
    )
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
}

export function canHandover(rental: Rental): { allowed: boolean; reason?: string } {
  if (rental.status !== 'RESERVED') {
    return { allowed: false, reason: 'Chỉ bàn giao đơn đang ở trạng thái Chờ nhận kho.' }
  }
  if (rental.paymentState !== 'PAID') {
    return {
      allowed: false,
      reason: 'Chưa thu đủ cọc và phí thuê theo chính sách — không thể bàn giao kho.',
    }
  }
  return { allowed: true }
}

const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['DONE', 'CANCELLED'],
  DONE: [],
  CANCELLED: [],
}

export function isTaskTransitionAllowed(
  from: TaskStatus,
  to: TaskStatus,
): { allowed: boolean; reason?: string } {
  if (TASK_TRANSITIONS[from].includes(to)) {
    return { allowed: true }
  }
  if (from === 'DONE' || from === 'CANCELLED') {
    return { allowed: false, reason: 'Công việc đã kết thúc, không thể thay đổi.' }
  }
  return { allowed: false, reason: 'Chuyển trạng thái công việc không hợp lệ.' }
}

export function isSameDay(iso: string, day: Date): boolean {
  const date = new Date(iso)
  return (
    date.getFullYear() === day.getFullYear() &&
    date.getMonth() === day.getMonth() &&
    date.getDate() === day.getDate()
  )
}

export function isMorningSlot(iso: string): boolean {
  return new Date(iso).getHours() < 12
}

export function filterTasks(tasks: StaffTask[], filters: TaskFilters, today: Date): StaffTask[] {
  const search = filters.search.trim().toLowerCase()
  return tasks
    .filter((task) => task.facilityId === filters.facilityId)
    .filter((task) => (filters.day === 'today' ? isSameDay(task.scheduledAt, today) : true))
    .filter((task) => (filters.tab === 'all' ? true : task.taskType === filters.tab))
    .filter((task) => (filters.status ? task.status === filters.status : true))
    .filter((task) =>
      filters.slot === 'all' ? true : filters.slot === 'morning' ? isMorningSlot(task.scheduledAt) : !isMorningSlot(task.scheduledAt),
    )
    .filter((task) => (filters.rentalId ? task.rentalId === filters.rentalId : true))
    .filter((task) =>
      search
        ? `#${task.id} ${task.assignedStaffName} ${task.customerName ?? ''} ${task.unitCode ?? ''}`
            .toLowerCase()
            .includes(search)
        : true,
    )
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
}
