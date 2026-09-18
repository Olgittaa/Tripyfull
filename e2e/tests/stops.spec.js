import { test, expect } from '@playwright/test';

/**
 * A day's stops: moving one to another day, deleting it, the times and the cost
 * it carries. The rules about what is stored go to the API; what a person has to
 * see — the numbers on the map and a price in someone else's currency — is
 * checked on the screen.
 */

const API = process.env.API_URL || 'http://localhost:8080';
const PASSWORD = 'E2e-pass-12345';
const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

async function signedIn(request) {
  const username = `e2e_stops_${stamp()}`;
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

/** A trip of three days, with the day ids in order. */
async function tripWithDays(api, overrides = {}) {
  const trip = await api
    .post('/api/trips', {
      title: `Stops ${stamp()}`,
      startDate: '2027-04-05',
      endDate: '2027-04-07',
      baseCurrency: 'EUR',
      status: 'PLANNED',
      ...overrides,
    })
    .then((r) => r.json());
  const days = await api
    .get(`/api/trips/${trip.id}/days`)
    .then((r) => r.json())
    .then((d) => d.filter((x) => x.date).sort((a, b) => a.date.localeCompare(b.date)));
  return { trip, days };
}

const stopsOf = (api, dayId) => api.get(`/api/days/${dayId}/itinerary`).then((r) => r.json());

test('a stop moves to another day and lands at the end of it', async ({ request }) => {
  const api = await signedIn(request);
  const { days } = await tripWithDays(api);

  await api.post(`/api/days/${days[0].id}/activities`, { name: 'Cathedral', type: 'SIGHTSEEING' });
  const moving = await api
    .post(`/api/days/${days[0].id}/activities`, {
      name: 'Flamenco in Triana',
      type: 'OTHER',
      startTime: '21:00',
      endTime: '23:00',
      notes: 'book the late show',
    })
    .then((r) => r.json());
  await api.post(`/api/days/${days[1].id}/activities`, { name: 'Alcázar', type: 'SIGHTSEEING' });

  await api.patch(`/api/activities/${moving.id}`, { dayId: days[1].id });

  expect((await stopsOf(api, days[0].id)).map((s) => s.name)).toEqual(['Cathedral']);
  const target = await stopsOf(api, days[1].id);
  expect(target.map((s) => s.name)).toEqual(['Alcázar', 'Flamenco in Triana']);
  // It arrives whole: times and notes travel with it.
  const moved = target[1];
  // The API answers with seconds on the clock; the screens cut them off.
  expect(moved.startTime).toMatch(/^21:00(:00)?$/);
  expect(moved.endTime).toMatch(/^23:00(:00)?$/);
  expect(moved.notes).toBe('book the late show');
});

test('a stop cannot be moved into a different trip', async ({ request }) => {
  const api = await signedIn(request);
  const here = await tripWithDays(api);
  const elsewhere = await tripWithDays(api);
  const stop = await api
    .post(`/api/days/${here.days[0].id}/activities`, { name: 'Cathedral', type: 'SIGHTSEEING' })
    .then((r) => r.json());

  const res = await api.patch(`/api/activities/${stop.id}`, { dayId: elsewhere.days[0].id });
  expect(res.status()).toBe(400);
  expect((await stopsOf(api, here.days[0].id)).map((s) => s.name)).toEqual(['Cathedral']);
  expect(await stopsOf(api, elsewhere.days[0].id)).toHaveLength(0);
});

test('deleting a stop leaves the rest in order', async ({ request }) => {
  const api = await signedIn(request);
  const { days } = await tripWithDays(api);
  const names = ['Cathedral', 'Alcázar', 'Plaza de España'];
  const made = [];
  for (const name of names) {
    made.push(
      await api
        .post(`/api/days/${days[0].id}/activities`, { name, type: 'SIGHTSEEING' })
        .then((r) => r.json()),
    );
  }

  await api.del(`/api/activities/${made[1].id}`);

  expect((await stopsOf(api, days[0].id)).map((s) => s.name)).toEqual([
    'Cathedral',
    'Plaza de España',
  ]);
});

test('drag renumbers the pins, and a price in another currency is converted', async ({
  page,
  request,
}) => {
  const api = await signedIn(request);
  const { trip, days } = await tripWithDays(api);
  // Two pinned stops, so the map numbers them, and one of them costs baht.
  await api.post(`/api/days/${days[0].id}/activities`, {
    name: 'Cathedral',
    type: 'SIGHTSEEING',
    latitude: 37.3861,
    longitude: -5.9925,
  });
  await api.post(`/api/days/${days[0].id}/activities`, {
    name: 'Riverside lunch',
    type: 'MEAL_STOP',
    latitude: 37.3826,
    longitude: -6.0025,
    costEstimate: 400,
    costCurrency: 'THB',
  });

  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('username', user);
    },
    [api.token, api.username],
  );
  await page.goto(`/trips/${trip.id}/days/${days[0].id}`);

  const rows = page.locator('.timeline-row');
  const pinNumber = (row) => row.locator('.onmap-dot');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Cathedral');
  await expect(pinNumber(rows.first())).toHaveText('1');
  await expect(pinNumber(rows.nth(1))).toHaveText('2');

  // 400 baht means nothing to a consultant billing in euros. The first lookup of
  // a pair goes to the rate service over the network (it is cached afterwards),
  // so this one is given room to arrive.
  await expect(rows.nth(1)).toContainText('400 THB');
  await expect(rows.nth(1)).toContainText(/≈\s*\d+\.\d\d EUR/, { timeout: 30_000 });

  // Dragging the second stop to the front makes it the first pin on the map.
  await rows.nth(1).dragTo(rows.first());
  await expect(rows.first()).toContainText('Riverside lunch');
  await expect(pinNumber(rows.first())).toHaveText('1');
  await expect(rows.nth(1)).toContainText('Cathedral');
  await expect(pinNumber(rows.nth(1))).toHaveText('2');

  // The order the map draws is the order the server kept.
  await page.reload();
  await expect(page.locator('.timeline-row').first()).toContainText('Riverside lunch');
  await expect(page.locator('.timeline-row').first().locator('.onmap-dot')).toHaveText('1');
});

