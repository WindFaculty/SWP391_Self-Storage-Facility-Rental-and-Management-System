import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../../api/client'
import { listUnits } from './facilityUnitsApi'
import { completeHandover, completeReturn, completeUnitInspection } from './rentalOpsApi'
import { assignTicket } from './supportTicketsApi'

afterEach(() => { apiClient.clearTokens(); vi.unstubAllGlobals() })
const response = (data: unknown) => {
  const fetchStub = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data }), { status: 200 }))
  vi.stubGlobal('fetch', fetchStub)
  return fetchStub
}

describe('operations HTTP integration', () => {
  it('sends filters and bearer token without synthesizing units', async () => {
    const fetchStub = response({ items: [], summary: { total: 0, byStatus: {} } })
    apiClient.setToken('test-token')
    const result = await listUnits({ facilityId: 7, search: 'A & B', unitTypeId: null, status: null, priceBand: null })
    expect(result.items).toEqual([])
    expect(fetchStub.mock.calls[0][0]).toBe('/api/v1/ops/units?facilityId=7&search=A+%26+B')
    expect(fetchStub.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer test-token')
  })
  it.each([
    ['handover', () => completeHandover(7, { accessMethod: 'KEY', handoverCondition: 'Test condition' }), { accessMethod: 'KEY', handoverCondition: 'Test condition' }],
    ['return', () => completeReturn(7, { condition: 'Test return' }), { condition: 'Test return' }],
    ['inspection', () => completeUnitInspection(7, { result: 'PASS', notes: 'Test inspection' }), { result: 'PASS', notes: 'Test inspection' }],
  ] as const)('delegates %s atomically to the backend', async (action, run, body) => {
    const fetchStub = response({ task: { id: 7 }, rental: { id: 9 } })
    await run()
    expect(fetchStub).toHaveBeenCalledTimes(1)
    expect(fetchStub.mock.calls[0][0]).toBe('/api/v1/ops/tasks/7/' + action)
    expect(JSON.parse(fetchStub.mock.calls[0][1].body)).toEqual(body)
  })
  it('claims a ticket using the supplied authenticated staff ID', async () => {
    const fetchStub = response({ ticket: { id: 3 }, task: { id: 4 } })
    await assignTicket({ ticketId: 3, facilityId: 7, staffId: 215, scheduledAt: '2026-10-10T08:00:00Z' })
    expect(fetchStub.mock.calls[0][0]).toBe('/api/v1/ops/tickets/3/assign')
    expect(JSON.parse(fetchStub.mock.calls[0][1].body).staffId).toBe(215)
  })
  it('propagates server rejection instead of locally reporting success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Payment required' }), { status: 409 })))
    await expect(completeHandover(7, { accessMethod: 'KEY', handoverCondition: 'Test' })).rejects.toThrow('Payment required')
  })
})
