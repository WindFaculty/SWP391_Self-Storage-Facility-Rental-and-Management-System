import { describe, expect, it } from 'vitest'
import {
  canHandover,
  canReturn,
  filterRentals,
  filterTasks,
  isRentalExpiring,
  isTaskTransitionAllowed,
  matchesRentalTab,
} from './rentalRules'
import type { Rental, RentalFilters, StaffTask, TaskFilters } from './types'

function localIso(year: number, month: number, day: number, hour = 0, minute = 0): string {
  return new Date(year, month - 1, day, hour, minute).toISOString()
}

const TODAY = new Date(2026, 0, 15)

function makeRental(overrides: Partial<Rental> = {}): Rental {
  return {
    id: 1,
    facilityId: 1,
    customerName: 'Khách A',
    customerPhone: '0900 000 001',
    unitId: 1,
    unitCode: '#01',
    unitTypeId: 1,
    unitTypeName: 'Locker',
    startDate: '2026-01-01',
    endDate: '2026-04-01',
    pricePerMonth: 650_000,
    status: 'RESERVED',
    paymentState: 'PAID',
    appointmentAt: null,
    checkedInAt: null,
    accessMethod: null,
    handoverCondition: null,
    returnedAt: null,
    returnCondition: null,
    assignedStaffName: null,
    openHandoverTaskId: null,
    ...overrides,
  }
}

function makeTask(overrides: Partial<StaffTask> = {}): StaffTask {
  return {
    id: 1,
    facilityId: 1,
    taskType: 'HANDOVER',
    status: 'ASSIGNED',
    assignedStaffId: 201,
    assignedStaffName: 'NV A',
    rentalId: 1,
    ticketId: null,
    unitCode: '#01',
    customerName: 'Khách A',
    paymentState: 'PAID',
    scheduledAt: localIso(2026, 1, 15, 9),
    completedAt: null,
    notes: null,
    ...overrides,
  }
}

const BASE_RENTAL_FILTERS: RentalFilters = {
  facilityId: 1,
  tab: 'all',
  search: '',
  paymentState: null,
  unitTypeId: null,
}

const BASE_TASK_FILTERS: TaskFilters = {
  facilityId: 1,
  tab: 'all',
  status: null,
  slot: 'all',
  day: 'today',
  rentalId: null,
  search: '',
}

describe('rental tabs and expiry', () => {
  it('matches tabs by status and expiring window', () => {
    const expiring = makeRental({ status: 'ACTIVE', endDate: '2026-01-25' })
    expect(matchesRentalTab(expiring, 'expiring', TODAY)).toBe(true)
    expect(matchesRentalTab(expiring, 'active', TODAY)).toBe(true)
    expect(matchesRentalTab(expiring, 'reserved', TODAY)).toBe(false)
    expect(matchesRentalTab(makeRental({ status: 'OVERDUE' }), 'overdue', TODAY)).toBe(true)
    expect(matchesRentalTab(makeRental({ status: 'RETURNED' }), 'ended', TODAY)).toBe(true)
    expect(matchesRentalTab(makeRental({ status: 'CANCELLED' }), 'ended', TODAY)).toBe(true)
    expect(matchesRentalTab(makeRental({ status: 'EXPIRED' }), 'ended', TODAY)).toBe(true)
  })

  it('only treats ACTIVE rentals as expiring', () => {
    expect(isRentalExpiring(makeRental({ status: 'ACTIVE', endDate: '2026-01-25' }), TODAY)).toBe(true)
    expect(isRentalExpiring(makeRental({ status: 'ACTIVE', endDate: '2026-03-01' }), TODAY)).toBe(false)
    expect(isRentalExpiring(makeRental({ status: 'RESERVED', endDate: '2026-01-20' }), TODAY)).toBe(false)
  })
})

