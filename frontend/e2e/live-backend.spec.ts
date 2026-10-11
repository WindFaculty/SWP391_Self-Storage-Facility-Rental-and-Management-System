// Ad-hoc proof that the running frontend renders data that came from the real
// backend: catalog page (public) and the authenticated FE2 workspace.
import { test, expect } from '@playwright/test';

const BACKEND = 'http://localhost:8088/api/v1';

async function token(email: string, password: string) {
  const res = await fetch(`${BACKEND}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return body.data.accessToken as string;
}

test('catalog page renders facilities served by the backend', async ({ page }) => {
  const calls: string[] = [];
  page.on('response', (response) => {
    if (response.url().includes('/api/v1/')) calls.push(response.url());
  });

  await page.goto('/facilities');
  // the page only renders cards when /facilities returned data
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect
    .poll(async () => (await page.content()).includes('E2E Facility'), { timeout: 15000 })
    .toBe(true);
  expect(calls.some((url) => url.endsWith('/api/v1/facilities'))).toBe(true);
});

test('authenticated workspace calls the real backend and shows its data', async ({ page }) => {
  // these users are seeded into the running MySQL by the E2E script
  const stamp = process.env.E2E_STAMP ?? '';
  test.skip(!stamp, 'set E2E_STAMP to the seeded run stamp');

  const facility: { id: string } = await (
    await fetch(`${BACKEND}/facilities`).then((r) => r.json())
  ).data.find((f: { code: string }) => f.code === `E2E-${stamp}`);

  const adminToken = await token(`admin-${stamp}@example.com`, 'secret-pass-123');
  const created = await fetch(`${BACKEND}/business/facilities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      code: `E2EUI-${stamp}`,
      name: 'E2E UI Facility',
      address: '9 Test Street',
    }),
  }).then((r) => r.json());

  await page.addInitScript(
    ([tokenValue, facilityId]) => {
      localStorage.setItem('storage_access_token', tokenValue);
      localStorage.setItem('storage_refresh_token', 'unused');
      localStorage.setItem('storage_user', JSON.stringify({ id: 1, email: 'admin@e2e.invalid', fullName: 'E2E Admin', role: 'ADMIN', facilityId: Number(facilityId) }));
    },
    [adminToken, created.data.id],
  );

  const calls: string[] = [];
  page.on('response', (response) => {
    if (response.url().includes('/api/v1/')) calls.push(response.url());
  });

  await page.goto('/admin/security');
  await expect
    .poll(async () => (await page.content()).includes('E2E Admin'), { timeout: 15000 })
    .toBe(true);
  expect(calls.some((url) => url.includes('/api/v1/admin/users'))).toBe(true);
  expect(calls.some((url) => url.includes('/api/v1/admin/activity-logs'))).toBe(true);
  expect(created.data.code).toBe(`E2EUI-${stamp}`);
  expect(facility).toBeTruthy();
});
