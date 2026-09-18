import { test, expect } from '@playwright/test';

/**
 * The account's settings. Only one of them reaches the rest of the app — the
 * currency, which is where a new trip starts — and that one is checked here.
 * The others (language, region, the date and time formats) are stored and read
 * by nobody; that is written down in BUGS.md rather than pretended about.
 */

const API = process.env.API_URL || 'http://localhost:8080';
const PASSWORD = 'E2e-pass-12345';
const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

async function signedIn(request) {
  const username = `e2e_set_${stamp()}`;
  const res = await request.post(`${API}/api/auth/register`, {
    data: { username, password: PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  const { token } = await res.json();
  const headers = { Authorization: `Bearer ${token}` };
  return {
    username,
    token,
    get: (p) => request.get(`${API}${p}`, { headers }),
    post: (p, data) => request.post(`${API}${p}`, { headers, data }),
    patch: (p, data) => request.patch(`${API}${p}`, { headers, data }),
  };
}

async function signIn(page, api) {
  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('username', user);
    },
    [api.token, api.username],
  );
}

test('the settings are saved and read back', async ({ page, request }) => {
  const api = await signedIn(request);
  await signIn(page, api);
  await page.goto('/settings');

  await page.getByRole('button', { name: /EUR/ }).first().click();
  await page.getByRole('option', { name: 'GBP' }).click();
  await page.getByRole('button', { name: /Save/ }).click();

  await expect
    .poll(async () => (await api.get('/api/auth/me').then((r) => r.json())).baseCurrency)
    .toBe('GBP');
  // And the top bar says what the account is set to.
  await expect(page.locator('.topbar-user-cur')).toHaveText('GBP');

  await page.reload();
  await expect(page.locator('.topbar-user-cur')).toHaveText('GBP');
});

test('a new trip starts in the account currency, and can be sold in another', async ({
  page,
  request,
}) => {
  const api = await signedIn(request);
  await api.patch('/api/auth/me', { baseCurrency: 'GBP' });
  await signIn(page, api);

  await page.goto('/trips');
  await page.getByRole('button', { name: 'New trip' }).first().click();
  const dialog = page.getByRole('dialog');
  const title = `Billed in pounds ${stamp()}`;
  await dialog.getByLabel('Title *').fill(title);
  // The currency is already the account's, without being chosen.
  await expect(dialog.getByRole('button', { name: /GBP/ })).toBeVisible();
  await dialog.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  const trips = await api.get('/api/trips').then((r) => r.json());
  const made = trips.find((t) => t.title === title);
  expect(made.baseCurrency).toBe('GBP');

  // A second client, billed in dollars: the trip's own currency is changed on it.
  await page.goto(`/trips/${made.id}`);
  await page.getByRole('button', { name: 'Edit the trip' }).click();
  const drawer = page.locator('.drawer-panel[role="dialog"]');
  await drawer.getByRole('button', { name: /GBP/ }).click();
  await page.getByRole('option', { name: 'USD' }).click();
  await drawer.getByRole('button', { name: 'Save' }).click();

  await expect
    .poll(async () => (await api.get(`/api/trips/${made.id}`).then((r) => r.json())).baseCurrency)
    .toBe('USD');
  // The budget counts in it from here on.
  await page.goto(`/trips/${made.id}/budget`);
  await expect(page.locator('.budget-hero')).toContainText('USD');
});

test('changing the account currency leaves the trips that exist alone', async ({ request }) => {
  const api = await signedIn(request);
  await api.patch('/api/auth/me', { baseCurrency: 'EUR' });
  const trip = await api
    .post('/api/trips', {
      title: `Sold in euros ${stamp()}`,
      startDate: '2027-06-01',
      endDate: '2027-06-03',
      baseCurrency: 'EUR',
    })
    .then((r) => r.json());

  await api.patch('/api/auth/me', { baseCurrency: 'JPY' });

  // The trip was sold in euros and stays sold in euros.
  expect((await api.get(`/api/trips/${trip.id}`).then((r) => r.json())).baseCurrency).toBe('EUR');
  expect((await api.get(`/api/trips/${trip.id}/budget`).then((r) => r.json())).baseCurrency).toBe(
    'EUR',
  );
});
