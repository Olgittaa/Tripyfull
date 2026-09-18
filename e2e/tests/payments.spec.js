import { test, expect } from '@playwright/test';

/**
 * A booking's money: paid in full, or an instalment plan that can never add up
 * to more than the price. Whatever is ticked here is what the budget reports and
 * what the consultant chases, so the arithmetic is checked to the cent.
 */

const API = process.env.API_URL || 'http://localhost:8080';
const PASSWORD = 'E2e-pass-12345';
const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

async function signedIn(request) {
  const username = `e2e_pay_${stamp()}`;
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

async function tripWithHotel(api, price = 420) {
  const trip = await api
    .post('/api/trips', {
      title: `Payments ${stamp()}`,
      startDate: '2027-09-10',
      endDate: '2027-09-14',
      baseCurrency: 'EUR',
      status: 'PLANNED',
    })
    .then((r) => r.json());
  const booking = await api
    .post(`/api/trips/${trip.id}/bookings`, {
      name: 'Hotel Alfonso XIII',
      category: 'ACCOMMODATION',
      accommodationCity: 'Seville',
      checkIn: '2027-09-10',
      checkOut: '2027-09-12',
      fullPrice: price,
      priceCurrency: 'EUR',
    })
    .then((r) => r.json());
  return { trip, booking };
}

const budget = (api, tripId) => api.get(`/api/trips/${tripId}/budget`).then((r) => r.json());

test('the instalments can never add up to more than the price', async ({ request }) => {
  const api = await signedIn(request);
  const { trip, booking } = await tripWithHotel(api, 420);

  await api.post(`/api/bookings/${booking.id}/payments`, { amount: 120, dueDate: '2027-08-01' });
  const full = await api
    .post(`/api/bookings/${booking.id}/payments`, { amount: 300, dueDate: '2027-09-01' })
    .then((r) => r.json());
  expect(full.payments).toHaveLength(2);

  // 120 + 300 is the whole price; one euro more is refused, and the message says
  // both numbers so the consultant can see where the plan went wrong.
  const tooMuch = await api.post(`/api/bookings/${booking.id}/payments`, { amount: 1 });
  expect(tooMuch.status()).toBe(400);
  expect((await tooMuch.json()).error).toMatch(
    /Payment total \(421.*\) would exceed full price \(420/i,
  );

  const after = await api.get(`/api/trips/${trip.id}/bookings`).then((r) => r.json());
  expect(after[0].payments).toHaveLength(2);
});

test('raising one instalment past what is left is refused too', async ({ request }) => {
  const api = await signedIn(request);
  const { booking } = await tripWithHotel(api, 420);
  const first = await api
    .post(`/api/bookings/${booking.id}/payments`, { amount: 120 })
    .then((r) => r.json())
    .then((b) => b.payments[0]);
  await api.post(`/api/bookings/${booking.id}/payments`, { amount: 300 });

  const res = await api.patch(`/api/payments/${first.id}`, { amount: 200 });
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toMatch(/exceed/i);
});

test('ticking an instalment paid moves it out of what is still owed', async ({ request }) => {
  const api = await signedIn(request);
  const { trip, booking } = await tripWithHotel(api, 420);
  const withPlan = await api
    .post(`/api/bookings/${booking.id}/payments`, { amount: 120, dueDate: '2027-08-01' })
    .then((r) => r.json());
  await api.post(`/api/bookings/${booking.id}/payments`, { amount: 300, dueDate: '2027-09-01' });
  const deposit = withPlan.payments[0];

  const before = await budget(api, trip.id);
  expect(Number(before.bookingsTotal)).toBe(420);
  expect(Number(before.bookingsPaid)).toBe(0);
  expect(Number(before.bookingsRemaining)).toBe(420);
  expect(before.upcomingPayments).toHaveLength(2);

  const paid = await api.patch(`/api/payments/${deposit.id}/paid`).then((r) => r.json());
  const settled = paid.payments.find((p) => p.id === deposit.id);
  expect(settled.paid).toBeTruthy();
  expect(settled.paidDate).toBeTruthy(); // the day it was ticked, for the record

  const mid = await budget(api, trip.id);
  expect(Number(mid.bookingsPaid)).toBe(120);
  expect(Number(mid.bookingsRemaining)).toBe(300);
  expect(mid.upcomingPayments).toHaveLength(1);
  expect(Number(mid.upcomingPayments[0].amount)).toBe(300);

  // Un-ticking puts it back, date and all.
  const undone = await api.patch(`/api/payments/${deposit.id}/unpaid`).then((r) => r.json());
  expect(undone.payments.find((p) => p.id === deposit.id).paid).toBeFalsy();
  expect(undone.payments.find((p) => p.id === deposit.id).paidDate).toBeNull();
  const back = await budget(api, trip.id);
  expect(Number(back.bookingsPaid)).toBe(0);
  expect(back.upcomingPayments).toHaveLength(2);
});

test('"paid in full" settles the booking without a plan', async ({ request }) => {
  const api = await signedIn(request);
  const { trip, booking } = await tripWithHotel(api, 420);

  await api.patch(`/api/bookings/${booking.id}`, { paidSimple: true });

  const b = await budget(api, trip.id);
  expect(Number(b.bookingsTotal)).toBe(420);
  expect(Number(b.bookingsPaid)).toBe(420);
  expect(Number(b.bookingsRemaining)).toBe(0);
  expect(b.upcomingPayments).toHaveLength(0);
  expect(b.unscheduled).toHaveLength(0);
});

test('money owed with no date to pay it is listed apart, not lost', async ({ request }) => {
  const api = await signedIn(request);
  const { trip } = await tripWithHotel(api, 420);

  const b = await budget(api, trip.id);
  // Nothing scheduled, nothing ticked: the whole price is owed and says so.
  expect(b.upcomingPayments).toHaveLength(0);
  expect(b.unscheduled).toHaveLength(1);
  expect(Number(b.unscheduled[0].remaining)).toBe(420);
  expect(Number(b.bookingsRemaining)).toBe(420);
});

test('a stay outside the trip is refused with the dates in the message', async ({ request }) => {
  const api = await signedIn(request);
  const trip = await api
    .post('/api/trips', {
      title: `Dates ${stamp()}`,
      startDate: '2027-09-10',
      endDate: '2027-09-14',
      baseCurrency: 'EUR',
    })
    .then((r) => r.json());

  const early = await api.post(`/api/trips/${trip.id}/bookings`, {
    name: 'Too early',
    category: 'ACCOMMODATION',
    accommodationCity: 'Seville',
    checkIn: '2027-09-08',
    checkOut: '2027-09-11',
    fullPrice: 100,
    priceCurrency: 'EUR',
  });
  expect(early.status()).toBe(400);
  expect((await early.json()).error).toMatch(/before trip start/i);

  const late = await api.post(`/api/trips/${trip.id}/bookings`, {
    name: 'Too late',
    category: 'ACCOMMODATION',
    accommodationCity: 'Seville',
    checkIn: '2027-09-13',
    checkOut: '2027-09-17',
    fullPrice: 100,
    priceCurrency: 'EUR',
  });
  expect(late.status()).toBe(400);
  expect((await late.json()).error).toMatch(/after trip end/i);

  // Checking out the morning after the trip ends is a night inside it, and allowed.
  const lastNight = await api.post(`/api/trips/${trip.id}/bookings`, {
    name: 'Last night',
    category: 'ACCOMMODATION',
    accommodationCity: 'Seville',
    checkIn: '2027-09-13',
    checkOut: '2027-09-15',
    fullPrice: 100,
    priceCurrency: 'EUR',
  });
  expect(lastNight.status()).toBe(201);
});
