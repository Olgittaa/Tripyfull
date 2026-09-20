import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

/**
 * A trip as one file, and back. What matters is that nothing is left behind:
 * the file made by Export has to come back through Import as the same trip —
 * days and reserve day, stops in their order still pointing at their place,
 * the booking with both instalments and its ticket, the to-do, the folder, the
 * photo — and it has to do so in an account that has never seen any of it.
 */

const API = process.env.API_URL || 'http://localhost:8080';
const PASSWORD = 'E2e-pass-12345';
const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

async function signedIn(request) {
  const username = `e2e_file_${stamp()}`;
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
    put: (p) => request.put(`${API}${p}`, { headers }),
    patch: (p, data) => request.patch(`${API}${p}`, { headers, data }),
    upload: (p, multipart) => request.post(`${API}${p}`, { headers, multipart }),
  };
}

/** A solid-colour PNG, written by hand so the test needs no image library. */
function png(size = 64) {
  const crc32 = (buf) => {
    let crc = ~0;
    for (const b of buf) {
      crc ^= b;
      for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
    return ~crc >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(size * 3, 0x66)]);
  const raw = Buffer.concat(Array(size).fill(row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const VOUCHER = Buffer.from(`%PDF-1.4\n% a voucher, ${'x'.repeat(2000)}\n%%EOF`);

/**
 * The seeded consultant's trip in miniature: three days and a reserve day, a
 * library place with one of our own photos, two stops on day one (one on the
 * place), a hotel with two instalments (one paid) and a ticket, a to-do, a folder.
 */
async function richTrip(api) {
  const trip = await api
    .post('/api/trips', {
      title: `Andalusia ${stamp()}`,
      destination: 'Seville',
      startDate: '2027-05-03',
      endDate: '2027-05-05',
      baseCurrency: 'CHF',
      status: 'PLANNED',
    })
    .then((r) => r.json());
  const days = await api
    .get(`/api/trips/${trip.id}/days`)
    .then((r) => r.json())
    .then((all) => all.filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date)));
  const spare = await api
    .post(`/api/trips/${trip.id}/days/buffer`)
    .then((r) => r.json())
    .then((all) => all.find((d) => !d.date));

  const place = await api
    .post('/api/places', {
      name: 'Real Alcázar',
      type: 'SIGHTSEEING',
      city: 'Seville',
      country: 'ES',
      latitude: 37.3831,
      longitude: -5.9902,
      rating: 5,
      ratingComment: 'Book the first slot',
    })
    .then((r) => r.json());
  // Creating a place asks Google for pictures; this test wants exactly one photo, ours.
  await api.patch(`/api/places/${place.id}`, { photos: [] });
  const withPhoto = await api
    .upload(`/api/places/${place.id}/photos`, {
      file: { name: 'alcazar.png', mimeType: 'image/png', buffer: png() },
    })
    .then((r) => r.json());
  expect(withPhoto.photos).toHaveLength(1);
  expect(withPhoto.photos[0]).toMatch(/^\/api\/place-photos\//);

  const folder = await api
    .post('/api/folders', { name: 'Must see', color: '#0e5c55', tripId: trip.id })
    .then((r) => r.json());
  await api.put(`/api/folders/${folder.id}/places/${place.id}`);

  await api.post(`/api/days/${days[0].id}/activities`, {
    name: 'Real Alcázar',
    type: 'SIGHTSEEING',
    placeId: place.id,
    startTime: '09:30',
  });
  await api.post(`/api/days/${days[0].id}/activities`, {
    name: 'Lunch at Eslava',
    type: 'MEAL_STOP',
    latitude: 37.3925,
    longitude: -5.9955,
    costEstimate: 25,
    costCurrency: 'EUR',
  });
  await api.post(`/api/days/${days[1].id}/activities`, {
    name: 'Triana walk',
    type: 'NEIGHBORHOOD',
    latitude: 37.385,
    longitude: -6.003,
  });
  await api.post(`/api/days/${spare.id}/activities`, { name: 'Italica', type: 'SIGHTSEEING' });

  const hotel = await api
    .post(`/api/trips/${trip.id}/bookings`, {
      name: 'Hotel Alfonso XIII',
      category: 'ACCOMMODATION',
      accommodationCity: 'Seville',
      address: 'San Fernando 2',
      checkIn: '2027-05-03',
      checkOut: '2027-05-05',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      fullPrice: 420,
      priceCurrency: 'EUR',
    })
    .then((r) => r.json());
  const first = await api
    .post(`/api/bookings/${hotel.id}/payments`, { amount: 120, dueDate: '2027-01-10' })
    .then((r) => r.json());
  const paidId = (first.payments || [first]).find((p) => Number(p.amount) === 120).id;
  await api.patch(`/api/payments/${paidId}/paid`);
  await api.post(`/api/bookings/${hotel.id}/payments`, { amount: 300, dueDate: '2027-04-20' });
  await api.upload(`/api/bookings/${hotel.id}/attachments`, {
    file: { name: 'voucher.pdf', mimeType: 'application/pdf', buffer: VOUCHER },
  });

  await api.post(`/api/trips/${trip.id}/todos`, {
    title: 'Book Alcázar tickets',
    groupName: 'Before we go',
    dueDate: '2027-04-01',
  });

  return { trip, place };
}

/** Everything the test checks about an imported trip, wherever it landed. */
async function expectSameTrip(api, original, importedId) {
  const trip = await api.get(`/api/trips/${importedId}`).then((r) => r.json());
  expect(trip.id).not.toBe(original.id);
  expect(trip.title).toBe(original.title);
  expect(trip.baseCurrency).toBe('CHF');
  expect(trip.status).toBe('PLANNED');
  expect(trip.startDate).toBe('2027-05-03');

  const days = await api.get(`/api/trips/${importedId}/days`).then((r) => r.json());
  expect(days.filter((d) => d.date)).toHaveLength(3);
  expect(
    days.filter((d) => !d.date),
    'the reserve day came too',
  ).toHaveLength(1);
  const dated = days.filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date));
  const day1 = await api.get(`/api/days/${dated[0].id}/itinerary`).then((r) => r.json());
  expect(day1.map((a) => a.name)).toEqual(['Real Alcázar', 'Lunch at Eslava']);
  expect(day1[0].placeId, 'the stop still points at a place').toBeTruthy();
  expect(day1[0].startTime).toMatch(/^09:30/);
  expect(Number(day1[1].costEstimate)).toBe(25);
  const spareDay = await api
    .get(`/api/days/${days.find((d) => !d.date).id}/itinerary`)
    .then((r) => r.json());
  expect(spareDay.map((a) => a.name)).toEqual(['Italica']);

  // The place behind the stop — in this account's library — with our photo still served
  const library = await api.get('/api/places').then((r) => r.json());
  const place = library.find((p) => p.id === day1[0].placeId);
  expect(place, 'the stop points at a place of this library').toBeTruthy();
  expect(place.name).toBe('Real Alcázar');
  expect(place.rating).toBe(5);
  const own = place.photos.filter((u) => u.startsWith('/api/place-photos/'));
  expect(own, 'our own photo travelled with the trip').toHaveLength(1);
  const served = await api.get(own[0]);
  expect(served.status()).toBe(200);
  expect((await served.body()).length).toBeGreaterThan(100);

  const folders = await api.get(`/api/folders?tripId=${importedId}`).then((r) => r.json());
  expect(folders.map((f) => f.name)).toEqual(['Must see']);
  expect(folders[0].placeCount).toBe(1);

  const bookings = await api.get(`/api/trips/${importedId}/bookings`).then((r) => r.json());
  expect(bookings).toHaveLength(1);
  const hotel = bookings[0];
  expect(hotel.name).toBe('Hotel Alfonso XIII');
  expect(hotel.checkIn).toBe('2027-05-03');
  expect(hotel.checkInTime).toMatch(/^15:00/);
  expect(Number(hotel.fullPrice)).toBe(420);
  const payments = [...hotel.payments].sort((a, b) => Number(a.amount) - Number(b.amount));
  expect(payments.map((p) => Number(p.amount))).toEqual([120, 300]);
  expect(payments.map((p) => p.paid)).toEqual([true, false]);
  expect(hotel.attachments).toHaveLength(1);
  expect(hotel.attachments[0].fileName).toBe('voucher.pdf');
  const download = await api.get(`/api/attachments/${hotel.attachments[0].id}/download`);
  expect(download.status()).toBe(200);
  expect(
    Buffer.from(await download.body()).equals(VOUCHER),
    'the ticket is byte for byte the same',
  ).toBe(true);

  const todos = await api.get(`/api/trips/${importedId}/todos`).then((r) => r.json());
  expect(todos.map((t) => t.title)).toEqual(['Book Alcázar tickets']);
  expect(todos[0].groupName).toBe('Before we go');
}

