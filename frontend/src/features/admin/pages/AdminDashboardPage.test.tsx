// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SystemUsageDashboard } from '../types'
import { AdminDashboardPage } from './AdminDashboardPage'

const SAMPLE_DASHBOARD: SystemUsageDashboard = {
  periodDays: 30,
  generatedAt: '2026-11-20T15:30:00Z',
  overview: {
    totalUsers: 18,
    activeUsers: 16,
    disabledUsers: 2,
    newUsersInPeriod: 4,
    activeSessions: 7,
    activeSessionUsers: 5,
    googleLinkedUsers: 3,
    totalEventsInPeriod: 42,
    activeActorsInPeriod: 9,
    uniqueIpsInPeriod: 6,
    activeFacilities: 4,
    totalFacilities: 4,
    occupiedUnits: 12,
    totalUnits: 20,
    occupancyRate: 60.0,
  },
  auth: {
    loginSuccessCount: 31,
    loginFailedCount: 2,
    registrationsCount: 3,
    adminChangesCount: 6,
    loginSuccessRate: 93.9,
  },
  usersByRole: [
    { role: 'CUSTOMER', total: 10, active: 9, disabled: 1, newInPeriod: 3 },
    { role: 'FACILITY_STAFF', total: 3, active: 3, disabled: 0, newInPeriod: 1 },
    { role: 'FACILITY_MANAGER', total: 2, active: 2, disabled: 0, newInPeriod: 0 },
    { role: 'BUSINESS_MANAGER', total: 2, active: 1, disabled: 1, newInPeriod: 0 },
    { role: 'ADMIN', total: 1, active: 1, disabled: 0, newInPeriod: 0 },
  ],
  dailyActivity: [
    {
      date: '2026-11-19',
      label: '19/11',
      totalEvents: 12,
      loginSuccess: 9,
      loginFailed: 1,
      otherEvents: 2,
    },
    {
      date: '2026-11-20',
      label: '20/11',
      totalEvents: 30,
      loginSuccess: 22,
      loginFailed: 1,
      otherEvents: 7,
    },
  ],
  topActions: [
    { action: 'LOGIN_SUCCESS', count: 31 },
    { action: 'USER_CREATED', count: 5 },
    { action: 'LOGIN_FAILED', count: 2 },
  ],
  platform: {
    totalRentals: 24,
    activeRentals: 12,
    reservedRentals: 3,
    pendingPaymentRentals: 1,
    overdueRentals: 2,
    returnRequestedRentals: 1,
    newRentalsInPeriod: 6,
    totalInvoices: 28,
    paidInvoices: 23,
    pendingInvoices: 3,
    paymentAttemptsInPeriod: 10,
    paymentSuccessInPeriod: 9,
    paymentFailedInPeriod: 1,
    paymentSuccessRate: 90.0,
    totalTickets: 9,
    openTickets: 2,
    resolvedTickets: 7,
    ticketsInPeriod: 4,
    totalTasks: 19,
    openTasks: 3,
    completedTasks: 15,
    uploadedImageCount: 8,
    totalImageCount: 12,
    mediaStorageBytes: 2_621_440,
  },
  facilities: [
    {
      facilityId: 1,
      code: 'DEMO-HCM-01',
      name: 'Kho tự quản Gò Vấp',
      status: 'ACTIVE',
      staffCount: 3,
      unitTotal: 10,
      unitOccupied: 7,
      unitMaintenance: 1,
      occupancyRate: 70.0,
      activeRentals: 7,
      overdueRentals: 1,
      openTickets: 2,
    },
  ],
  recentEvents: [
    {
      id: 101,
      actorName: 'Quản trị viên',
      action: 'LOGIN_SUCCESS',
      entityType: 'USER',
      entityId: 2,
      ipAddress: '127.0.0.1',
      createdAt: '2026-11-20T15:25:00Z',
    },
    {
      id: 100,
      actorName: null,
      action: 'LOGIN_FAILED',
      entityType: null,
      entityId: null,
      ipAddress: '10.0.0.5',
      createdAt: '2026-11-20T15:10:00Z',
    },
  ],
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function renderDashboard(initialUrl = '/admin/dashboard') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <AdminDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminDashboardPage', () => {
  it('renders system usage KPIs, role breakdown, platform modules, and recent events without facility breakdown section', async () => {
    const fetchStub = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: SAMPLE_DASHBOARD }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchStub)

    renderDashboard()

    expect(await screen.findByRole('heading', { name: 'Dashboard sử dụng hệ thống' })).toBeTruthy()
    expect(await screen.findByText('93.9%')).toBeTruthy()
    expect(screen.getByText('60%')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Mức độ sử dụng theo cơ sở' })).toBeNull()
    expect(screen.getByText('Quản trị viên')).toBeTruthy()
    expect(screen.getByText('USER #2')).toBeTruthy()
    expect(screen.getByText('10.0.0.5')).toBeTruthy()
    expect(screen.getByText(/2,5 MB/)).toBeTruthy()

    const securityLinks = screen.getAllByRole('link', { name: /Quản trị|Xem toàn bộ/ })
    expect(securityLinks.every((link) => link.getAttribute('href') === '/admin/security')).toBe(true)
    expect(fetchStub).toHaveBeenCalledWith('/api/v1/admin/usage?days=30', expect.any(Object))
  })

  it('refetches with the selected period window when switching tabs', async () => {
    const user = userEvent.setup()
    const fetchStub = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ data: SAMPLE_DASHBOARD }), { status: 200 })),
    )
    vi.stubGlobal('fetch', fetchStub)

    renderDashboard()
    await screen.findByText('93.9%')

    await user.click(screen.getByRole('button', { name: '7 ngày' }))
    expect(fetchStub).toHaveBeenLastCalledWith('/api/v1/admin/usage?days=7', expect.any(Object))
  })

  it('shows a retryable error state when the usage endpoint fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')))

    renderDashboard()

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy()
  })
})
