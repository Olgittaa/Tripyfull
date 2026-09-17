import { test, expect } from '@playwright/test';

/**
 * Creating a trip and moving its dates — the one place where days, and the
 * stops on them, are deleted. These go straight at the API: the rules are about
 * what survives, and a browser only makes them slower to read.
 */

const API = process.env.API_URL || 'http://localhost:8080';
const PASSWORD = 'E2e-pass-12345';
const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

/** A signed-in client for a fresh account. */
async function signedIn(request) {
  const username = `e2e_dates_${stamp()}`;
  const res = await request.post(`${API}/api/auth/register`, {
    data: { username, password: PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  const { token } = await res.json();
  const headers = { Authorization: `Bearer ${token}` };
  return {
    username,
    token,
    get: (path) => request.get(`${API}${path}`, { headers }),
    post: (path, data) => request.post(`${API}${path}`, { headers, data }),
    patch: (path, data) => request.patch(`${API}${path}`, { headers, data }),
    del: (path) => request.delete(`${API}${path}`, { headers }),
  };
}

const trip = (api, overrides = {}) =>
  api
    .post('/api/trips', {
      title: `Dates ${stamp()}`,
      startDate: '2027-03-10',
      endDate: '2027-03-15',
      baseCurrency: 'EUR',
      status: 'PLANNED',
      ...overrides,
    })
    .then((r) => r.json());

const daysOf = (api, id) => api.get(`/api/trips/${id}/days`).then((r) => r.json());
const dated = (days) => days.filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date));

test('a new trip gets one day per date', async ({ request }) => {
  const api = await signedIn(request);
  const t = await trip(api);
  const days = dated(await daysOf(api, t.id));
  expect(days.map((d) => d.date)).toEqual([
    '2027-03-10',
    '2027-03-11',
    '2027-03-12',
    '2027-03-13',
    '2027-03-14',
    '2027-03-15',
  ]);
});

test('an end before the start is refused in words, wherever it is set', async ({ request }) => {
  const api = await signedIn(request);

  const created = await api.post('/api/trips', {
    title: 'Backwards',
    startDate: '2027-05-10',
    endDate: '2027-05-05',
    baseCurrency: 'EUR',
  });
  expect(created.status()).toBe(400);
  expect((await created.json()).error).toMatch(/end date cannot be before start date/i);

  const t = await trip(api);
  const moved = await api.post(`/api/trips/${t.id}/reschedule`, {
    title: t.title,
    startDate: '2027-03-20',
    endDate: '2027-03-18',
  });
  expect(moved.status()).toBe(400);
  expect((await moved.json()).error).toMatch(/end date cannot be before start date/i);

  const edited = await api.patch(`/api/trips/${t.id}`, { endDate: '2027-03-01' });
  expect(edited.status()).toBe(400);

  // And nothing moved.
  const days = dated(await daysOf(api, t.id));
  expect(days[0].date).toBe('2027-03-10');
  expect(days).toHaveLength(6);
});

test('moving the whole trip keeps every day, its stops and its bookings', async ({ request }) => {
  const api = await signedIn(request);
  const t = await trip(api);
  const days = dated(await daysOf(api, t.id));

  await api.patch(`/api/days/${days[1].id}`, { city: 'Granada', notes: 'the long lunch' });
  await api.post(`/api/days/${days[1].id}/activities`, { name: 'Alhambra', type: 'SIGHTSEEING' });
  await api.post(`/api/trips/${t.id}/days/buffer`); // a reserve day, which has no date at all
  await api.post(`/api/trips/${t.id}/bookings`, {
    name: 'Hotel Alfonso XIII',
    category: 'ACCOMMODATION',
    accommodationCity: 'Seville',
    checkIn: '2027-03-10',
    checkOut: '2027-03-12',
    fullPrice: 420,
    priceCurrency: 'EUR',
  });

  const moved = await api.post(`/api/trips/${t.id}/reschedule`, {
    title: t.title,
    startDate: '2027-03-17',
    endDate: '2027-03-22',
  });
  expect(moved.ok()).toBeTruthy();

  const after = await daysOf(api, t.id);
  const afterDated = dated(after);
  expect(afterDated.map((d) => d.date)).toEqual([
    '2027-03-17',
    '2027-03-18',
    '2027-03-19',
    '2027-03-20',
    '2027-03-21',
    '2027-03-22',
  ]);
  // The second day is still the second day, with what was on it.
  expect(afterDated[1].city).toBe('Granada');
  expect(afterDated[1].notes).toBe('the long lunch');
  const stops = await api.get(`/api/days/${afterDated[1].id}/itinerary`).then((r) => r.json());
  expect(stops.map((s) => s.name)).toContain('Alhambra');
  // The reserve day has no date to shift and outlives the move.
  expect(after.filter((d) => !d.date)).toHaveLength(1);
  // Bookings keep their own dates — they are contracts, not plans.
  const bookings = await api.get(`/api/trips/${t.id}/bookings`).then((r) => r.json());
  expect(bookings[0].checkIn).toBe('2027-03-10');
  expect(bookings[0].checkOut).toBe('2027-03-12');
});

test('a shorter range deletes the days that fall outside, with their stops', async ({
  request,
}) => {
  const api = await signedIn(request);
  const t = await trip(api);
  const days = dated(await daysOf(api, t.id));
  const doomed = days[5]; // the last day
  await api.post(`/api/days/${doomed.id}/activities`, {
    name: 'Farewell dinner',
    type: 'RESTAURANT',
  });
  await api.post(`/api/days/${days[0].id}/activities`, { name: 'Cathedral', type: 'SIGHTSEEING' });

  await api.post(`/api/trips/${t.id}/reschedule`, {
    title: t.title,
    startDate: '2027-03-10',
    endDate: '2027-03-13',
  });

  const after = dated(await daysOf(api, t.id));
  expect(after.map((d) => d.date)).toEqual([
    '2027-03-10',
    '2027-03-11',
    '2027-03-12',
    '2027-03-13',
  ]);
  // The day is gone, and so is the stop that was on it.
  expect(await api.get(`/api/days/${doomed.id}/itinerary`).then((r) => r.status())).toBe(404);
  // The days that stayed kept theirs.
  const kept = await api.get(`/api/days/${after[0].id}/itinerary`).then((r) => r.json());
  expect(kept.map((s) => s.name)).toContain('Cathedral');
});

test('a longer range fills the new dates with empty days', async ({ request }) => {
  const api = await signedIn(request);
  const t = await trip(api);
  await api.post(`/api/trips/${t.id}/reschedule`, {
    title: t.title,
    startDate: '2027-03-10',
    endDate: '2027-03-18',
  });
  const after = dated(await daysOf(api, t.id));
  expect(after).toHaveLength(9);
  expect(after.at(-1).date).toBe('2027-03-18');
  expect(after.at(-1).activityCount ?? 0).toBe(0);
});

test('the preview says what the move will really do', async ({ page, request }) => {
  const api = await signedIn(request);
  const t = await trip(api);
  await api.post(`/api/trips/${t.id}/days/buffer`); // the kind of day a move never touches

  // Sign the browser in as the account the trip belongs to.
  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('username', user);
    },
    [api.token, api.username],
  );
  await page.goto(`/trips/${t.id}`);

  await page.getByRole('button', { name: 'Edit', exact: false }).first().click();
  const drawer = page.locator('.drawer-panel[role="dialog"]');
  await drawer.locator('button.select-trigger:has(.pi-calendar)').click();
  await page.locator('.dp-day[data-date="2027-03-17"]').click();
  await page.locator('.dp-day[data-date="2027-03-22"]').click();
  await drawer.getByRole('button', { name: 'Save' }).click();

  const preview = page.locator('.modal[role="dialog"]').filter({ hasText: 'Move trip dates?' });
  await expect(preview).toBeVisible();
  await expect(preview).toContainText('7 days later');
  // Six days in, six days out: nothing is deleted, and the reserve day is not a
  // day that falls outside anything — it has no date at all.
  await expect(preview).not.toContainText(/will be deleted/);
  await expect(preview).not.toContainText(/will be added/);

  // And shortening the trip does warn, with the right number.
  await preview.getByRole('button', { name: 'Cancel' }).click();
  await drawer.locator('button.select-trigger:has(.pi-calendar)').click();
  await page.locator('.dp-day[data-date="2027-03-17"]').click();
  await page.locator('.dp-day[data-date="2027-03-20"]').click();
  await drawer.getByRole('button', { name: 'Save' }).click();
  await expect(preview).toContainText('2 days');
  await expect(preview).toContainText(/will be deleted/);
});