describe('filterRentals', () => {
  const rentals = [
    makeRental({ id: 1, customerName: 'Nguyễn Văn A', unitCode: '#01', paymentState: 'PAID' }),
    makeRental({ id: 2, customerName: 'Trần Thị B', unitCode: '#12', paymentState: 'PENDING' }),
    makeRental({ id: 3, facilityId: 2, customerName: 'Khách cơ sở khác' }),
  ]

  it('scopes to facility and searches by customer and unit code', () => {
    expect(filterRentals(rentals, BASE_RENTAL_FILTERS, TODAY)).toHaveLength(2)
    expect(
      filterRentals(rentals, { ...BASE_RENTAL_FILTERS, search: 'thị b' }, TODAY).map((r) => r.id),
    ).toEqual([2])
    expect(
      filterRentals(rentals, { ...BASE_RENTAL_FILTERS, search: '#01' }, TODAY).map((r) => r.id),
    ).toEqual([1])
  })

  it('filters by payment state', () => {
    expect(
      filterRentals(rentals, { ...BASE_RENTAL_FILTERS, paymentState: 'PENDING' }, TODAY).map((r) => r.id),
    ).toEqual([2])
  })
})

describe('canHandover', () => {
  it('allows only RESERVED rentals with full payment', () => {
    expect(canHandover(makeRental({ status: 'RESERVED', paymentState: 'PAID' })).allowed).toBe(true)
    expect(canHandover(makeRental({ status: 'RESERVED', paymentState: 'PENDING' })).allowed).toBe(false)
    expect(canHandover(makeRental({ status: 'ACTIVE', paymentState: 'PAID' })).allowed).toBe(false)
    expect(canHandover(makeRental({ status: 'RESERVED', paymentState: 'OVERDUE' })).reason).toContain(
      'Chưa thu đủ',
    )
  })
})

describe('canReturn', () => {
  it('allows ACTIVE and OVERDUE rentals only', () => {
    expect(canReturn(makeRental({ status: 'ACTIVE' })).allowed).toBe(true)
    expect(canReturn(makeRental({ status: 'OVERDUE' })).allowed).toBe(true)
    expect(canReturn(makeRental({ status: 'RETURNED' })).allowed).toBe(false)
    expect(canReturn(makeRental({ status: 'RESERVED' })).allowed).toBe(false)
    expect(canReturn(makeRental({ status: 'CANCELLED' })).reason).toContain('đang thuê hoặc quá hạn')
  })
})

describe('task transitions', () => {
  it('allows ASSIGNED -> IN_PROGRESS -> DONE and blocks the rest', () => {
    expect(isTaskTransitionAllowed('ASSIGNED', 'IN_PROGRESS').allowed).toBe(true)
    expect(isTaskTransitionAllowed('IN_PROGRESS', 'DONE').allowed).toBe(true)
    expect(isTaskTransitionAllowed('ASSIGNED', 'DONE').allowed).toBe(false)
    expect(isTaskTransitionAllowed('DONE', 'IN_PROGRESS').allowed).toBe(false)
    expect(isTaskTransitionAllowed('CANCELLED', 'ASSIGNED').allowed).toBe(false)
  })
})

describe('filterTasks', () => {
  const tasks = [
    makeTask({ id: 1, scheduledAt: localIso(2026, 1, 15, 9) }),
    makeTask({ id: 2, scheduledAt: localIso(2026, 1, 15, 14), taskType: 'RETURN_INSPECTION' }),
    makeTask({ id: 3, scheduledAt: localIso(2026, 1, 16, 9) }),
    makeTask({ id: 4, scheduledAt: localIso(2026, 1, 15, 10), rentalId: 7 }),
  ]

  it('filters to today and by slot', () => {
    expect(filterTasks(tasks, BASE_TASK_FILTERS, TODAY).map((t) => t.id)).toEqual([1, 4, 2])
    expect(filterTasks(tasks, { ...BASE_TASK_FILTERS, slot: 'morning' }, TODAY).map((t) => t.id)).toEqual([
      1, 4,
    ])
    expect(
      filterTasks(tasks, { ...BASE_TASK_FILTERS, slot: 'afternoon' }, TODAY).map((t) => t.id),
    ).toEqual([2])
  })

  it('filters by task type and rental', () => {
    expect(
      filterTasks(tasks, { ...BASE_TASK_FILTERS, tab: 'RETURN_INSPECTION' }, TODAY).map((t) => t.id),
    ).toEqual([2])
    expect(filterTasks(tasks, { ...BASE_TASK_FILTERS, rentalId: 7 }, TODAY).map((t) => t.id)).toEqual([4])
  })
})
