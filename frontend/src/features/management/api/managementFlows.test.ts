import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFacility, getReportSummary, setFacilityStatus, updateBusinessPolicy } from './managementApi'
import { updateUser } from '../../admin/api/adminApi'

afterEach(() => vi.unstubAllGlobals())
const respond = (data: unknown, status = 200) => {
  const fetchStub = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ data, message: 'Backend rejected request' }), { status })))
  vi.stubGlobal('fetch', fetchStub)
  return fetchStub
}

describe('management HTTP integration', () => {
  it('does not generate revenue when the server returns an empty report', async () => {
    const report = { totalRevenue: 0, occupancyRate: 0, activeRentals: 0, overdueRentals: 0, revenuePoints: [], rows: [] }
    const fetchStub = respond(report)
    expect(await getReportSummary({ period: 'year', facilityId: null })).toEqual(report)
    expect(fetchStub.mock.calls[0][0]).toBe('/api/v1/management/reports?period=year')
  })
  it('creates and changes facility status using server endpoints', async () => {
    const fetchStub = respond(null)
    await createFacility({ code: 'TEST', name: 'Test', address: 'Test' })
    await setFacilityStatus(7, 'INACTIVE')
    expect(fetchStub.mock.calls.map(call => call[0])).toEqual(['/api/v1/management/facilities', '/api/v1/management/facilities/7/status'])
    expect(fetchStub.mock.calls[1][1].method).toBe('PATCH')
  })
  it('sends policy values without a fabricated audit actor or IP', async () => {
    const policy = { depositPercent: 50, renewalNoticeDays: 7, returnNoticeDays: 3, overdueGraceDays: 3, overdueFeePerDay: 0, cancellationFee: 0, maxDiscountPercent: 10 }
    const fetchStub = respond(policy)
    await updateBusinessPolicy(policy)
    expect(JSON.parse(fetchStub.mock.calls[0][1].body)).toEqual(policy)
  })
  it('propagates backend protection of the last administrator', async () => {
    respond(null, 409)
    await expect(updateUser(1, { fullName: 'Test', email: 'test@example.invalid', phone: '', role: 'CUSTOMER', facilityId: null })).rejects.toThrow('Backend rejected request')
  })
})
