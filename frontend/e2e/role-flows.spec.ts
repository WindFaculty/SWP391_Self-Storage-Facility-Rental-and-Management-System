import { expect, test } from '@playwright/test'

test('facility manager sees the dashboard and only manager menu items', async ({ page }) => {
  await page.goto('/facility/dashboard')
  await expect(page.getByRole('heading', { name: /Tổng quan cơ sở/ })).toBeVisible()

  const sidebar = page.getByRole('complementary')
  await expect(sidebar.getByRole('link', { name: /Quản lý kho lưu trữ/ })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: /Báo cáo toàn mạng/ })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: /Quản trị & Bảo mật/ })).toHaveCount(0)
})

test('role switch updates the menu, guards and home route', async ({ page }) => {
  await page.goto('/facility/dashboard')
  await expect(page.getByRole('heading', { name: /Tổng quan cơ sở/ })).toBeVisible()

  const sidebar = page.getByRole('complementary')

  await page.getByLabel(/Vai trò \(demo/).selectOption('BUSINESS_MANAGER')
  await expect(page.getByRole('heading', { name: /Bạn không có quyền truy cập/ })).toBeVisible()

  await sidebar.getByRole('link', { name: /Báo cáo toàn mạng/ }).click()
  await expect(page.getByRole('heading', { name: /Báo cáo vận hành toàn mạng/ })).toBeVisible()

  await page.getByLabel(/Vai trò \(demo/).selectOption('ADMIN')
  await expect(page.getByRole('heading', { name: /Bạn không có quyền truy cập/ })).toBeVisible()
  await sidebar.getByRole('link', { name: /Quản trị & Bảo mật/ }).click()
  await expect(page.getByRole('heading', { name: /Quản trị tài khoản & Nhật ký/ })).toBeVisible()
  await expect(page.getByText('Tổng tài khoản')).toBeVisible()
})

test('staff runs the check-in handover flow for a paid contract', async ({ page }) => {
  await page.goto('/facility/dashboard')
  await page.getByLabel(/Vai trò \(demo/).selectOption('FACILITY_STAFF')
  await page.getByRole('complementary').getByRole('link', { name: /Công việc tại cơ sở/ }).click()
  await expect(page.getByRole('heading', { name: /Công việc hôm nay/ })).toBeVisible()

  const handoverRow = page.getByRole('row').filter({ hasText: 'Nguyễn Minh Quân' })
  await handoverRow.getByRole('button', { name: 'Chi tiết' }).click()

  const drawer = page.getByRole('dialog', { name: /Công việc #1/ })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByText(/Đủ điều kiện bàn giao/)).toBeVisible()

  await drawer.getByRole('button', { name: 'Nhận việc' }).click()
  await expect(drawer.getByText('Đã đối chiếu khách thuê và giấy tờ tùy thân')).toBeVisible()
  await expect(drawer.getByRole('button', { name: /Xác nhận hoàn tất/ })).toBeDisabled()
})

test('handover is blocked when payment is incomplete', async ({ page }) => {
  await page.goto('/facility/dashboard')
  await page.getByLabel(/Vai trò \(demo/).selectOption('FACILITY_STAFF')
  await page.getByRole('complementary').getByRole('link', { name: /Công việc tại cơ sở/ }).click()

  const unpaidRow = page.getByRole('row').filter({ hasText: 'Trần Bích Ngọc' })
  await unpaidRow.getByRole('button', { name: 'Chi tiết' }).click()

  const drawer = page.getByRole('dialog', { name: /Công việc #2/ })
  await expect(drawer.getByText(/Chưa thu đủ cọc và phí thuê/)).toBeVisible()
  await drawer.getByRole('button', { name: 'Nhận việc' }).click()
  await expect(drawer.getByRole('button', { name: /Xác nhận hoàn tất/ })).toBeDisabled()
})
