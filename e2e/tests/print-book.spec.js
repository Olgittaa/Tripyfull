import { test, expect } from '@playwright/test';

/**
 * The route book is the thing that reaches the client, and it is built in the
 * browser from one export call. These are its awkward trips: no photos at all,
 * nothing pinned on a map, twelve days, and a client who gets the file rather
 * than the screen. What must never happen is a block with nothing in it.
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
    get: (p) => request.get(`${API}${p}`, { headers }),
    post: (p, data) => request.post(`${API}${p}`, { headers, data }),
    put: (p, data) => request.put(`${API}${p}`, { headers, data }),
    patch: (p, data) => request.patch(`${API}${p}`, { headers, data }),
  };
}

async function tripOf(api, { start, end, title }) {
  const trip = await api
    .post('/api/trips', {
      title,
      destination: 'Andalusia',
      startDate: start,
      endDate: end,
      baseCurrency: 'EUR',
      status: 'PLANNED',
    })
    .then((r) => r.json());
  const days = await api
    .get(`/api/trips/${trip.id}/days`)
    .then((r) => r.json())
    .then((all) => all.filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date)));
  return { trip, days };
}

/** Opens the book for a trip and returns its page once it has been written. */
async function openBook(page, api, trip) {
  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('username', user);
    },
    [api.token, api.username],
  );
  await page.goto(`/trips/${trip.id}`);
  const [book] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: /Print/ }).first().click(),
  ]);
  await expect(book.getByText(trip.title).first()).toBeVisible({ timeout: 90_000 });
  return book;
}

/** No section may be printed with nothing under its heading. */
async function noEmptySections(book) {
  const empties = await book.evaluate(() =>
    [...document.querySelectorAll('section')]
      .filter((s) => {
        const heading = s.querySelector('h1, h2, h3');
        if (!heading) return false;
        const rest = s.innerText.replace(heading.innerText, '').trim();
        return rest.length === 0 && s.querySelectorAll('img, table').length === 0;
      })
      .map((s) => s.querySelector('h1, h2, h3').innerText),
  );
  expect(empties, 'sections with a heading and nothing under it').toEqual([]);
}

test('a trip with no photos still has a cover worth handing over', async ({ page, request }) => {
  const api = await signedIn(request);
  const { trip, days } = await tripOf(api, {
    start: '2027-10-04',
    end: '2027-10-06',
    title: `No photos ${stamp()}`,
  });
  await api.patch(`/api/days/${days[0].id}`, { city: 'Seville' });
  await api.post(`/api/days/${days[0].id}/activities`, {
    name: 'Cathedral',
    type: 'SIGHTSEEING',
    latitude: 37.3861,
    longitude: -5.9925,
  });

  const book = await openBook(page, api, trip);

  const cover = book.locator('section.cover');
  await expect(cover).toContainText(trip.title);
  await expect(cover).toContainText('3 days');
  await expect(cover).toContainText('Andalusia');
  // Nothing hollow where the collage would be.
  await expect(cover.locator('img')).toHaveCount(0);
  await noEmptySections(book);
});

