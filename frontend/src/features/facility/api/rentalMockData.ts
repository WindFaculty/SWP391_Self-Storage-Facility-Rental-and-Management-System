import { MOCK_STORAGE_UNITS, MOCK_UNIT_TYPES } from './mockData'
import type {
  PaymentState,
  Rental,
  RentalStatus,
  StaffMember,
  StaffTask,
  TaskStatus,
  TaskType,
} from '../types'

function at(dayOffset: number, hour: number, minute = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

function dateOnly(dayOffset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function today(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export const MOCK_STAFF: StaffMember[] = [
  { id: 201, fullName: 'Lê Văn Đức', facilityId: 1 },
  { id: 202, fullName: 'Trần Thị Mai', facilityId: 1 },
  { id: 203, fullName: 'Đỗ Văn Tuấn', facilityId: 1 },
]

function unitInfo(unitId: number) {
  const unit = MOCK_STORAGE_UNITS.find((item) => item.id === unitId)
  const unitType = unit ? MOCK_UNIT_TYPES.find((type) => type.id === unit.unitTypeId) : undefined
  return {
    unitCode: unit?.unitCode ?? '—',
    unitTypeId: unit?.unitTypeId ?? 0,
    unitTypeName: unitType?.name ?? '—',
  }
}

interface RentalSeed {
  unitId: number
  customerName: string
  customerPhone: string
  startOffset: number
  endOffset: number
  pricePerMonth: number
  status: RentalStatus
  paymentState: PaymentState
  appointment?: { dayOffset: number; hour: number; minute?: number }
  assignedStaffName?: string
}

function makeRental(id: number, seed: RentalSeed): Rental {
  const { unitCode, unitTypeId, unitTypeName } = unitInfo(seed.unitId)
  const checkedIn = seed.status === 'ACTIVE' || seed.status === 'OVERDUE'
  return {
    id,
    facilityId: 1,
    customerName: seed.customerName,
    customerPhone: seed.customerPhone,
    unitId: seed.unitId,
    unitCode,
    unitTypeId,
    unitTypeName,
    startDate: dateOnly(seed.startOffset),
    endDate: dateOnly(seed.endOffset),
    pricePerMonth: seed.pricePerMonth,
    status: seed.status,
    paymentState: seed.paymentState,
    appointmentAt: seed.appointment
      ? at(seed.appointment.dayOffset, seed.appointment.hour, seed.appointment.minute ?? 0)
      : null,
    checkedInAt: checkedIn ? at(seed.startOffset, 9) : null,
    accessMethod: checkedIn ? 'ACCESS_CARD' : null,
    handoverCondition: checkedIn ? 'Kho sạch, khóa điện tử và thẻ truy cập hoạt động tốt.' : null,
    assignedStaffName: seed.assignedStaffName ?? null,
    openHandoverTaskId: null,
  }
}

export const MOCK_RENTALS: Rental[] = [
  makeRental(1, {
    unitId: 24,
    customerName: 'Nguyễn Minh Quân',
    customerPhone: '0912 345 678',
    startOffset: 0,
    endOffset: 90,
    pricePerMonth: 1_450_000,
    status: 'RESERVED',
    paymentState: 'PAID',
    appointment: { dayOffset: 0, hour: 9 },
    assignedStaffName: 'Lê Văn Đức',
  }),
  makeRental(2, {
    unitId: 12,
    customerName: 'Trần Bích Ngọc',
    customerPhone: '0987 112 233',
    startOffset: 0,
    endOffset: 180,
    pricePerMonth: 650_000,
    status: 'RESERVED',
    paymentState: 'PENDING',
    appointment: { dayOffset: 0, hour: 14 },
    assignedStaffName: 'Trần Thị Mai',
  }),
  makeRental(3, {
    unitId: 5,
    customerName: 'Lê Thị Ngọc Mai',
    customerPhone: '0903 456 789',
    startOffset: 0,
    endOffset: 90,
    pricePerMonth: 1_450_000,
    status: 'RESERVED',
    paymentState: 'PAID',
    appointment: { dayOffset: 0, hour: 16, minute: 30 },
  }),
  makeRental(4, {
    unitId: 8,
    customerName: 'Vũ Quốc Bảo',
    customerPhone: '0938 223 344',
    startOffset: -20,
    endOffset: 10,
    pricePerMonth: 650_000,
    status: 'ACTIVE',
    paymentState: 'PAID',
  }),
  makeRental(5, {
    unitId: 18,
    customerName: 'Công ty TNHH VietLog',
    customerPhone: '024 3888 6622',
    startOffset: -60,
    endOffset: 40,
    pricePerMonth: 2_600_000,
    status: 'ACTIVE',
    paymentState: 'PAID',
  }),
  makeRental(6, {
    unitId: 22,
    customerName: 'Đỗ Thùy Linh',
    customerPhone: '0966 778 899',
    startOffset: -30,
    endOffset: 5,
    pricePerMonth: 2_600_000,
    status: 'ACTIVE',
    paymentState: 'PAID',
  }),
  makeRental(7, {
    unitId: 14,
    customerName: 'Phạm Quốc Huy',
    customerPhone: '0977 334 455',
    startOffset: -95,
    endOffset: -3,
    pricePerMonth: 1_450_000,
    status: 'OVERDUE',
    paymentState: 'OVERDUE',
  }),
  makeRental(8, {
    unitId: 20,
    customerName: 'Hoàng Anh Tuấn',
    customerPhone: '0911 556 677',
    startOffset: -120,
    endOffset: -2,
    pricePerMonth: 650_000,
    status: 'RETURNED',
    paymentState: 'PAID',
  }),
  makeRental(9, {
    unitId: 3,
    customerName: 'Bùi Thanh Vân',
    customerPhone: '0944 667 788',
    startOffset: -15,
    endOffset: 75,
    pricePerMonth: 1_450_000,
    status: 'CANCELLED',
    paymentState: 'PENDING',
    appointment: { dayOffset: -15, hour: 10 },
  }),
  makeRental(10, {
    unitId: 25,
    customerName: 'Ngô Đức Thịnh',
    customerPhone: '0909 887 766',
    startOffset: 0,
    endOffset: 90,
    pricePerMonth: 1_450_000,
    status: 'PENDING_PAYMENT',
    paymentState: 'PENDING',
  }),
  makeRental(11, {
    unitId: 2,
    customerName: 'Trịnh Mai Phương',
    customerPhone: '0922 118 899',
    startOffset: -10,
    endOffset: 80,
    pricePerMonth: 650_000,
    status: 'ACTIVE',
    paymentState: 'PAID',
  }),
  makeRental(12, {
    unitId: 6,
    customerName: 'Đặng Quốc Cường',
    customerPhone: '0955 443 322',
    startOffset: 1,
    endOffset: 91,
    pricePerMonth: 1_450_000,
    status: 'RESERVED',
    paymentState: 'PAID',
    appointment: { dayOffset: 1, hour: 10 },
    assignedStaffName: 'Đỗ Văn Tuấn',
  }),
]

interface TaskSeed {
  taskType: TaskType
  status: TaskStatus
  staffId: number
  rentalId?: number
  ticketId?: number
  scheduled: { dayOffset: number; hour: number; minute?: number }
  completed?: { dayOffset: number; hour: number; minute?: number }
  notes?: string
  customerNameOverride?: string
}

function rentalInfo(rentalId: number | undefined) {
  const rental = rentalId ? MOCK_RENTALS.find((item) => item.id === rentalId) : undefined
  return {
    unitCode: rental?.unitCode ?? null,
    customerName: rental?.customerName ?? null,
    paymentState: rental?.paymentState ?? null,
  }
}

function makeTask(id: number, seed: TaskSeed): StaffTask {
  const staff = MOCK_STAFF.find((member) => member.id === seed.staffId)
  const info = rentalInfo(seed.rentalId)
  return {
    id,
    facilityId: 1,
    taskType: seed.taskType,
    status: seed.status,
    assignedStaffId: seed.staffId,
    assignedStaffName: staff?.fullName ?? '—',
    rentalId: seed.rentalId ?? null,
    ticketId: seed.ticketId ?? null,
    unitCode: info.unitCode,
    customerName: seed.customerNameOverride ?? info.customerName,
    paymentState: info.paymentState,
    scheduledAt: at(seed.scheduled.dayOffset, seed.scheduled.hour, seed.scheduled.minute ?? 0),
    completedAt: seed.completed ? at(seed.completed.dayOffset, seed.completed.hour, seed.completed.minute ?? 0) : null,
    notes: seed.notes ?? null,
  }
}

export const MOCK_STAFF_TASKS: StaffTask[] = [
  makeTask(1, {
    taskType: 'HANDOVER',
    status: 'ASSIGNED',
    staffId: 201,
    rentalId: 1,
    scheduled: { dayOffset: 0, hour: 9 },
  }),
  makeTask(2, {
    taskType: 'HANDOVER',
    status: 'ASSIGNED',
    staffId: 202,
    rentalId: 2,
    scheduled: { dayOffset: 0, hour: 14 },
  }),
  makeTask(3, {
    taskType: 'RETURN_INSPECTION',
    status: 'IN_PROGRESS',
    staffId: 203,
    rentalId: 8,
    scheduled: { dayOffset: 0, hour: 11 },
  }),
  makeTask(4, {
    taskType: 'UNIT_INSPECTION',
    status: 'DONE',
    staffId: 203,
    rentalId: 5,
    scheduled: { dayOffset: 0, hour: 8 },
    completed: { dayOffset: 0, hour: 8, minute: 40 },
    notes: 'Khóa điện tử và cảm biến nhiệt ẩm hoạt động tốt.',
  }),
  makeTask(5, {
    taskType: 'UNIT_INSPECTION',
    status: 'ASSIGNED',
    staffId: 202,
    rentalId: 6,
    scheduled: { dayOffset: 0, hour: 15, minute: 30 },
  }),
  makeTask(6, {
    taskType: 'SUPPORT',
    status: 'ASSIGNED',
    staffId: 201,
    ticketId: 1,
    scheduled: { dayOffset: 0, hour: 10, minute: 30 },
    customerNameOverride: 'Nguyễn Minh Quân',
  }),
  makeTask(7, {
    taskType: 'HANDOVER',
    status: 'ASSIGNED',
    staffId: 203,
    rentalId: 12,
    scheduled: { dayOffset: 1, hour: 10 },
  }),
  makeTask(8, {
    taskType: 'UNIT_INSPECTION',
    status: 'DONE',
    staffId: 201,
    rentalId: 11,
    scheduled: { dayOffset: -1, hour: 9 },
    completed: { dayOffset: -1, hour: 9, minute: 30 },
    notes: 'Vệ sinh kho, kiểm tra gioăng cửa.',
  }),
]

const rentalOne = MOCK_RENTALS.find((rental) => rental.id === 1)
if (rentalOne) {
  rentalOne.openHandoverTaskId = 1
}
const rentalTwo = MOCK_RENTALS.find((rental) => rental.id === 2)
if (rentalTwo) {
  rentalTwo.openHandoverTaskId = 2
}
const rentalTwelve = MOCK_RENTALS.find((rental) => rental.id === 12)
if (rentalTwelve) {
  rentalTwelve.openHandoverTaskId = 7
}
