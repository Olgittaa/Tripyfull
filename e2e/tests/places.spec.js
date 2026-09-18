import { test, expect } from '@playwright/test';
import { deflateSync } from 'node:zlib';

/**
 * The library: the places a consultant collects once and spends for years. What
 * matters is that nothing is lost — a place filed into a folder, dropped from a
 * trip or edited has to end up where the consultant meant it, and a place is
 * never quietly deleted by an action that was about something else.
 */

const API = process.env.API_URL || 'http://localhost:8080';
const PASSWORD = 'E2e-pass-12345';
const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

async function signedIn(request) {
  const username = `e2e_lib_${stamp()}`;
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
    del: (p) => request.delete(`${API}${p}`, { headers }),
    upload: (p, multipart) => request.post(`${API}${p}`, { headers, multipart }),
  };
}

const place = (api, name, extra = {}) =>
  api
    .post('/api/places', {
      name,
      type: 'SIGHTSEEING',
      city: 'Seville',
      country: 'ES',
      latitude: 37.3861,
      longitude: -5.9925,
      rating: 4,
      ...extra,
    })
    .then((r) => r.json());

const trip = (api) =>
  api
    .post('/api/trips', {
      title: `Library ${stamp()}`,
      startDate: '2027-05-03',
      endDate: '2027-05-05',
      baseCurrency: 'EUR',
    })
    .then((r) => r.json());

