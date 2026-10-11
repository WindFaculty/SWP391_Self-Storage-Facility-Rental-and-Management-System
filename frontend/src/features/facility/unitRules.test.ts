import { describe, expect, it } from 'vitest'
const TEST_UNIT_TYPES = [{ id: 2, name: 'Test unit type', sizeM2: 5, minMonthlyPrice: 1_200_000, maxMonthlyPrice: 1_800_000 }]
import { filterUnits, isStatusTransitionAllowed, requiresStatusReason, validateUnitInput } from './unitRules'
import type { StorageUnit, StorageUnitInput, UnitFilters } from './types'

function makeUnit(overrides: Partial<StorageUnit> = {}): StorageUnit {
  return {
    id: 1,
    facilityId: 1,
    unitTypeId: 1,
    unitCode: '#01',
    locationLabel: 'Tầng 1',
    monthlyPrice: 650_000,
    status: 'AVAILABLE',
    ...overrides,
  }
}

const BASE_FILTERS: UnitFilters = {
  facilityId: 1,
  search: '',
  unitTypeId: null,
  status: null,
  priceBand: null,
}

describe('isStatusTransitionAllowed', () => {
  it('blocks OCCUPIED -> AVAILABLE and any -> OCCUPIED', () => {
    expect(isStatusTransitionAllowed('OCCUPIED', 'AVAILABLE').allowed).toBe(false)
    expect(isStatusTransitionAllowed('AVAILABLE', 'OCCUPIED').allowed).toBe(false)
    expect(isStatusTransitionAllowed('INSPECTION', 'OCCUPIED').allowed).toBe(false)
  })

  it('allows AVAILABLE <-> INSPECTION/MAINTENANCE', () => {
    expect(isStatusTransitionAllowed('AVAILABLE', 'INSPECTION').allowed).toBe(true)
    expect(isStatusTransitionAllowed('AVAILABLE', 'MAINTENANCE').allowed).toBe(true)
    expect(isStatusTransitionAllowed('INSPECTION', 'AVAILABLE').allowed).toBe(true)
    expect(isStatusTransitionAllowed('MAINTENANCE', 'INSPECTION').allowed).toBe(true)
  })

  it('requires a reason for INSPECTION and MAINTENANCE only', () => {
    expect(requiresStatusReason('INSPECTION')).toBe(true)
    expect(requiresStatusReason('MAINTENANCE')).toBe(true)
    expect(requiresStatusReason('AVAILABLE')).toBe(false)
  })
})

describe('filterUnits', () => {
  const units = [
    makeUnit({ id: 1, unitCode: '#2', status: 'OCCUPIED', unitTypeId: 1, monthlyPrice: 800_000 }),
    makeUnit({ id: 2, unitCode: '#10', status: 'AVAILABLE', unitTypeId: 2, monthlyPrice: 1_500_000 }),
    makeUnit({ id: 3, unitCode: '#1', status: 'MAINTENANCE', unitTypeId: 3, monthlyPrice: 2_500_000 }),
    makeUnit({ id: 4, facilityId: 2, unitCode: '#99', status: 'AVAILABLE' }),
  ]

  it('scopes to the facility and sorts unit codes naturally', () => {
    const result = filterUnits(units, BASE_FILTERS)
    expect(result.map((unit) => unit.unitCode)).toEqual(['#1', '#2', '#10'])
  })

  it('filters by search, status, unit type and price band', () => {
    expect(filterUnits(units, { ...BASE_FILTERS, search: '#1' }).map((unit) => unit.unitCode)).toEqual([
      '#1',
      '#10',
    ])
    expect(filterUnits(units, { ...BASE_FILTERS, status: 'OCCUPIED' })).toHaveLength(1)
    expect(filterUnits(units, { ...BASE_FILTERS, unitTypeId: 2 })).toHaveLength(1)
    expect(filterUnits(units, { ...BASE_FILTERS, priceBand: 'high' }).map((unit) => unit.unitCode)).toEqual([
      '#1',
    ])
  })
})

describe('validateUnitInput', () => {
  const base: StorageUnitInput = {
    facilityId: 1,
    unitTypeId: 2,
    unitCode: '#24',
    locationLabel: 'Tầng 2',
    monthlyPrice: 1_500_000,
  }

  it('accepts a valid input', () => {
    expect(validateUnitInput(base, TEST_UNIT_TYPES, [], null)).toEqual({})
  })

  it('rejects a duplicate unit code within the same facility', () => {
    const errors = validateUnitInput(base, TEST_UNIT_TYPES, [makeUnit({ unitCode: '#24' })], null)
    expect(errors.unitCode).toBeTruthy()
  })

  it('rejects a price outside the unit type bounds', () => {
    const errors = validateUnitInput({ ...base, monthlyPrice: 5_000_000 }, TEST_UNIT_TYPES, [], null)
    expect(errors.monthlyPrice).toBeTruthy()
  })
})
