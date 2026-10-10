// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useRoutes } from 'react-router-dom'
import type { UserRole } from '../../features/facility/types'
import { SessionProvider } from '../providers/SessionProvider'
import { appRoutes } from './router'

afterEach(cleanup)

function AppRoutes() {
  return useRoutes(appRoutes)
}

function renderAt(path: string, role: UserRole) {
  return render(
    <SessionProvider initialRole={role}>
      <MemoryRouter
        initialEntries={[path]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppRoutes />
      </MemoryRouter>
    </SessionProvider>,
  )
}

describe('access control by role', () => {
  it('renders the units screen scoped to the assigned facility for the facility manager', async () => {
    renderAt('/facility/units', 'FACILITY_MANAGER')
    expect(await screen.findByRole('heading', { name: /Quản lý kho lưu trữ/ })).toBeTruthy()
    expect(await screen.findByText('Cơ sở Cầu Giấy — Zone B')).toBeTruthy()
  })

  it('blocks the facility staff role from the units screen', async () => {
    renderAt('/facility/units', 'FACILITY_STAFF')
    expect(await screen.findByRole('heading', { name: /Bạn không có quyền truy cập/ })).toBeTruthy()
  })

  it('renders today tasks for facility staff', async () => {
    renderAt('/staff/operations', 'FACILITY_STAFF')
    expect(await screen.findByRole('heading', { name: /Công việc hôm nay/ })).toBeTruthy()
    expect(await screen.findByText('Chưa tiếp nhận')).toBeTruthy()
  })

  it('renders operational reports for the business manager', async () => {
    renderAt('/operations/reports', 'BUSINESS_MANAGER')
    expect(await screen.findByRole('heading', { name: /Báo cáo vận hành toàn mạng/ })).toBeTruthy()
    expect((await screen.findAllByText('Doanh thu thực thu')).length).toBeGreaterThan(0)
  })

  it('renders account management for the admin role', async () => {
    renderAt('/admin/security', 'ADMIN')
    expect(await screen.findByRole('heading', { name: /Quản trị tài khoản & Nhật ký/ })).toBeTruthy()
    expect(await screen.findByText('Tổng tài khoản')).toBeTruthy()
  })

  it('blocks the admin role from facility-scoped screens', async () => {
    renderAt('/facility/dashboard', 'ADMIN')
    expect(await screen.findByRole('heading', { name: /Bạn không có quyền truy cập/ })).toBeTruthy()
  })

  it('keeps the sidebar menu limited to the active role', async () => {
    renderAt('/staff/operations', 'FACILITY_STAFF')
    await screen.findByRole('heading', { name: /Công việc hôm nay/ })
    expect(screen.getByRole('link', { name: /Công việc tại cơ sở/ })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Quản lý kho lưu trữ/ })).toBeNull()
    expect(screen.queryByRole('link', { name: /Báo cáo toàn mạng/ })).toBeNull()
    expect(screen.queryByRole('link', { name: /Quản trị & Bảo mật/ })).toBeNull()
  })

  it('redirects each role to its own home route', async () => {
    renderAt('/', 'BUSINESS_MANAGER')
    expect(await screen.findByRole('heading', { name: /Báo cáo vận hành toàn mạng/ })).toBeTruthy()
  })
})

describe('role flows', () => {
  it('opens a contract drawer and the assignment modal from the rentals screen', async () => {
    const user = userEvent.setup()
    renderAt('/facility/rentals', 'FACILITY_MANAGER')

    const detailButtons = await screen.findAllByRole('button', { name: 'Chi tiết' })
    await user.click(detailButtons[0])

    const drawer = await screen.findByRole('dialog', { name: /Hợp đồng #/ })
    await user.click(within(drawer).getByRole('button', { name: /Phân công công việc/ }))

    expect(await screen.findByRole('dialog', { name: 'Phân công công việc' })).toBeTruthy()
  })

  it('runs the check-in handover flow for a fully paid reserved contract', async () => {
    const user = userEvent.setup()
    renderAt('/staff/operations', 'FACILITY_STAFF')

    const handoverCell = await screen.findByText('Nguyễn Minh Quân')
    const handoverRow = handoverCell.closest('tr')
    expect(handoverRow).toBeTruthy()
    await user.click(within(handoverRow as HTMLElement).getByRole('button', { name: 'Chi tiết' }))

    const drawer = await screen.findByRole('dialog', { name: /Công việc #1/ })
    expect(await within(drawer).findByText('Bàn giao kho & Check-in')).toBeTruthy()
    expect(await within(drawer).findByText(/Đủ điều kiện bàn giao/)).toBeTruthy()

    await user.click(within(drawer).getByRole('button', { name: 'Nhận việc' }))
    expect(
      await within(drawer).findByText('Đã đối chiếu khách thuê và giấy tờ tùy thân'),
    ).toBeTruthy()
  })

  it('blocks handover completion while payment is incomplete', async () => {
    const user = userEvent.setup()
    renderAt('/staff/operations', 'FACILITY_STAFF')

    const unpaidCell = await screen.findByText('Trần Bích Ngọc')
    const unpaidRow = unpaidCell.closest('tr')
    expect(unpaidRow).toBeTruthy()
    await user.click(within(unpaidRow as HTMLElement).getByRole('button', { name: 'Chi tiết' }))

    const drawer = await screen.findByRole('dialog', { name: /Công việc #2/ })
    expect(await within(drawer).findByText(/Chưa thu đủ cọc và phí thuê/)).toBeTruthy()
    await user.click(within(drawer).getByRole('button', { name: 'Nhận việc' }))
    const completeButton = await within(drawer).findByRole('button', { name: /Xác nhận hoàn tất/ })
    expect((completeButton as HTMLButtonElement).disabled).toBe(true)
  })
})
