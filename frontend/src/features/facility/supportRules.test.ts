import { describe, expect, it } from 'vitest'
import { filterTickets, isTicketActive, isTicketTransitionAllowed } from './supportRules'
import type { SupportTicket, TicketFilters } from './types'

function makeTicket(overrides: Partial<SupportTicket> = {}): SupportTicket {
  return {
    id: 1,
    facilityId: 1,
    customerName: 'Khách A',
    rentalId: 1,
    unitCode: '#01',
    category: 'ACCESS',
    title: 'Thẻ từ không mở được cửa',
    description: 'Mô tả',
    status: 'OPEN',
    createdAt: '2026-01-15T08:00:00.000Z',
    resolvedAt: null,
    assignedStaffName: null,
    ...overrides,
  }
}

const BASE_FILTERS: TicketFilters = { facilityId: 1, status: null, search: '' }

describe('isTicketTransitionAllowed', () => {
  it('allows OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED', () => {
    expect(isTicketTransitionAllowed('OPEN', 'IN_PROGRESS').allowed).toBe(true)
    expect(isTicketTransitionAllowed('IN_PROGRESS', 'RESOLVED').allowed).toBe(true)
    expect(isTicketTransitionAllowed('RESOLVED', 'CLOSED').allowed).toBe(true)
  })

  it('blocks invalid moves and reopening closed tickets', () => {
    expect(isTicketTransitionAllowed('IN_PROGRESS', 'CLOSED').allowed).toBe(false)
    expect(isTicketTransitionAllowed('RESOLVED', 'IN_PROGRESS').allowed).toBe(false)
    expect(isTicketTransitionAllowed('CLOSED', 'OPEN').reason).toContain('đã đóng')
    expect(isTicketTransitionAllowed('OPEN', 'RESOLVED').allowed).toBe(false)
  })
})

describe('filterTickets', () => {
  const tickets = [
    makeTicket({ id: 1, status: 'OPEN', createdAt: '2026-01-15T08:00:00.000Z' }),
    makeTicket({ id: 2, status: 'IN_PROGRESS', createdAt: '2026-01-16T08:00:00.000Z' }),
    makeTicket({ id: 3, status: 'CLOSED', title: 'Khác', createdAt: '2026-01-10T08:00:00.000Z' }),
    makeTicket({ id: 4, facilityId: 2, status: 'OPEN' }),
  ]

  it('scopes to facility, filters status and sorts newest first', () => {
    const result = filterTickets(tickets, BASE_FILTERS)
    expect(result.map((ticket) => ticket.id)).toEqual([2, 1, 3])
    expect(filterTickets(tickets, { ...BASE_FILTERS, status: 'OPEN' }).map((ticket) => ticket.id)).toEqual([
      1,
    ])
  })

  it('searches by title and customer', () => {
    expect(filterTickets(tickets, { ...BASE_FILTERS, search: 'thẻ từ' }).map((ticket) => ticket.id)).toEqual([
      2, 1,
    ])
    expect(filterTickets(tickets, { ...BASE_FILTERS, search: 'khách a' })).toHaveLength(3)
  })

  it('detects active tickets', () => {
    expect(isTicketActive(makeTicket({ status: 'OPEN' }))).toBe(true)
    expect(isTicketActive(makeTicket({ status: 'IN_PROGRESS' }))).toBe(true)
    expect(isTicketActive(makeTicket({ status: 'CLOSED' }))).toBe(false)
  })
})
