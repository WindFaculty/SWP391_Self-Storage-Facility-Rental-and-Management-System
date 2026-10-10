import { describe, expect, it } from 'vitest'
import type { ActivityLog } from '../facility/types'
import { canToggleUserStatus, filterLogs, validateUserInput } from './adminRules'
import type { AdminUser } from './types'

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 108,
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le@khoangtho.vn',
    phone: null,
    role: 'FACILITY_MANAGER',
    facilityId: 1,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('validateUserInput', () => {
  it('requires a facility only for facility roles', () => {
    expect(
      validateUserInput(
        { fullName: 'A', email: 'a@x.vn', phone: '', role: 'FACILITY_STAFF', facilityId: 1 },
        [],
        null,
      ),
    ).toEqual({})
    expect(
      validateUserInput(
        { fullName: 'A', email: 'a@x.vn', phone: '', role: 'FACILITY_STAFF', facilityId: null },
        [],
        null,
      ).facilityId,
    ).toBeTruthy()
    expect(
      validateUserInput(
        { fullName: 'A', email: 'a@x.vn', phone: '', role: 'CUSTOMER', facilityId: 2 },
        [],
        null,
      ).facilityId,
    ).toBeTruthy()
  })

  it('rejects invalid and duplicate emails', () => {
    expect(
      validateUserInput(
        { fullName: 'A', email: 'not-an-email', phone: '', role: 'CUSTOMER', facilityId: null },
        [],
        null,
      ).email,
    ).toBeTruthy()
    const errors = validateUserInput(
      { fullName: 'A', email: 'NAM.LE@khoangtho.vn', phone: '', role: 'FACILITY_MANAGER', facilityId: 1 },
      [makeUser()],
      null,
    )
    expect(errors.email).toBeTruthy()
  })
})

describe('canToggleUserStatus', () => {
  const actor = makeUser({ id: 1, role: 'ADMIN', facilityId: null, email: 'admin@x.vn' })

  it('blocks self-disable and disabling the last active admin', () => {
    expect(canToggleUserStatus(actor.id, actor, [actor]).allowed).toBe(false)
    const secondAdmin = makeUser({ id: 2, role: 'ADMIN', facilityId: null, email: 'admin2@x.vn' })
    expect(canToggleUserStatus(actor.id, secondAdmin, [actor, secondAdmin]).allowed).toBe(true)
  })

  it('allows disabling regular users', () => {
    const target = makeUser()
    expect(canToggleUserStatus(actor.id, target, [actor, target]).allowed).toBe(true)
  })
})

describe('filterLogs', () => {
  const logs: ActivityLog[] = [
    {
      id: 1,
      actorName: 'Lê Phương Mai',
      action: 'POLICY_UPDATED',
      entityType: 'business_policies',
      entityId: 1,
      detail: 'Cập nhật chính sách',
      ipAddress: '1.1.1.1',
      createdAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 2,
      actorName: 'system_worker',
      action: 'AUTO_OVERDUE_CHECK',
      entityType: 'rentals',
      entityId: 8,
      detail: 'Quét quá hạn',
      ipAddress: '127.0.0.1',
      createdAt: '2026-01-16T09:00:00.000Z',
    },
  ]

  it('filters by action and search text, newest first', () => {
    expect(filterLogs(logs, { action: 'POLICY_UPDATED', search: '' }).map((log) => log.id)).toEqual([1])
    expect(filterLogs(logs, { action: null, search: 'quá hạn' }).map((log) => log.id)).toEqual([2])
    expect(filterLogs(logs, { action: null, search: '' }).map((log) => log.id)).toEqual([2, 1])
  })
})