test('Export downloads the trip, Import brings it back as a new trip', async ({
  page,
  request,
}) => {
  const api = await signedIn(request);
  const { trip } = await richTrip(api);

  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('username', user);
    },
    [api.token, api.username],
  );
  await page.goto(`/trips/${trip.id}`);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Export/ }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(`${trip.title}.tripyfull.zip`);
  const bytes = readFileSync(await download.path());
  expect(bytes.subarray(0, 2).toString(), 'a zip archive').toBe('PK');
  expect(bytes.length).toBeGreaterThan(2000);

  await page.goto('/trips');
  await page.getByTestId('trip-file').setInputFiles({
    name: 'andalusia.tripyfull.zip',
    mimeType: 'application/zip',
    buffer: bytes,
  });
  await expect(page.getByText('Imported')).toBeVisible();
  await expect(page).toHaveURL(/\/trips\/[0-9a-f-]{36}$/);
  const importedId = page.url().split('/').pop();
  expect(importedId).not.toBe(trip.id);
  await expect(page.getByRole('heading', { name: trip.title }).first()).toBeVisible();

  await expectSameTrip(api, trip, importedId);
});

test('the file opens in an account that has never seen any of it', async ({ request }) => {
  const api = await signedIn(request);
  const { trip } = await richTrip(api);
  const file = await api.get(`/api/trips/${trip.id}/file`);
  expect(file.status()).toBe(200);
  expect(file.headers()['content-type']).toContain('application/zip');
  const bytes = await file.body();

  const other = await signedIn(request);
  expect(await other.get('/api/places').then((r) => r.json())).toHaveLength(0);
  const imported = await other.upload('/api/trips/import', {
    file: { name: 'andalusia.tripyfull.zip', mimeType: 'application/zip', buffer: bytes },
  });
  expect(imported.status()).toBe(201);
  const landed = await imported.json();

  await expectSameTrip(other, trip, landed.id);
  // Its library now holds exactly the one place the trip brought, and nothing else.
  const library = await other.get('/api/places').then((r) => r.json());
  expect(library.map((p) => p.name)).toEqual(['Real Alcázar']);
  // And the original account still has its own trip, untouched.
  expect((await api.get(`/api/trips/${trip.id}`)).status()).toBe(200);
});

test('a file that is not ours is refused in words', async ({ request }) => {
  const api = await signedIn(request);
  const res = await api.upload('/api/trips/import', {
    file: {
      name: 'holiday.zip',
      mimeType: 'application/zip',
      buffer: Buffer.from('not a zip at all'),
    },
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toContain('Not a Tripyfull trip file');
  expect(await api.get('/api/trips').then((r) => r.json()), 'nothing was created').toHaveLength(0);
});
