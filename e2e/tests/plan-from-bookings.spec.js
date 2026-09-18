import { test, expect } from '@playwright/test';

/**
 * "Update plan" writes the bookings into the days. It is the one action that
 * edits the itinerary on the consultant's behalf, so what it may and may not
 * touch has to be exact: its own stops are rewritten every time, hand-made ones
 * are never touched, and pressing it twice changes nothing.
 */

const API = process.env.API_URL || 'http://localhost:8080';
const PASSWORD = 'E2e-pass-12345';
const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

async function signedIn(request) {
  const username = `e2e_sync_${stamp()}`;
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

/** A trip over 2027-08-02 … 2027-08-06, with the dated days in order. */
async function trip(api) {
  const t = await api
    .post('/api/trips', {
      title: `Sync ${stamp()}`,
      startDate: '2027-08-02',
      endDate: '2027-08-06',
      baseCurrency: 'EUR',
      status: 'PLANNED',
    })
    .then((r) => r.json());
  const days = await api
    .get(`/api/trips/${t.id}/days`)
    .then((r) => r.json())
    .then((all) => all.filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date)));
  return { trip: t, days };
}

const sync = (api, tripId) =>
  api.post(`/api/trips/${tripId}/plan/from-bookings`).then((r) => r.json());
const stopsOf = (api, dayId) => api.get(`/api/days/${dayId}/itinerary`).then((r) => r.json());
const namesOn = async (api, dayId) => (await stopsOf(api, dayId)).map((s) => s.name);

const hotel = (nights = 3) => ({
  name: 'Hotel Alfonso XIII',
  category: 'ACCOMMODATION',
  accommodationCity: 'Seville',
  checkIn: '2027-08-02',
  checkOut: nights === 3 ? '2027-08-05' : '2027-08-04',
  fullPrice: 600,
  priceCurrency: 'EUR',
});

test('a three-night stay marks four days: in, two overnights, out', async ({ request }) => {
  const api = await signedIn(request);
  const { trip: t, days } = await trip(api);
  await api.post(`/api/trips/${t.id}/bookings`, hotel(3));

  const result = await sync(api, t.id);
  expect(result.days).toBe(4);

  // Arrival night ends at the hotel; a day in the middle both starts and ends
  // there; the last morning starts there and the stay is over.
  expect(await namesOn(api, days[0].id)).toEqual(['Check in · Hotel Alfonso XIII']);
  expect(await namesOn(api, days[1].id)).toEqual([
    'Hotel Alfonso XIII',
    'Overnight · Hotel Alfonso XIII',
  ]);
  expect(await namesOn(api, days[2].id)).toEqual([
    'Hotel Alfonso XIII',
    'Overnight · Hotel Alfonso XIII',
  ]);
  expect(await namesOn(api, days[3].id)).toEqual(['Check out · Hotel Alfonso XIII']);
  // The day after check-out belongs to nobody.
  expect(await namesOn(api, days[4].id)).toEqual([]);
  // The night is written on the day itself, not only on the stop.
  const after = await api.get(`/api/trips/${t.id}/days`).then((r) => r.json());
  expect(after.find((d) => d.date === '2027-08-02').overnightStay).toBe('Hotel Alfonso XIII');
});

test('running it twice changes nothing', async ({ request }) => {
  const api = await signedIn(request);
  const { trip: t, days } = await trip(api);
  await api.post(`/api/trips/${t.id}/bookings`, hotel(3));

  const first = await sync(api, t.id);
  const afterFirst = await Promise.all(days.map((d) => namesOn(api, d.id)));
  const second = await sync(api, t.id);
  const afterSecond = await Promise.all(days.map((d) => namesOn(api, d.id)));

  expect(second.total).toBe(first.total);
  expect(afterSecond).toEqual(afterFirst);
  // The second run rewrote exactly what the first one wrote — no leftovers.
  expect(second.removed).toBe(first.created);
});

test('a hand-made stop between two generated ones is left alone', async ({ request }) => {
  const api = await signedIn(request);
  const { trip: t, days } = await trip(api);
  await api.post(`/api/trips/${t.id}/bookings`, hotel(3));
  await api.post(`/api/trips/${t.id}/bookings`, {
    name: 'Flamenco at Casa de la Memoria',
    category: 'ACTIVITY',
    address: 'Cuna 6',
    departureAt: '2027-08-02T19:30:00',
    fullPrice: 36,
    priceCurrency: 'EUR',
  });
  await sync(api, t.id);

  const mine = await api
    .post(`/api/days/${days[0].id}/activities`, {
      name: 'Tapas on Calle Betis',
      type: 'MEAL_STOP',
      startTime: '17:00',
      notes: 'the one with the terrace',
      costEstimate: 45,
      costCurrency: 'EUR',
    })
    .then((r) => r.json());

  await sync(api, t.id);

  const after = await stopsOf(api, days[0].id);
  const kept = after.find((s) => s.id === mine.id);
  expect(kept, 'the hand-made stop survived the sync').toBeTruthy();
  expect(kept.name).toBe('Tapas on Calle Betis');
  expect(kept.notes).toBe('the one with the terrace');
  expect(kept.startTime).toMatch(/^17:00/);
  expect(Number(kept.costEstimate)).toBe(45);
  expect(kept.fromBooking).toBeFalsy();
  // It keeps its place in the day by its time: after the 19:30 show it is not.
  const names = after.map((s) => s.name);
  expect(names.indexOf('Tapas on Calle Betis')).toBeLessThan(
    names.indexOf('Flamenco at Casa de la Memoria'),
  );
});

test('a booking that is gone leaves no stops behind', async ({ request }) => {
  const api = await signedIn(request);
  const { trip: t, days } = await trip(api);
  const stay = await api.post(`/api/trips/${t.id}/bookings`, hotel(3)).then((r) => r.json());
  await api.post(`/api/trips/${t.id}/bookings`, {
    name: 'Flamenco at Casa de la Memoria',
    category: 'ACTIVITY',
    departureAt: '2027-08-02T19:30:00',
    fullPrice: 36,
    priceCurrency: 'EUR',
  });
  await sync(api, t.id);
  expect(await namesOn(api, days[0].id)).toHaveLength(2);

  await api.del(`/api/bookings/${stay.id}`);

  // Nothing on any day still claims to come from the booking that was cancelled.
  for (const d of days) {
    const names = await namesOn(api, d.id);
    expect(names.filter((n) => n.includes('Alfonso XIII'))).toHaveLength(0);
  }
  // And the show, which was not cancelled, is still there.
  expect(await namesOn(api, days[0].id)).toContain('Flamenco at Casa de la Memoria');
});

test('an overnight journey arrives the next morning', async ({ request }) => {
  const api = await signedIn(request);
  const { trip: t, days } = await trip(api);
  await api.post(`/api/trips/${t.id}/bookings`, {
    name: 'Night train to Seville',
    category: 'TRANSPORTATION',
    transportMode: 'TRAIN',
    fromPlace: 'Paris Austerlitz',
    toPlace: 'Sevilla Santa Justa',
    departureAt: '2027-08-02T21:40:00',
    arrivalAt: '2027-08-03T08:15:00',
    fullPrice: 160,
    priceCurrency: 'EUR',
  });

  await sync(api, t.id);

  expect(await namesOn(api, days[0].id)).toEqual(['Night train to Seville']);
  const nextMorning = await stopsOf(api, days[1].id);
  expect(nextMorning.map((s) => s.name)).toEqual(['Arrive · Sevilla Santa Justa']);
  expect(nextMorning[0].startTime).toMatch(/^08:15/);
});