test('a trip with nothing pinned prints without a map and without a gap', async ({
  page,
  request,
}) => {
  const api = await signedIn(request);
  const { trip, days } = await tripOf(api, {
    start: '2027-10-04',
    end: '2027-10-05',
    title: `No pins ${stamp()}`,
  });
  // Stops a consultant typed without ever placing them on a map.
  await api.post(`/api/days/${days[0].id}/activities`, {
    name: 'Breakfast wherever we wake up',
    type: 'MEAL_STOP',
  });
  await api.post(`/api/days/${days[1].id}/activities`, { name: 'Wander', type: 'OTHER' });

  const book = await openBook(page, api, trip);

  await expect(book.locator('img.route-map')).toHaveCount(0);
  await expect(book.locator('body')).toContainText('Breakfast wherever we wake up');
  await expect(book.locator('body')).toContainText('Wander');
  // No broken images anywhere in the document.
  const broken = await book.evaluate(() =>
    [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
  );
  expect(broken).toEqual([]);
  await noEmptySections(book);
});

test('the plan counts read like a sentence, never like a database', async ({ page, request }) => {
  const api = await signedIn(request);
  const { trip, days } = await tripOf(api, {
    start: '2027-10-04',
    end: '2027-10-05',
    title: `Counts ${stamp()}`,
  });
  // One stop of a kind that only the itinerary knows about, one of a kind the
  // library knows, so both naming schemes end up on the page.
  await api.post(`/api/days/${days[0].id}/activities`, {
    name: 'Lunch at the riverside',
    type: 'MEAL_STOP',
  });
  await api.post(`/api/days/${days[0].id}/activities`, { name: 'Cathedral', type: 'SIGHTSEEING' });
  await api.post(`/api/days/${days[1].id}/activities`, { name: 'Alcázar', type: 'SIGHTSEEING' });

  const book = await openBook(page, api, trip);

  const counts = book.locator('ul.counts');
  await expect(counts).toContainText('3 stops over 2 days');
  await expect(counts).toContainText('2 sights');
  await expect(counts).toContainText('1 meal');
  // No enum name, no underscore, anywhere in the document.
  await expect(book.locator('body')).not.toContainText('_');
});

test('twelve days all come out, in order, each on its own page', async ({ page, request }) => {
  const api = await signedIn(request);
  const { trip, days } = await tripOf(api, {
    start: '2027-11-01',
    end: '2027-11-12',
    title: `Twelve days ${stamp()}`,
  });
  expect(days).toHaveLength(12);
  for (const [i, d] of days.entries()) {
    await api.post(`/api/days/${d.id}/activities`, {
      name: `Stop on day ${i + 1}`,
      type: 'SIGHTSEEING',
    });
  }

  const book = await openBook(page, api, trip);

  const dayPages = book.locator('section.page.day');
  await expect(dayPages).toHaveCount(12);
  const heads = await dayPages.allInnerTexts();
  heads.forEach((text, i) => {
    expect(text, `day ${i + 1} page`).toContain(`Day ${i + 1}`);
    expect(text).toContain(`Stop on day ${i + 1}`);
  });
  // Each day starts a page of its own.
  const breaks = await book.evaluate(() =>
    [...document.querySelectorAll('section.page.day')].map(
      (s) => getComputedStyle(s).breakBefore || getComputedStyle(s).pageBreakBefore,
    ),
  );
  expect(new Set(breaks)).toEqual(new Set(['page']));
  await noEmptySections(book);
});

test('a stop card is never allowed to break across two pages', async ({ page, request }) => {
  const api = await signedIn(request);
  const { trip, days } = await tripOf(api, {
    start: '2027-10-04',
    end: '2027-10-05',
    title: `Long day ${stamp()}`,
  });
  // A day full enough to run past one page.
  for (let i = 1; i <= 12; i++) {
    await api.post(`/api/days/${days[0].id}/activities`, {
      name: `Stop number ${i}`,
      type: 'SIGHTSEEING',
      address: 'Calle de las Sierpes 12, Seville, Andalusia, Spain',
      notes: 'Ask for the courtyard table; the queue is shortest before eleven.',
      startTime: `${String(8 + Math.floor(i / 2)).padStart(2, '0')}:00`,
    });
  }

  const book = await openBook(page, api, trip);

  const rules = await book.evaluate(() =>
    [...document.querySelectorAll('article.stop')].map((s) => getComputedStyle(s).breakInside),
  );
  expect(rules.length).toBeGreaterThan(10);
  expect(new Set(rules), 'every stop card refuses to be split').toEqual(new Set(['avoid']));
});

test('when the map tiles will not come, the book goes on without them', async ({
  page,
  request,
}) => {
  const api = await signedIn(request);
  const { trip, days } = await tripOf(api, {
    start: '2027-10-04',
    end: '2027-10-05',
    title: `No tiles ${stamp()}`,
  });
  for (const [i, d] of days.entries()) {
    await api.post(`/api/days/${d.id}/activities`, {
      name: `Stop on day ${i + 1}`,
      type: 'SIGHTSEEING',
      latitude: 37.38 + i / 100,
      longitude: -5.99,
    });
  }

  // A hotel lobby wifi that drops every tile request.
  await page.context().route('**/tile.openstreetmap.org/**', (route) => route.abort());

  const book = await openBook(page, api, trip);

  // The stops are all there; the map is simply missing rather than half-drawn.
  await expect(book.locator('body')).toContainText('Stop on day 1');
  await expect(book.locator('body')).toContainText('Stop on day 2');
  // Nor is any day given a map of blank squares.
  await expect(book.locator('img.day-map')).toHaveCount(0);
  const maps = await book.locator('img.route-map').count();
  if (maps) {
    // A map that did come out must not be a grey rectangle: it is only kept when
    // most of its tiles arrived.
    await expect(book.locator('img.route-map')).toHaveAttribute('src', /^data:image/);
  }
  await noEmptySections(book);
});

test('the book prints to PDF, and the file is a real one', async ({
  page,
  request,
  browserName,
}, testInfo) => {
  test.skip(browserName !== 'chromium', 'printing to PDF is a Chromium capability');
  const api = await signedIn(request);
  const { trip, days } = await tripOf(api, {
    start: '2027-10-04',
    end: '2027-10-07',
    title: `To PDF ${stamp()}`,
  });
  for (const [i, d] of days.entries()) {
    await api.post(`/api/days/${d.id}/activities`, {
      name: `Stop on day ${i + 1}`,
      type: 'SIGHTSEEING',
      latitude: 37.38 + i / 100,
      longitude: -5.99,
    });
  }

  const book = await openBook(page, api, trip);
  const pdf = await book.pdf({ format: 'A4', printBackground: true });

  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.length).toBeGreaterThan(10_000);
  // Somewhere to look when a run goes wrong.
  await testInfo.attach('route-book.pdf', { body: pdf, contentType: 'application/pdf' });
});