/** A solid-colour PNG, written by hand so the test needs no image library. */
function png(size = 200) {
  const raw = Buffer.concat(
    Array.from({ length: size }, () =>
      Buffer.concat([Buffer.from([0]), Buffer.alloc(size * 3, 120)]),
    ),
  );
  const chunk = (tag, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(tag), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

test('a place is saved, edited, and keeps what was not edited', async ({ request }) => {
  const api = await signedIn(request);
  const saved = await place(api, 'Alcázar of Seville', {
    ratingComment: 'book the ticket weeks ahead',
    visitMinutes: 120,
    needsBooking: true,
  });
  expect(saved.rating).toBe(4);

  const edited = await api
    .patch(`/api/places/${saved.id}`, { rating: 5, name: 'Real Alcázar' })
    .then((r) => r.json());

  expect(edited.name).toBe('Real Alcázar');
  expect(edited.rating).toBe(5);
  // Everything the edit did not mention is still there.
  expect(edited.ratingComment).toBe('book the ticket weeks ahead');
  expect(edited.visitMinutes).toBe(120);
  expect(edited.needsBooking).toBeTruthy();
  expect(Number(edited.latitude)).toBeCloseTo(37.3861, 4);
});

test('a place holds five photos and says so at the sixth', async ({ request }) => {
  const api = await signedIn(request);
  const saved = await place(api, `Photo limit ${stamp()}`);
  const already = (saved.photos || []).length; // enrichment may have found some

  let last;
  for (let i = already; i < 5; i++) {
    last = await api.upload(`/api/places/${saved.id}/photos`, {
      file: { name: `shot${i}.png`, mimeType: 'image/png', buffer: png() },
    });
    expect(last.ok(), `photo ${i + 1}`).toBeTruthy();
  }
  expect((await last.json()).photos).toHaveLength(5);

  const sixth = await api.upload(`/api/places/${saved.id}/photos`, {
    file: { name: 'sixth.png', mimeType: 'image/png', buffer: png() },
  });
  expect(sixth.status()).toBe(400);
  expect((await sixth.json()).error).toMatch(/holds up to 5 photos/i);
});

test('folders are made, renamed, filled and emptied — places outlive them', async ({ request }) => {
  const api = await signedIn(request);
  const t = await trip(api);
  const alcazar = await place(api, 'Alcázar of Seville');
  const cathedral = await place(api, 'Cathedral');

  const temples = await api
    .post('/api/folders', { name: 'Must see', color: '#e35a38', tripId: t.id })
    .then((r) => r.json());
  const maybe = await api
    .post('/api/folders', { name: 'If there is time', color: '#2f7d5b', tripId: t.id })
    .then((r) => r.json());

  await api.put(`/api/folders/${temples.id}/places/${alcazar.id}`);
  await api.put(`/api/folders/${temples.id}/places/${cathedral.id}`);
  // A place lives in one folder: filing it again moves it out of the first.
  const moved = await api
    .put(`/api/folders/${maybe.id}/places/${cathedral.id}`)
    .then((r) => r.json());
  expect(moved.placeCount).toBe(1);
  const inFolder = (id) =>
    api.get(`/api/places?folderId=${id}`).then(async (r) => (await r.json()).map((p) => p.name));
  expect(await inFolder(maybe.id)).toEqual(['Cathedral']);
  expect(await inFolder(temples.id)).toEqual(['Alcázar of Seville']);

  const renamed = await api
    .patch(`/api/folders/${temples.id}`, { name: 'Anchors' })
    .then((r) => r.json());
  expect(renamed.name).toBe('Anchors');

  // Filing into a trip's folder puts the place on that trip's list.
  const onTrip = await api.get(`/api/places?tripId=${t.id}`).then((r) => r.json());
  expect(onTrip.map((p) => p.name).sort()).toEqual(['Alcázar of Seville', 'Cathedral']);

  // Deleting a folder is about the folder; the places stay in the library.
  expect((await api.del(`/api/folders/${temples.id}`)).status()).toBe(204);
  const left = await api.get('/api/places').then((r) => r.json());
  expect(left.map((p) => p.name).sort()).toEqual(['Alcázar of Seville', 'Cathedral']);
});

test('a place joins a trip and leaves it without leaving the library', async ({ request }) => {
  const api = await signedIn(request);
  const t = await trip(api);
  const saved = await place(api, 'Plaza de España');

  await api.put(`/api/places/${saved.id}/trips/${t.id}`);
  expect(await api.get(`/api/places?tripId=${t.id}`).then((r) => r.json())).toHaveLength(1);

  await api.del(`/api/places/${saved.id}/trips/${t.id}`);
  expect(await api.get(`/api/places?tripId=${t.id}`).then((r) => r.json())).toHaveLength(0);
  // Still in the library, where it was collected.
  expect(await api.get('/api/places').then((r) => r.json())).toHaveLength(1);
});

test('a link that is not a place is refused in words', async ({ request }) => {
  const api = await signedIn(request);
  for (const url of ['https://example.com/not-a-map', 'nonsense']) {
    const res = await api.post('/api/places/import', { url });
    expect(res.status(), url).toBe(400);
    expect((await res.json()).error).toMatch(/Google Maps place link/i);
  }
});

test('the library screen adds, files and bulk-edits', async ({ page, request }) => {
  const api = await signedIn(request);
  const t = await trip(api);
  await place(api, 'Alcázar of Seville');
  await place(api, 'Cathedral');
  await place(api, 'Plaza de España');

  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('username', user);
    },
    [api.token, api.username],
  );
  await page.goto('/places');
  await expect(page.getByRole('heading', { name: 'Alcázar of Seville' })).toBeVisible();

  // Selection mode: everything at once, then one action on all of it.
  await page.getByRole('button', { name: 'Select' }).click();
  await page.getByRole('button', { name: 'Select all' }).click();
  await expect(page.getByText('3 selected')).toBeVisible();
  await page.getByRole('button', { name: /Add to trip/ }).click();
  await page.getByRole('option').first().click();

  await expect
    .poll(async () => (await api.get(`/api/places?tripId=${t.id}`).then((r) => r.json())).length)
    .toBe(3);
});

test('deleting the place you are looking at closes its drawer', async ({ page, request }) => {
  const api = await signedIn(request);
  await place(api, 'Alcázar of Seville');
  await place(api, 'Cathedral');

  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('username', user);
    },
    [api.token, api.username],
  );
  await page.goto('/places');
  await page.getByRole('heading', { name: 'Cathedral' }).click();

  const drawer = page.getByRole('dialog').filter({ hasText: 'Cathedral' });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Delete' }).last().click();

  // The place is gone — and so is the panel that was showing it: a drawer left
  // open on a deleted place is a screen full of stale words and dead buttons.
  await expect(page.getByRole('heading', { name: 'Cathedral' })).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Alcázar of Seville' })).toBeVisible();
});
