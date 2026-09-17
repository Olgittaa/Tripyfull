import { test, expect } from '@playwright/test';

/**
 * The gate before `main`: one consultant, one trip, from an empty account to a
 * printed route book. Every step is something a consultant does; a failure here
 * means the product does not work, whatever the unit tests say.
 */

/** A fresh account per run, so a green run never depends on a previous one. */
const stamp = Date.now().toString(36);
const USER = `e2e_${stamp}`;
const PASSWORD = 'E2e-pass-12345';

/** The trip runs over three days of next month, away from today's edge cases. */
const firstOfNextMonth = (() => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
})();
const iso = (day) =>
  `${firstOfNextMonth.getFullYear()}-${String(firstOfNextMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const TRIP_START = iso(10);
const TRIP_END = iso(12);

const TRIP = `Andalusia for the Ruiz family ${stamp}`;
const HOTEL = 'Hotel Alfonso XIII';
const STOPS = {
  library: 'Alcázar of Seville',
  searched: 'Plaza de España',
  manual: 'Tapas crawl in Triana',
};

/** Clicks a day in the open calendar, walking forward month by month to find it. */
async function pickDate(page, isoDate) {
  const cell = page.locator(`.dp-day[data-date="${isoDate}"]`);
  for (let i = 0; i < 12 && !(await cell.count()); i++) {
    await page.locator('.dp-head button').last().click();
  }
  await cell.click();
}

test('a consultant builds a trip and prints the book', async ({ page }) => {
  await test.step('register', async () => {
    await page.goto('/auth');
    // The tab switch and the submit button share the word; the form scopes it.
    await page.locator('.tab-switch').getByRole('button', { name: 'Register' }).click();
    await page.getByLabel('Username').fill(USER);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.locator('form').getByRole('button', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/trips/);
  });

  await test.step('create a three-day trip', async () => {
    await page.getByRole('button', { name: 'New trip' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Title *').fill(TRIP);
    await dialog.getByPlaceholder('City or country').fill('Seville');
    await dialog.getByText('Seville', { exact: false }).first().click();
    await dialog.locator('button.select-trigger:has(.pi-calendar)').click();
    await pickDate(page, TRIP_START);
    await pickDate(page, TRIP_END);
    await dialog.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: TRIP })).toBeVisible();
  });

  await test.step('save a place to the library', async () => {
    await page.goto('/places');
    // The head and the empty state both offer it.
    await page.getByRole('button', { name: 'Add place' }).first().click();
    const drawer = page.getByRole('dialog');
    await drawer.getByLabel('Name').fill(STOPS.library);
    await drawer.getByLabel('City').fill('Seville');
    await drawer.getByRole('button', { name: 'Add' }).click();
    // The server geocodes a place saved without coordinates, so this one gets a pin.
    await expect(page.getByRole('heading', { name: STOPS.library }).first()).toBeVisible();
  });

  await test.step('three stops on day one — from the library, from a search, by hand', async () => {
    await page.goto('/trips');
    await page.getByRole('heading', { name: TRIP }).click();
    await page
      .getByRole('link', { name: /Itinerary/ })
      .first()
      .click();
    await expect(page.getByRole('button', { name: /Activity/ })).toBeVisible();

    // 1 — a place already in the library
    await page.getByRole('button', { name: /Activity/ }).click();
    const drawer = page.getByRole('dialog');
    await drawer.getByRole('button', { name: /Pick one of your places/ }).click();
    await page.getByRole('option', { name: new RegExp(STOPS.library) }).click();
    await drawer
      .getByRole('button', { name: /^Add|Save/ })
      .last()
      .click();
    await expect(page.locator('.timeline-row').filter({ hasText: STOPS.library })).toHaveCount(1);

    // 2 — found with the map search, pinned by its result
    await page.getByRole('button', { name: /Activity/ }).click();
    await drawer.getByPlaceholder('A landmark, a café… or a street address').fill(STOPS.searched);
    const hit = page.locator('.tf-place-option').first();
    await expect(hit).toBeVisible({ timeout: 20_000 });
    await hit.click();
    await drawer.getByLabel('Name').fill(STOPS.searched);
    await drawer
      .getByRole('button', { name: /^Add|Save/ })
      .last()
      .click();
    await expect(page.locator('.timeline-row').filter({ hasText: STOPS.searched })).toHaveCount(1);

    // 3 — typed in, no place behind it
    await page.getByRole('button', { name: /Activity/ }).click();
    await drawer.getByLabel('Name').fill(STOPS.manual);
    await drawer
      .getByRole('button', { name: /^Add|Save/ })
      .last()
      .click();
    await expect(page.locator('.timeline-row').filter({ hasText: STOPS.manual })).toHaveCount(1);

    await expect(page.locator('.timeline-row')).toHaveCount(3);
  });

  await test.step('drag the last stop to the front', async () => {
    const rows = page.locator('.timeline-row');
    await expect(rows.first()).toContainText(STOPS.library);
    await rows.nth(2).dragTo(rows.first());
    await expect(rows.first()).toContainText(STOPS.manual);

    // The order is the server's now, not the screen's.
    await page.reload();
    await expect(page.locator('.timeline-row').first()).toContainText(STOPS.manual);
  });

  await test.step('book the hotel for two nights', async () => {
    await page
      .getByRole('link', { name: /Bookings/ })
      .first()
      .click();
    await page
      .getByRole('button', { name: /Booking/ })
      .first()
      .click();
    const drawer = page.getByRole('dialog');
    await drawer.getByLabel('Name').fill(HOTEL);
    await drawer.getByRole('button', { name: 'Accommodation' }).click();
    // TfCitySearch keeps whatever is typed; the dropdown is a convenience.
    await drawer.getByPlaceholder('e.g. Krabi, Bangkok, Kyoto').fill('Seville');
    await drawer.locator('button.select-trigger:has(.pi-calendar)').click();
    await pickDate(page, TRIP_START);
    await pickDate(page, TRIP_END);
    // What it costs lives on the next tab, and a booking cannot be saved without it.
    await drawer.getByRole('button', { name: /^Price/ }).click();
    await drawer.getByLabel('Full price').fill('420');
    await drawer.getByRole('button', { name: 'Create booking' }).click();
    await expect(page.getByText(HOTEL).first()).toBeVisible();
    await expect(page.getByText(/2 nights|1 night/).first()).toBeVisible();
  });

  await test.step('schedule a payment on it', async () => {
    // The drawer stays open on the saved booking, which is where instalments live.
    // A modal opens on top of it, so the drawer is addressed as the drawer.
    const drawer = page.locator('.drawer-panel[role="dialog"]');
    await drawer.getByRole('button', { name: /^Price/ }).click();
    await drawer.getByRole('button', { name: /Schedule payment/ }).click();
    const payDialog = page.locator('.modal[role="dialog"]');
    // This dialog's own label is not tied to the control, so the field it is.
    await payDialog.locator('input.num-field').fill('120');
    await payDialog.locator('button.select-trigger:has(.pi-calendar)').click();
    await pickDate(page, TRIP_START);
    await payDialog.getByRole('button', { name: 'Add' }).click();
    await expect(payDialog).toHaveCount(0);
    await expect(drawer.getByText('120.00').first()).toBeVisible();
    await drawer.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  await test.step('write the bookings into the days', async () => {
    await page.getByRole('button', { name: /plan/i }).first().click();
    await page
      .getByRole('link', { name: /Itinerary/ })
      .first()
      .click();
    // The hotel now owns stops of its own on the days it covers.
    await expect(page.locator('.timeline-row').filter({ hasText: HOTEL }).first()).toBeVisible();
    await expect(page.locator('.timeline-row')).toHaveCount(4);
  });

  await test.step('the budget adds it up', async () => {
    await page
      .getByRole('link', { name: /Budget/ })
      .first()
      .click();
    await expect(page.getByText('420.00').first()).toBeVisible();
    // The instalment is money owed with a date on it.
    await expect(page.getByText('120.00').first()).toBeVisible();
  });

  await test.step('print the route book', async () => {
    await page
      .getByRole('link', { name: /Overview/ })
      .first()
      .click();
    const [book] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: /Print/ }).first().click(),
    ]);
    // The document is written into the window after the photos and the map are
    // probed, so the first thing in it is a "preparing" line.
    await expect(book.getByText(TRIP).first()).toBeVisible({ timeout: 60_000 });

    const printed = book.locator('body');
    await expect(printed).toContainText(STOPS.library);
    await expect(printed).toContainText(STOPS.searched);
    await expect(printed).toContainText(STOPS.manual);
    await expect(printed).toContainText(HOTEL);
    // "→ Plaza de España by taxi · 12 min" — a way to the next stop, with a time.
    await expect(printed).toContainText(/\d+\s?(min|h)\b/);
  });
});