test('the photos in the book are shrunk to what the page prints', async ({
  page,
  request,
  browserName,
}) => {
  const api = await signedIn(request);
  const { trip, days } = await tripOf(api, {
    start: '2027-10-04',
    end: '2027-10-05',
    title: `Heavy photos ${stamp()}`,
  });
  const saved = await api
    .post('/api/places', {
      name: 'Plaza de España',
      type: 'SIGHTSEEING',
      city: 'Seville',
      country: 'ES',
      latitude: 37.3775,
      longitude: -5.9869,
      rating: 5,
    })
    .then((r) => r.json());
  // Creating a place asks Google for pictures of it; this test is about the one
  // photo it uploads itself, so the found ones go again.
  await api.patch(`/api/places/${saved.id}`, { photos: [] });
  await api.put(`/api/places/${saved.id}/trips/${trip.id}`);
  await api.post(`/api/days/${days[0].id}/activities`, {
    name: 'Plaza de España',
    type: 'SIGHTSEEING',
    placeId: saved.id,
  });

  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('username', user);
    },
    [api.token, api.username],
  );
  await page.goto(`/trips/${trip.id}`);

  // A photo the size a phone takes: the server keeps it at 1600 px, which is
  // right for the screen and four times more than paper can show.
  const stored = await page.evaluate(
    async ([apiBase, token, placeId]) => {
      const c = document.createElement('canvas');
      c.width = 1600;
      c.height = 1200;
      const ctx = c.getContext('2d');
      const sky = ctx.createLinearGradient(0, 0, 0, c.height);
      sky.addColorStop(0, '#2b6cb0');
      sky.addColorStop(1, '#f6e3c5');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, c.width, c.height);
      for (let i = 0; i < 400; i++) {
        ctx.fillStyle = `hsl(${(i * 37) % 360} 60% ${30 + (i % 50)}%)`;
        ctx.beginPath();
        ctx.arc((i * 131) % c.width, (i * 271) % c.height, 4 + (i % 40), 0, Math.PI * 2);
        ctx.fill();
      }
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
      const body = new FormData();
      body.append('file', blob, 'plaza.jpg');
      const res = await fetch(`${apiBase}/api/places/${placeId}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const place = await res.json();
      const url = apiBase + place.photos[place.photos.length - 1];
      const head = await fetch(url);
      const bytes = (await head.blob()).size;
      const img = new Image();
      await new Promise((done) => {
        img.onload = done;
        img.src = url;
      });
      return { width: img.naturalWidth, bytes };
    },
    [API, api.token, saved.id],
  );
  expect(stored.width, 'the stored photo is bigger than the page needs').toBeGreaterThan(1000);

  const book = await openBook(page, api, trip);

  const printed = await book.evaluate(() =>
    [...document.querySelectorAll('img.photo, table.collage img')].map((img) => ({
      src: img.src.slice(0, 15),
      width: img.naturalWidth,
      // Base64 carries 3 bytes in every 4 characters.
      bytes: Math.round(((img.src.length - img.src.indexOf(',') - 1) * 3) / 4),
    })),
  );
  expect(printed.length, 'the stop and the cover both print the photo').toBeGreaterThan(0);
  for (const p of printed) {
    expect(p.src, 'the book carries its photos, it does not link them').toBe('data:image/jpeg');
    expect(p.width, 'a photo is never bigger than the one on screen').toBeLessThanOrEqual(
      stored.width,
    );
    expect(p.bytes, 'and never heavier').toBeLessThanOrEqual(stored.bytes);
    // Every engine encodes a JPEG its own way, and Safari's is gentle enough that
    // the redraw can cost more than it saves — there the original is kept, which
    // is why the two rules above are all every browser promises. Where the redraw
    // does win, it wins properly.
    if (browserName === 'chromium') {
      expect(p.width, 'no photo is larger than the page prints it').toBeLessThanOrEqual(1000);
      expect(p.bytes, 'and it weighs less than the one on the screen').toBeLessThan(stored.bytes);
    }
  }
});

test('every day opens with a map of its own stops, numbered like its list', async ({
  page,
  request,
}) => {
  const api = await signedIn(request);
  const { trip, days } = await tripOf(api, {
    start: '2027-10-04',
    end: '2027-10-06',
    title: `Day maps ${stamp()}`,
  });
  // Day 1: two pinned stops around one without a pin — the dots must read 1 and 3.
  for (const [name, lat] of [
    ['Cathedral', 37.386],
    ['Lunch somewhere', null],
    ['Alcázar', 37.383],
  ]) {
    await api.post(`/api/days/${days[0].id}/activities`, {
      name,
      type: 'SIGHTSEEING',
      latitude: lat,
      longitude: lat ? -5.993 : null,
    });
  }
  // Day 2: nothing pinned at all. Day 3: one stop.
  await api.post(`/api/days/${days[1].id}/activities`, { name: 'A quiet day', type: 'OTHER' });
  await api.post(`/api/days/${days[2].id}/activities`, {
    name: 'Triana',
    type: 'SIGHTSEEING',
    latitude: 37.385,
    longitude: -6.003,
  });
  // A reserve day with an idea on the map.
  // Adding a reserve day answers with every day of the trip; the new one is the undated one.
  const spare = await api
    .post(`/api/trips/${trip.id}/days/buffer`)
    .then((r) => r.json())
    .then((all) => all.find((d) => !d.date));
  await api.post(`/api/days/${spare.id}/activities`, {
    name: 'Italica',
    type: 'SIGHTSEEING',
    latitude: 37.444,
    longitude: -6.047,
  });

  const book = await openBook(page, api, trip);
  const dayPage = (n) =>
    book
      .locator('section')
      .filter({ has: book.getByRole('heading', { name: `Day ${n}`, exact: true }) });

  await expect(dayPage(1).locator('img.day-map')).toHaveCount(1);
  await expect(dayPage(1).locator('img.day-map')).toHaveAttribute('src', /^data:image\/jpeg/);
  await expect(dayPage(2).locator('img.day-map'), 'nothing pinned, nothing to draw').toHaveCount(0);
  await expect(dayPage(3).locator('img.day-map')).toHaveCount(1);
  await expect(
    book.locator('section').filter({ hasText: 'Not on a date' }).locator('img.day-map'),
    'a reserve day shows where its ideas are',
  ).toHaveCount(1);
  // The list beside the map still counts the pinless lunch as stop 2.
  await expect(dayPage(1).locator('.stop-num')).toHaveText(['1', '2', '3']);
  await noEmptySections(book);
});
