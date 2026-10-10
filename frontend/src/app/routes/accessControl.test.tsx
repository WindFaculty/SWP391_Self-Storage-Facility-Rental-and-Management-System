// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from '../providers/SessionProvider'
import { WorkspaceLayout } from '../../layouts/WorkspaceLayout'
import type { AuthUser } from '../../features/auth/types'

const auth = vi.hoisted(() => ({ user: null as AuthUser | null, isAuthenticated: false, isLoading: false, logout: vi.fn() }))
vi.mock('../../features/auth/useAuth', () => ({ useAuth: () => auth }))

beforeEach(() => {
  auth.user = null; auth.isAuthenticated = false; auth.isLoading = false
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [{ id: 7, name: 'Test facility', code: 'TEST', address: 'Test', status: 'ACTIVE' }] }), { status: 200 })))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
const renderWorkspace = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={['/workspace']}>
      <Routes>
        <Route path="/workspace" element={<SessionProvider><WorkspaceLayout /></SessionProvider>} />
        <Route path="/auth" element={<h1>Login required</h1>} />
        <Route path="/forbidden" element={<h1>Forbidden</h1>} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>,
)

describe('authenticated workspace session', () => {
  it('requires login and does not default to facility manager', async () => {
    renderWorkspace()
    expect(await screen.findByText('Login required')).toBeTruthy()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('denies customers without fetching operations data', async () => {
    auth.user = { id: 1, email: 'test@example.invalid', fullName: 'Test', role: 'CUSTOMER' }; auth.isAuthenticated = true
    renderWorkspace()
    expect(await screen.findByText('Forbidden')).toBeTruthy()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('shows only the server-authenticated staff menu and removes role switching', async () => {
    auth.user = { id: 2, email: 'test@example.invalid', fullName: 'Test staff', role: 'FACILITY_STAFF', facilityId: 7 }; auth.isAuthenticated = true
    renderWorkspace()
    expect(await screen.findByRole('link', { name: /Công việc tại cơ sở/ })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Quản lý kho lưu trữ/ })).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.getByRole('button', { name: 'Đăng xuất' })).toBeTruthy()
  })
  it('does not invent a facility assignment for an unassigned staff account', async () => {
    auth.user = { id: 2, email: 'test@example.invalid', fullName: 'Test', role: 'FACILITY_STAFF' }; auth.isAuthenticated = true
    renderWorkspace()
    expect(await screen.findByText('Chưa được phân công cơ sở')).toBeTruthy()
  })
  it('shows a retryable error when the facilities API fails', async () => {
    auth.user = { id: 1, email: 'test@example.invalid', fullName: 'Test', role: 'ADMIN' }; auth.isAuthenticated = true
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline')))
    renderWorkspace()
    expect(await screen.findByText('Không tải được cơ sở')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy()
  })
})
