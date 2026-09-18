import { test, expect } from '@playwright/test';

/**
 * A reserve day: a day the trip carries without a date, for the weather or for
 * whatever a client changes their mind about. It has to be creatable, visible
 * as something apart, swappable with a real day, removable — and it has to read
 * as an offer, not as day seven, when the book is printed.
 */

const API = process.env.API_URL || 'http://localhost:8080';
const PASSWORD = 'E2e-pass-12345';
const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

async function signedIn(request) {
  const username = `e2e_reserve_${stamp()}`;
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
    del: (p) => request.delete(`${API}${p}`, { headers }),
  };
}

async function tripWithDays(api) {
  const trip = await api
    .post('/api/trips', {
      title: `Reserve ${stamp()}`,
      startDate: '2027-06-01',
      endDate: '2027-06-03',
      baseCurrency: 'EUR',
      status: 'PLANNED',
    })
    .then((r) => r.json());
  const all = await api.get(`/api/trips/${trip.id}/days`).then((r) => r.json());
  return { trip, days: all.filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date)) };
}

const allDays = (api, id) => api.get(`/api/trips/${id}/days`).then((r) => r.json());
const stopsOf = (api, dayId) => api.get(`/api/days/${dayId}/itinerary`).then((r) => r.json());

test('a reserve day joins the trip without a date and without disturbing it', async ({
  request,
}) => {
  const api = await signedIn(request);
  const { trip, days } = await tripWithDays(api);

  const after = await api.post(`/api/trips/${trip.id}/days/buffer`).then((r) => r.json());

  const reserve = after.filter((d) => !d.date);
  expect(reserve).toHaveLength(1);
  expect(reserve[0].isBuffer ?? reserve[0].buffer).toBeTruthy();
  // The dated days are exactly the ones that were there.
  expect(after.filter((d) => d.date).map((d) => d.date)).toEqual(days.map((d) => d.date));
});

test('swapping trades the plans and leaves the dates where they are', async ({ request }) => {
  const api = await signedIn(request);
  const { trip, days } = await tripWithDays(api);
  const reserve = await api
    .post(`/api/trips/${trip.id}/days/buffer`)
    .then((r) => r.json())
    .then((all) => all.find((d) => !d.date));

  await api.patch(`/api/days/${days[1].id}`, { city: 'Seville' });
  await api.post(`/api/days/${days[1].id}/activities`, { name: 'Alcázar', type: 'SIGHTSEEING' });
  await api.patch(`/api/days/${reserve.id}`, { city: 'Córdoba' });
  await api.post(`/api/days/${reserve.id}/activities`, { name: 'Mezquita', type: 'SIGHTSEEING' });

  await api.post(`/api/trips/${trip.id}/days/${days[1].id}/swap/${reserve.id}`);

  // The plans changed places; the dates did not move an inch.
  const after = await allDays(api, trip.id);
  const dated = after.filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date));
  expect(dated.map((d) => d.date)).toEqual(days.map((d) => d.date));
  expect(dated[1].city).toBe('Córdoba');
  expect((await stopsOf(api, days[1].id)).map((s) => s.name)).toEqual(['Mezquita']);
  const stillReserve = after.find((d) => !d.date);
  expect(stillReserve.city).toBe('Seville');
  expect((await stopsOf(api, stillReserve.id)).map((s) => s.name)).toEqual(['Alcázar']);
});

test('only a reserve day can be removed', async ({ request }) => {
  const api = await signedIn(request);
  const { trip, days } = await tripWithDays(api);
  const reserve = await api
    .post(`/api/trips/${trip.id}/days/buffer`)
    .then((r) => r.json())
    .then((all) => all.find((d) => !d.date));

  const dated = await api.del(`/api/days/${days[0].id}`);
  expect(dated.status()).toBe(400);
  expect((await dated.json()).error).toMatch(/dated day cannot be removed/i);

  expect((await api.del(`/api/days/${reserve.id}`)).status()).toBe(204);
  const after = await allDays(api, trip.id);
  expect(after.filter((d) => !d.date)).toHaveLength(0);
  expect(after.filter((d) => d.date)).toHaveLength(3);
});

test('the strip keeps reserve days apart, and the book offers them', async ({ page, request }) => {
  const api = await signedIn(request);
  const { trip, days } = await tripWithDays(api);
  await api.post(`/api/days/${days[0].id}/activities`, {
    name: 'Cathedral',
    type: 'SIGHTSEEING',
    latitude: 37.3861,
    longitude: -5.9925,
  });
  const reserve = await api
    .post(`/api/trips/${trip.id}/days/buffer`)
    .then((r) => r.json())
    .then((all) => all.find((d) => !d.date));
  await api.patch(`/api/days/${reserve.id}`, { city: 'Córdoba' });
  for (const [name, lat, lon] of [
    ['Mezquita', 37.879, -4.7794],
    ['Alcázar de los Reyes', 37.8766, -4.7817],
  ]) {
    await api.post(`/api/days/${reserve.id}/activities`, {
      name,
      type: 'SIGHTSEEING',
      latitude: lat,
      longitude: lon,
    });
  }

  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('username', user);
    },
    [api.token, api.username],
  );

  await page.goto(`/trips/${trip.id}/days/${days[0].id}`);
  // Reserve days sit after a divider, out of the dated run.
  await expect(page.locator('.day-picker-sep')).toHaveCount(1);
  await expect(page.locator('.day-picker-btn--reserve')).toHaveCount(1);
  await expect(page.locator('.day-picker-btn--reserve')).toContainText('reserve');

  await page.goto(`/trips/${trip.id}`);
  const [book] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: /Print/ }).first().click(),
  ]);
  await expect(book.getByText(trip.title).first()).toBeVisible({ timeout: 60_000 });

  const printed = book.locator('body');
  // The cover counts it, and the page says what it is for.
  await expect(printed).toContainText(/1 reserve day/);
  await expect(printed).toContainText('Not on a date — ideas to swap in');
  await expect(printed).toContainText('Mezquita');

  // Its stops are offers: no running number, and no way to the next one.
  const reservePage = book.locator('section.day').filter({ hasText: 'Not on a date' });
  await expect(reservePage.locator('.stop-num')).toHaveCount(0);
  await expect(reservePage.locator('.travel')).toHaveCount(0);
  // A real day still numbers its stops.
  const firstDay = book.locator('section.day').filter({ hasText: 'Cathedral' }).first();
  await expect(firstDay.locator('.stop-num').first()).toHaveText('1');
});
