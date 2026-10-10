import { listUnits } from '../../facility/api/facilityUnitsApi'
import { appendActivityLog, facilityStore, idCounters } from '../../facility/api/opsStore'
import { listRentals } from '../../facility/api/rentalOpsApi'
import {
  monthLabel,
  periodRange,
  validateFacilityInput,
  validateFeeTypeInput,
  validatePolicy,
  type PolicyInput,
} from '../managementRules'
import type {
  BusinessPolicy,
  FacilityOverview,
  FacilityReportRow,
  FeeType,
  ReportFilters,
  ReportSummary,
  RevenuePoint,
} from '../types'
import { MANAGER_BY_FACILITY, MOCK_FEE_TYPES, MOCK_PAYMENTS, MOCK_POLICY } from './managementMockData'

const LATENCY_MS = 150
const ACTOR_IP = '113.190.45.102'

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, LATENCY_MS))
}

let policyStore: BusinessPolicy = { ...MOCK_POLICY }
const feeStore: FeeType[] = MOCK_FEE_TYPES.map((item) => ({ ...item }))

export async function getBusinessPolicy(): Promise<BusinessPolicy> {
  await delay()
  return { ...policyStore }
}

export async function updateBusinessPolicy(
  input: PolicyInput,
  actorName: string,
): Promise<BusinessPolicy> {
  await delay()
  const errors = validatePolicy(input)
  const firstError = Object.values(errors)[0]
  if (firstError) {
    throw new Error(firstError)
  }
  policyStore = { ...input, updatedAt: new Date().toISOString(), updatedBy: actorName }
  appendActivityLog({
    actorName,
    action: 'POLICY_UPDATED',
    entityType: 'business_policies',
    entityId: 1,
    detail: `Cọc ${input.depositPercent}% • gia hạn báo trước ${input.renewalNoticeDays} ngày • ân hạn ${input.overdueGraceDays} ngày`,
    ipAddress: ACTOR_IP,
  })
  return { ...policyStore }
}

export async function listFeeTypes(): Promise<FeeType[]> {
  await delay()
  return feeStore.map((item) => ({ ...item }))
}

export interface FeeTypeInput {
  name: string
  defaultAmount: number
  active: boolean
}

export async function updateFeeType(
  id: number,
  input: FeeTypeInput,
  actorName: string,
): Promise<FeeType> {
  await delay()
  const index = feeStore.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new Error('Không tìm thấy phụ phí.')
  }
  const errors = validateFeeTypeInput(input)
  const firstError = Object.values(errors)[0]
  if (firstError) {
    throw new Error(firstError)
  }
  feeStore[index] = { ...feeStore[index], ...input, name: input.name.trim() }
  appendActivityLog({
    actorName,
    action: 'FEE_UPDATED',
    entityType: 'fee_types',
    entityId: id,
    detail: `Cập nhật phụ phí ${feeStore[index].code}: ${feeStore[index].name}`,
    ipAddress: ACTOR_IP,
  })
  return { ...feeStore[index] }
}

async function facilityMetrics(facilityId: number) {
  const [units, rentals] = await Promise.all([
    listUnits({ facilityId, search: '', unitTypeId: null, status: null, priceBand: null }),
    listRentals({ facilityId, tab: 'all', search: '', paymentState: null, unitTypeId: null }),
  ])
  return { units: units.summary, rentals: rentals.summary }
}

function occupancyRate(occupied: number, total: number): number {
  return total > 0 ? Math.round((occupied / total) * 1000) / 10 : 0
}

export async function listFacilityOverviews(): Promise<FacilityOverview[]> {
  const overviews = await Promise.all(
    facilityStore.map(async (facility) => {
      const { units, rentals } = await facilityMetrics(facility.id)
      return {
        id: facility.id,
        code: facility.code,
        name: facility.name,
        address: facility.address,
        status: facility.status,
        managerName: MANAGER_BY_FACILITY[facility.id] ?? null,
        unitTotal: units.total,
        unitOccupied: units.byStatus.OCCUPIED,
        occupancyRate: occupancyRate(units.byStatus.OCCUPIED, units.total),
        activeRentals: rentals.byStatus.ACTIVE,
        overdueRentals: rentals.byStatus.OVERDUE,
      }
    }),
  )
  return overviews
}

export interface FacilityInput {
  code: string
  name: string
  address: string
}

export async function createFacility(input: FacilityInput, actorName: string): Promise<void> {
  await delay()
  const errors = validateFacilityInput(input, facilityStore, null)
  const firstError = Object.values(errors)[0]
  if (firstError) {
    throw new Error(firstError)
  }
  idCounters.facility += 1
  facilityStore.push({
    id: idCounters.facility,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    address: input.address.trim(),
    status: 'ACTIVE',
  })
  appendActivityLog({
    actorName,
    action: 'FACILITY_CREATED',
    entityType: 'facilities',
    entityId: idCounters.facility,
    detail: `Tạo cơ sở ${input.code.trim().toUpperCase()} — ${input.name.trim()}`,
    ipAddress: ACTOR_IP,
  })
}

