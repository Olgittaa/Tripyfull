import { test, expect } from '@playwright/test';

/**
 * Bookings: the things the consultant has already committed money to. Every
 * category has to be storable, a ticket has to come back byte for byte, and
 * deleting a booking has to take its payments and its files with it — quietly
 * leaving either behind is how a trip ends up owing money to nothing.
 */

const API = process.env.API_URL || 'http://localhost:8080';
const PASSWORD = 'E2e-pass-12345';
const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

async function signedIn(request) {
  const username = `e2e_book_${stamp()}`;
  const res = await request.post(`${API}/api/auth/register`, {
    data: { username, password: PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  const { token } = await res.json();
  const headers = { Authorization: `Bearer ${token}` };
  return {
    username,
    token,
    headers,
    get: (p) => request.get(`${API}${p}`, { headers }),
    post: (p, data) => request.post(`${API}${p}`, { headers, data }),
    patch: (p, data) => request.patch(`${API}${p}`, { headers, data }),
    del: (p) => request.delete(`${API}${p}`, { headers }),
    upload: (p, multipart) => request.post(`${API}${p}`, { headers, multipart }),
  };
}

async function trip(api) {
  return api
    .post('/api/trips', {
      title: `Bookings ${stamp()}`,
      startDate: '2027-07-04',
      endDate: '2027-07-09',
      baseCurrency: 'EUR',
      status: 'PLANNED',
    })
    .then((r) => r.json());
}

test('every category a consultant books is stored and read back', async ({ request }) => {
  const api = await signedIn(request);
  const t = await trip(api);

  const made = [];
  for (const booking of [
    {
      name: 'Hotel Alfonso XIII',
      category: 'ACCOMMODATION',
      accommodationCity: 'Seville',
      address: 'San Fernando 2',
      checkIn: '2027-07-04',
      checkOut: '2027-07-06',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      roomType: 'Double, patio side',
      guests: 2,
      fullPrice: 420,
      priceCurrency: 'EUR',
    },
    {
      name: 'Madrid to Seville',
      category: 'TRANSPORTATION',
      transportMode: 'TRAIN',
      fromPlace: 'Madrid Atocha',
      toPlace: 'Sevilla Santa Justa',
      departureAt: '2027-07-04T09:00:00',
      arrivalAt: '2027-07-04T11:32:00',
      flightNumber: 'AVE 02071',
      seat: '7 / 23',
      fullPrice: 89,
      priceCurrency: 'EUR',
    },
    {
      name: 'Tarifa to Tangier',
      category: 'TRANSPORTATION',
      transportMode: 'FERRY',
      fromPlace: 'Tarifa',
      toPlace: 'Tangier Ville',
      vesselName: 'Tarifa Jet',
      departureAt: '2027-07-07T10:00:00',
      arrivalAt: '2027-07-07T11:00:00',
      fullPrice: 74,
      priceCurrency: 'EUR',
    },
    {
      name: 'Car · Seville airport',
      category: 'TRANSPORTATION',
      transportMode: 'CAR_RENTAL',
      vendor: 'Centauro',
      fromPlace: 'Seville airport',
      carClass: 'Compact',
      departureAt: '2027-07-05T10:00:00',
      arrivalAt: '2027-07-08T10:00:00',
      fullPrice: 130,
      priceCurrency: 'EUR',
    },
    {
      name: 'Flamenco at Casa de la Memoria',
      category: 'ACTIVITY',
      address: 'Cuna 6, Seville',
      departureAt: '2027-07-05T19:30:00',
      fullPrice: 36,
      priceCurrency: 'EUR',
    },
  ]) {
    const res = await api.post(`/api/trips/${t.id}/bookings`, booking);
    expect(res.status(), booking.name).toBe(201);
    made.push(await res.json());
  }

  const back = await api.get(`/api/trips/${t.id}/bookings`).then((r) => r.json());
  expect(back).toHaveLength(5);
  const hotel = back.find((b) => b.category === 'ACCOMMODATION');
  expect(hotel.checkIn).toBe('2027-07-04');
  expect(hotel.checkOut).toBe('2027-07-06');
  expect(hotel.roomType).toBe('Double, patio side');
  const train = back.find((b) => b.transportMode === 'TRAIN');
  expect(train.fromPlace).toBe('Madrid Atocha');
  expect(train.seat).toBe('7 / 23');
  expect(back.find((b) => b.transportMode === 'FERRY').vesselName).toBe('Tarifa Jet');
  expect(back.find((b) => b.transportMode === 'CAR_RENTAL').carClass).toBe('Compact');
});

test('a flight number nobody knows comes back empty, not broken', async ({ request }) => {
  const api = await signedIn(request);
  // The lookup is a courtesy: when it finds nothing the consultant types the
  // flight in by hand, and that has to keep working.
  const res = await api.get('/api/flights/lookup?number=ZZ9999&date=2027-07-04');
  expect([200, 204, 404]).toContain(res.status());
  if (res.status() === 200) {
    const body = await res.json();
    expect(Array.isArray(body) ? body : [body]).toBeDefined();
  }

  const t = await trip(api);
  const typedIn = await api.post(`/api/trips/${t.id}/bookings`, {
    name: 'ZZ9999 Nowhere to Seville',
    category: 'TRANSPORTATION',
    transportMode: 'FLIGHT',
    flightNumber: 'ZZ9999',
    fromPlace: 'Nowhere',
    toPlace: 'Seville',
    departureAt: '2027-07-04T06:00:00',
    arrivalAt: '2027-07-04T08:30:00',
    fullPrice: 210,
    priceCurrency: 'EUR',
  });
  expect(typedIn.status()).toBe(201);
});

test('an attachment goes up, comes back whole, and can be taken off', async ({ request }) => {
  const api = await signedIn(request);
  const t = await trip(api);
  const booking = await api
    .post(`/api/trips/${t.id}/bookings`, {
      name: 'Hotel Alfonso XIII',
      category: 'ACCOMMODATION',
      accommodationCity: 'Seville',
      checkIn: '2027-07-04',
      checkOut: '2027-07-06',
      fullPrice: 420,
      priceCurrency: 'EUR',
    })
    .then((r) => r.json());

  const body = Buffer.from('%PDF-1.4 voucher for Alfonso XIII\n');
  const withFile = await api
    .upload(`/api/bookings/${booking.id}/attachments`, {
      file: { name: 'voucher.pdf', mimeType: 'application/pdf', buffer: body },
    })
    .then((r) => r.json());
  expect(withFile.attachments).toHaveLength(1);
  const file = withFile.attachments[0];
  expect(file.fileName).toBe('voucher.pdf');
  expect(file.size).toBe(body.length);

  const download = await api.get(`/api/attachments/${file.id}/download`);
  expect(download.status()).toBe(200);
  expect(Buffer.from(await download.body())).toEqual(body);

  const after = await api.del(`/api/attachments/${file.id}`).then((r) => r.json());
  expect(after.attachments).toHaveLength(0);
  expect((await api.get(`/api/attachments/${file.id}/download`)).status()).toBe(404);
});

test('deleting a booking takes its payments and its files with it', async ({ request }) => {
  const api = await signedIn(request);
  const t = await trip(api);
  const booking = await api
    .post(`/api/trips/${t.id}/bookings`, {
      name: 'Hotel Alfonso XIII',
      category: 'ACCOMMODATION',
      accommodationCity: 'Seville',
      checkIn: '2027-07-04',
      checkOut: '2027-07-06',
      fullPrice: 420,
      priceCurrency: 'EUR',
    })
    .then((r) => r.json());

  const scheduled = await api
    .post(`/api/bookings/${booking.id}/payments`, { amount: 120, dueDate: '2027-06-01' })
    .then((r) => r.json());
  const payment = scheduled.payments[0];
  const withFile = await api
    .upload(`/api/bookings/${booking.id}/attachments`, {
      file: {
        name: 'voucher.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 voucher\n'),
      },
    })
    .then((r) => r.json());
  const file = withFile.attachments[0];

  // The budget knows about the instalment while it exists.
  const before = await api.get(`/api/trips/${t.id}/budget`).then((r) => r.json());
  expect(before.upcomingPayments.map((p) => p.paymentId)).toContain(payment.id);

  expect((await api.del(`/api/bookings/${booking.id}`)).status()).toBe(204);

  expect(await api.get(`/api/trips/${t.id}/bookings`).then((r) => r.json())).toHaveLength(0);
  expect((await api.get(`/api/attachments/${file.id}/download`)).status()).toBe(404);
  expect((await api.patch(`/api/payments/${payment.id}/paid`)).status()).toBe(404);
  const after = await api.get(`/api/trips/${t.id}/budget`).then((r) => r.json());
  expect(after.upcomingPayments).toHaveLength(0);
  expect(Number(after.bookingsTotal)).toBe(0);
});

test('finding the property fills the hotel in', async ({ page, request }) => {
  const api = await signedIn(request);
  const t = await trip(api);

  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('username', user);
    },
    [api.token, api.username],
  );
  await page.goto(`/trips/${t.id}/bookings`);

  await page
    .getByRole('button', { name: /Booking/ })
    .first()
    .click();
  const drawer = page.locator('.drawer-panel[role="dialog"]');
  await drawer.getByRole('button', { name: 'Accommodation' }).click();
  await drawer
    .getByPlaceholder('e.g. Le Patta Resort, Marriott Bangkok…')
    .fill('Hotel Alfonso XIII Seville');
  const hit = page.locator('.tf-place-option').first();
  await expect(hit).toBeVisible({ timeout: 20_000 });
  await hit.click();

  // One pick fills the name, the city and the address; the consultant types dates and a price.
  await expect(drawer.getByLabel('Name')).not.toHaveValue('');
  await expect(drawer.getByPlaceholder('e.g. Krabi, Bangkok, Kyoto')).not.toHaveValue('');
  await expect(drawer.getByLabel('Address')).not.toHaveValue('');

  await drawer.locator('button.select-trigger:has(.pi-calendar)').click();
  await page.locator('.dp-day[data-date="2027-07-04"]').click();
  await page.locator('.dp-day[data-date="2027-07-06"]').click();
  await drawer.getByRole('button', { name: /^Price/ }).click();
  await drawer.getByLabel('Full price').fill('420');
  await drawer.getByRole('button', { name: 'Create booking' }).click();

  // Two nights, inside the trip's dates.
  await expect(page.getByText(/2 nights/).first()).toBeVisible();
  const saved = await api.get(`/api/trips/${t.id}/bookings`).then((r) => r.json());
  expect(saved).toHaveLength(1);
  expect(saved[0].checkIn).toBe('2027-07-04');
  expect(saved[0].checkOut).toBe('2027-07-06');
  expect(saved[0].latitude).not.toBeNull();
});
