import { test, expect } from '@playwright/test';

/**
 * Every screen on a phone. A consultant checks the plan on the way to a meeting
 * and a client opens the same trip on the sofa, so nothing may need sideways
 * scrolling to be read, and the day has to be workable with one thumb.
 */

const API = process.env.API_URL || 'http://localhost:8080';
const PASSWORD = 'E2e-pass-12345';
const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

async function signedIn(request) {
  const username = `e2e_mob_${stamp()}`;
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

/** A trip with something on every screen, so none of them is empty on a phone. */
async function furnishedTrip(api) {
  const trip = await api
    .post('/api/trips', {
      title: `On a phone ${stamp()}`,
      destination: 'Andalusia',
      startDate: '2027-05-03',
      endDate: '2027-05-06',
      baseCurrency: 'EUR',
      status: 'PLANNED',
    })
    .then((r) => r.json());
  const days = await api
    .get(`/api/trips/${trip.id}/days`)
    .then((r) => r.json())
    .then((all) => all.filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date)));

  for (const [name, lat, lon] of [
    ['Real Alcázar, with a name long enough to wrap on a narrow screen', 37.383, -5.9902],
    ['Plaza de España', 37.3775, -5.9869],
  ]) {
    await api.post(`/api/days/${days[0].id}/activities`, {
      name,
      type: 'SIGHTSEEING',
      latitude: lat,
      longitude: lon,
      costEstimate: 15,
      costCurrency: 'EUR',
    });
  }
  await api.post(`/api/trips/${trip.id}/bookings`, {
    name: 'Hotel Alfonso XIII',
    category: 'ACCOMMODATION',
    accommodationCity: 'Seville',
    checkIn: '2027-05-03',
    checkOut: '2027-05-05',
    fullPrice: 420,
    priceCurrency: 'EUR',
  });
  await api.post(`/api/trips/${trip.id}/todos`, {
    title: 'Send the client the itinerary and the booking references',
    groupName: 'Before we go',
  });
  await api.post('/api/places', {
    name: 'Cathedral',
    type: 'SIGHTSEEING',
    city: 'Seville',
    country: 'ES',
    latitude: 37.3861,
    longitude: -5.9925,
    rating: 5,
  });
  return { trip, days };
}

/** Nothing may stick out sideways: a phone reader should never have to pan. */
async function fitsTheScreen(page, where) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const widest = [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 1)
      .slice(0, 3)
      .map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`);
    return { page: doc.scrollWidth, screen: doc.clientWidth, widest };
  });
  expect(
    overflow.page,
    `${where} is ${overflow.page - overflow.screen}px wider than the screen (${overflow.widest.join(', ')})`,
  ).toBeLessThanOrEqual(overflow.screen + 1);
}

test('every screen of a trip fits a phone', async ({ page, request }) => {
  const api = await signedIn(request);
  const { trip, days } = await furnishedTrip(api);
  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('username', user);
    },
    [api.token, api.username],
  );

  const screens = [
    ['the trip list', '/trips'],
    ['the overview', `/trips/${trip.id}`],
    ['the day', `/trips/${trip.id}/days/${days[0].id}`],
    ['the plan map', `/trips/${trip.id}/map`],
    ['the trip places', `/trips/${trip.id}/places`],
    ['the bookings', `/trips/${trip.id}/bookings`],
    ['the to-do list', `/trips/${trip.id}/todos`],
    ['the budget', `/trips/${trip.id}/budget`],
    ['the library', '/places'],
    ['the settings', '/settings'],
  ];

  // A quick proof that the measurement can fail at all.
  await page.goto('/trips');
  await page.evaluate(() =>
    document.body.insertAdjacentHTML('beforeend', '<div id="probe" style="width:900px">x</div>'),
  );
  let caught = null;
  try {
    await fitsTheScreen(page, 'the probe');
  } catch (e) {
    caught = e;
  }
  expect(caught, 'the overflow check must notice 900px sticking out').not.toBeNull();
  await page.evaluate(() => document.getElementById('probe').remove());

  for (const [where, url] of screens) {
    await page.goto(url);
    await expect(page.locator('main, .page-content').first()).toBeVisible();
    await page.waitForTimeout(400); // let the last fetch land before measuring
    await fitsTheScreen(page, where);
  }
});

test('the day is workable with one thumb: the dock, and the map as a sheet', async ({
  page,
  request,
}) => {
  const api = await signedIn(request);
  const { trip, days } = await furnishedTrip(api);
  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('username', user);
    },
    [api.token, api.username],
  );
  await page.goto(`/trips/${trip.id}/days/${days[0].id}`);

  // The dock sits at the bottom, over the list.
  const dock = page.locator('nav.day-dock');
  await expect(dock).toBeVisible();
  const box = await dock.boundingBox();
  const viewport = page.viewportSize();
  expect(box.y + box.height).toBeGreaterThan(viewport.height - 120);

  // It counts the pins the day has, and it moves between days.
  const mapButton = dock.getByRole('button', { name: 'Day route on the map' });
  await expect(mapButton).toContainText('2');
  await dock.getByRole('button', { name: /next/i }).click();
  await expect(page).toHaveURL(new RegExp(`/days/${days[1].id}`));
  await dock.getByRole('button', { name: /previous/i }).click();
  await expect(page).toHaveURL(new RegExp(`/days/${days[0].id}`));

  // The map is parked below the screen until the dock slides it up.
  const sheet = page.locator('aside.itin-map');
  await expect(sheet).not.toHaveClass(/is-open/);
  await mapButton.click();
  await expect(sheet).toHaveClass(/is-open/);
  const sheetBox = await sheet.boundingBox();
  expect(sheetBox.y).toBeLessThan(viewport.height);
  expect(sheetBox.width).toBeLessThanOrEqual(viewport.width + 1);
  await sheet.getByRole('button', { name: /close/i }).click();
  await expect(sheet).not.toHaveClass(/is-open/);
});

test('the trip menu is a drawer behind the hamburger', async ({ page, request }) => {
  const api = await signedIn(request);
  const { trip } = await furnishedTrip(api);
  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('username', user);
    },
    [api.token, api.username],
  );
  await page.goto(`/trips/${trip.id}`);

  // The trip's sections are not taking half the screen; they are one tap away.
  const menu = page.getByRole('button', { name: /Trip menu/i });
  await expect(menu).toBeVisible();
  await menu.click();
  const budget = page.getByRole('link', { name: /Budget/ }).first();
  await expect(budget).toBeVisible();
  await budget.click();
  await expect(page).toHaveURL(/\/budget/);
  await expect(page.getByRole('heading', { name: 'Budget' })).toBeVisible();
});
