import { describe, expect, it } from 'vitest'
import { facilityStore, logStore } from '../../facility/api/opsStore'
import {
  createFacility,
  getReportSummary,
  setFacilityStatus,
  updateBusinessPolicy,
  updateFeeType,
} from './managementApi'

const VALID_POLICY = {
  depositPercent: 100,
  renewalNoticeDays: 7,
  returnNoticeDays: 3,
  overdueGraceDays: 3,
  overdueFeePerDay: 20_000,
  cancellationFee: 200_000,
  maxDiscountPercent: 10,
}

describe('business policy updates', () => {
  it('rejects invalid policy values', async () => {
    await expect(updateBusinessPolicy({ ...VALID_POLICY, depositPercent: 250 }, 'Tester')).rejects.toThrow(
      'Phần trăm cọc',
    )
  })

  it('saves a valid policy and appends an activity log', async () => {
    const before = logStore.length
    const updated = await updateBusinessPolicy({ ...VALID_POLICY, overdueGraceDays: 5 }, 'Lê Phương Mai')

    expect(updated.overdueGraceDays).toBe(5)
    expect(updated.updatedBy).toBe('Lê Phương Mai')
    expect(updated.updatedAt).toBeTruthy()
    expect(logStore).toHaveLength(before + 1)
    expect(logStore[logStore.length - 1].action).toBe('POLICY_UPDATED')
  })

  it('updates a fee type and logs the change', async () => {
    const before = logStore.length
    const updated = await updateFeeType(1, { name: 'Phôi khóa bổ sung', defaultAmount: 180_000, active: true }, 'Tester')
    expect(updated.defaultAmount).toBe(180_000)
    expect(logStore).toHaveLength(before + 1)
    expect(logStore[logStore.length - 1].action).toBe('FEE_UPDATED')
  })
})

describe('facility management', () => {
  it('rejects duplicate facility codes', async () => {
    await expect(
      createFacility({ code: 'CS-HN-CG01', name: 'Trùng mã', address: 'X' }, 'Tester'),
    ).rejects.toThrow('đã tồn tại')
  })

  it('creates a facility and can deactivate it without deleting', async () => {
    const before = facilityStore.length
    await createFacility({ code: 'cs-dn-hc99', name: 'Cơ sở Hải Châu', address: '12 Bạch Đằng' }, 'Tester')

    expect(facilityStore).toHaveLength(before + 1)
    const created = facilityStore[facilityStore.length - 1]
    expect(created.code).toBe('CS-DN-HC99')
    expect(created.status).toBe('ACTIVE')

    await setFacilityStatus(created.id, 'INACTIVE', 'Tester')
    expect(facilityStore.find((facility) => facility.id === created.id)?.status).toBe('INACTIVE')
    expect(facilityStore).toHaveLength(before + 1)
  })
})

describe('report summary', () => {
  it('aggregates revenue and operations for the year period', async () => {
    const summary = await getReportSummary({ period: 'year', facilityId: null })

    expect(summary.rows.length).toBeGreaterThanOrEqual(4)
    expect(summary.totalRevenue).toBeGreaterThan(0)
    expect(summary.occupancyRate).toBeGreaterThan(0)
    expect(summary.revenuePoints.length).toBeGreaterThan(0)
  })

  it('scopes the report to a single facility', async () => {
    const summary = await getReportSummary({ period: 'halfYear', facilityId: 1 })
    expect(summary.rows).toHaveLength(1)
    expect(summary.rows[0].facilityId).toBe(1)
  })
})
