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
