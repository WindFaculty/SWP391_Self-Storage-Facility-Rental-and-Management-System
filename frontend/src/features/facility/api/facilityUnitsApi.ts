import {
  filterUnits,
  isStatusTransitionAllowed,
  requiresStatusReason,
  validateUnitInput,
} from '../unitRules'
import type {
  Facility,
  StorageUnit,
  StorageUnitInput,
  UnitFilters,
  UnitStatus,
  UnitSummary,
  UnitType,
} from '../types'
import { MOCK_FACILITIES, MOCK_STORAGE_UNITS, MOCK_UNIT_TYPES } from './mockData'

const LATENCY_MS = 150

const store: StorageUnit[] = MOCK_STORAGE_UNITS.map((unit) => ({ ...unit }))
let idSequence = store.reduce((max, unit) => Math.max(max, unit.id), 0)

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, LATENCY_MS))
}

export async function listFacilities(): Promise<Facility[]> {
  await delay()
  return MOCK_FACILITIES.map((facility) => ({ ...facility }))
}

export async function listUnitTypes(): Promise<UnitType[]> {
  await delay()
  return MOCK_UNIT_TYPES.map((unitType) => ({ ...unitType }))
}

export async function listUnits(
  filters: UnitFilters,
): Promise<{ items: StorageUnit[]; summary: UnitSummary }> {
  await delay()
  const facilityUnits = store.filter((unit) => unit.facilityId === filters.facilityId)
  const byStatus: Record<UnitStatus, number> = {
    AVAILABLE: 0,
    OCCUPIED: 0,
    INSPECTION: 0,
    MAINTENANCE: 0,
  }
  facilityUnits.forEach((unit) => {
    byStatus[unit.status] += 1
  })
  return {
    items: filterUnits(facilityUnits, filters).map((unit) => ({ ...unit })),
    summary: { total: facilityUnits.length, byStatus },
  }
}

export async function createUnit(input: StorageUnitInput): Promise<StorageUnit> {
  await delay()
  const errors = validateUnitInput(input, MOCK_UNIT_TYPES, store, null)
  const firstError = Object.values(errors)[0]
  if (firstError) {
    throw new Error(firstError)
  }
  idSequence += 1
  const unit: StorageUnit = { id: idSequence, status: 'AVAILABLE', ...input }
  store.push(unit)
  return { ...unit }
}

export async function updateUnit(id: number, input: StorageUnitInput): Promise<StorageUnit> {
  await delay()
  const index = store.findIndex((unit) => unit.id === id)
  if (index < 0) {
    throw new Error('Không tìm thấy kho.')
  }
  const errors = validateUnitInput(input, MOCK_UNIT_TYPES, store, id)
  const firstError = Object.values(errors)[0]
  if (firstError) {
    throw new Error(firstError)
  }
  store[index] = { ...store[index], ...input }
  return { ...store[index] }
}

export async function changeUnitStatus(
  id: number,
  to: UnitStatus,
  reason?: string,
): Promise<StorageUnit> {
  await delay()
  const index = store.findIndex((unit) => unit.id === id)
  if (index < 0) {
    throw new Error('Không tìm thấy kho.')
  }
  const transition = isStatusTransitionAllowed(store[index].status, to)
  if (!transition.allowed) {
    throw new Error(transition.reason)
  }
  if (requiresStatusReason(to) && !reason?.trim()) {
    throw new Error('Vui lòng nhập lý do chuyển trạng thái.')
  }
  store[index] = { ...store[index], status: to }
  return { ...store[index] }
}