export async function updateFacility(
  id: number,
  input: FacilityInput,
  actorName: string,
): Promise<void> {
  await delay()
  const facility = facilityStore.find((item) => item.id === id)
  if (!facility) {
    throw new Error('Không tìm thấy cơ sở.')
  }
  const errors = validateFacilityInput(input, facilityStore, id)
  const firstError = Object.values(errors)[0]
  if (firstError) {
    throw new Error(firstError)
  }
  facility.code = input.code.trim().toUpperCase()
  facility.name = input.name.trim()
  facility.address = input.address.trim()
  appendActivityLog({
    actorName,
    action: 'FACILITY_UPDATED',
    entityType: 'facilities',
    entityId: id,
    detail: `Cập nhật cơ sở ${facility.code} — ${facility.name}`,
    ipAddress: ACTOR_IP,
  })
}

export async function setFacilityStatus(
  id: number,
  status: 'ACTIVE' | 'INACTIVE',
  actorName: string,
): Promise<void> {
  await delay()
  const facility = facilityStore.find((item) => item.id === id)
  if (!facility) {
    throw new Error('Không tìm thấy cơ sở.')
  }
  if (facility.status === status) {
    throw new Error('Trạng thái cơ sở không thay đổi.')
  }
  facility.status = status
  appendActivityLog({
    actorName,
    action: 'FACILITY_STATUS_CHANGED',
    entityType: 'facilities',
    entityId: id,
    detail:
      status === 'ACTIVE'
        ? `Kích hoạt lại cơ sở ${facility.code}`
        : `Tạm dừng nhận khách mới tại cơ sở ${facility.code}`,
    ipAddress: ACTOR_IP,
  })
}

export async function getReportSummary(filters: ReportFilters): Promise<ReportSummary> {
  const now = new Date()
  const { from, to } = periodRange(filters.period, now)
  const fromIso = from.toISOString()
  const toIso = to.toISOString()

  const targetFacilities = filters.facilityId
    ? facilityStore.filter((facility) => facility.id === filters.facilityId)
    : facilityStore
  const payments = MOCK_PAYMENTS.filter(
    (payment) =>
      payment.paidAt >= fromIso &&
      payment.paidAt <= toIso &&
      (!filters.facilityId || payment.facilityId === filters.facilityId),
  )

  const rows: FacilityReportRow[] = await Promise.all(
    targetFacilities.map(async (facility) => {
      const { units, rentals } = await facilityMetrics(facility.id)
      const revenue = payments
        .filter((payment) => payment.facilityId === facility.id)
        .reduce((total, payment) => total + payment.amount, 0)
      return {
        facilityId: facility.id,
        name: facility.name,
        unitTotal: units.total,
        unitOccupied: units.byStatus.OCCUPIED,
        unitAvailable: units.byStatus.AVAILABLE,
        occupancyRate: occupancyRate(units.byStatus.OCCUPIED, units.total),
        revenue,
        activeRentals: rentals.byStatus.ACTIVE,
        overdueRentals: rentals.byStatus.OVERDUE,
      }
    }),
  )

  const revenueByMonth = new Map<string, { label: string; amount: number }>()
  payments.forEach((payment) => {
    const date = new Date(payment.paidAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const current = revenueByMonth.get(key)
    if (current) {
      current.amount += payment.amount
    } else {
      revenueByMonth.set(key, { label: monthLabel(date), amount: payment.amount })
    }
  })
  const revenuePoints: RevenuePoint[] = [...revenueByMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ month: key, label: value.label, amount: value.amount }))

  const totalUnits = rows.reduce((total, row) => total + row.unitTotal, 0)
  const totalOccupied = rows.reduce((total, row) => total + row.unitOccupied, 0)

  return {
    totalRevenue: payments.reduce((total, payment) => total + payment.amount, 0),
    occupancyRate: occupancyRate(totalOccupied, totalUnits),
    activeRentals: rows.reduce((total, row) => total + row.activeRentals, 0),
    overdueRentals: rows.reduce((total, row) => total + row.overdueRentals, 0),
    revenuePoints,
    rows,
  }
}

export async function getFacilityRevenueSeries(facilityId: number, months = 6): Promise<RevenuePoint[]> {
  await delay()
  const now = new Date()
  const points: RevenuePoint[] = []
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1)
    const amount = MOCK_PAYMENTS.filter(
      (payment) =>
        payment.facilityId === facilityId &&
        payment.paidAt >= start.toISOString() &&
        payment.paidAt < end.toISOString(),
    ).reduce((total, payment) => total + payment.amount, 0)
    points.push({
      month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      label: monthLabel(start),
      amount,
    })
  }
  return points
}
