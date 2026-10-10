import { expect, test } from '@playwright/test'

for (const path of ['/facility/dashboard', '/facility/units', '/facility/rentals', '/staff/operations', '/operations/facilities', '/operations/policies', '/operations/reports', '/admin/security']) {
  test('anonymous access requires real login: ' + path, async ({ page }) => {
    await page.goto(path)
    await expect(page).toHaveURL(/\/auth$/)
    await expect(page.getByRole('heading', { name: 'Chào mừng bạn quay lại' })).toBeVisible()
    await expect(page.locator('#demo-role')).toHaveCount(0)
  })
}
test('login validates empty credentials without a demo fallback', async ({ page }) => {
  await page.goto('/auth')
  await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click()
  await expect(page.getByRole('alert')).toContainText('Email không đúng định dạng.')
  await expect(page).toHaveURL(/\/auth$/)
})