test('moving a stop to another day from its editor empties the day it left', async ({
  page,
  request,
}) => {
  const api = await signedIn(request);
  const { trip, days } = await tripWithDays(api);
  await api.post(`/api/days/${days[0].id}/activities`, {
    name: 'Cathedral',
    type: 'SIGHTSEEING',
    latitude: 37.3861,
    longitude: -5.9925,
  });
  await api.post(`/api/days/${days[0].id}/activities`, {
    name: 'Flamenco in Triana',
    type: 'OTHER',
    latitude: 37.3826,
    longitude: -6.0025,
  });

  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('username', user);
    },
    [api.token, api.username],
  );
  await page.goto(`/trips/${trip.id}/days/${days[0].id}`);
  await expect(page.locator('.timeline-row')).toHaveCount(2);

  await page.locator('.timeline-row').filter({ hasText: 'Flamenco' }).click();
  const drawer = page.locator('.drawer-panel[role="dialog"]');
  await drawer.getByRole('button', { name: /Day 1/ }).click();
  await page.getByRole('option', { name: /Day 2/ }).click();
  await drawer.getByRole('button', { name: 'Save' }).click();

  // Gone from here, with the leg it left behind — and the day it went to has it.
  await expect(page.locator('.timeline-row')).toHaveCount(1);
  await expect(page.locator('.timeline-row').first()).toContainText('Cathedral');
  await expect(page.locator('.timeline-leg')).toHaveCount(0);

  await page.goto(`/trips/${trip.id}/days/${days[1].id}`);
  await expect(page.locator('.timeline-row').filter({ hasText: 'Flamenco' })).toHaveCount(1);
});
