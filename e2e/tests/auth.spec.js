import { test, expect } from '@playwright/test';

/**
 * The way in and the way back in. Registering, signing in, getting it wrong,
 * and — the one that matters — a session that dies while the tab is open: the
 * dialog asks, the page stays where it is, and the request that failed is made
 * again on its own.
 */

const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const PASSWORD = 'E2e-pass-12345';

/** Signs in through the form, with the keyboard, the way a person would. */
async function signIn(page, user, password) {
  await page.getByLabel('Username').fill(user);
  await page.getByLabel('Password').fill(password);
  await page.getByLabel('Password').press('Enter');
}

test('registering, signing in, and getting the password wrong', async ({ page }) => {
  const user = `e2e_auth_${stamp()}`;

  await test.step('register — Enter submits', async () => {
    await page.goto('/auth');
    await page.locator('.tab-switch').getByRole('button', { name: 'Register' }).click();
    await signIn(page, user, PASSWORD);
    await expect(page).toHaveURL(/\/trips/);
  });

  await test.step('the same username is refused, in words', async () => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/auth');
    await page.locator('.tab-switch').getByRole('button', { name: 'Register' }).click();
    await signIn(page, user, PASSWORD);
    await expect(page.getByText(/already taken/i)).toBeVisible();
    await expect(page).toHaveURL(/\/auth/);
  });

  await test.step('a wrong password says so and keeps you here', async () => {
    await page.locator('.tab-switch').getByRole('button', { name: 'Sign in' }).click();
    await signIn(page, user, 'not-the-password');
    await expect(page.getByText(/invalid username or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/auth/);
  });

  await test.step('the right one gets in', async () => {
    await signIn(page, user, PASSWORD);
    await expect(page).toHaveURL(/\/trips/);
  });
});

test('a session that dies asks, and the page carries on where it was', async ({ page }) => {
  const user = `e2e_sess_${stamp()}`;
  const TRIP = `Session trip ${stamp()}`;
  const SECOND_TRIP = `Trip saved after signing back in ${stamp()}`;

  await page.goto('/auth');
  await page.locator('.tab-switch').getByRole('button', { name: 'Register' }).click();
  await signIn(page, user, PASSWORD);
  await expect(page).toHaveURL(/\/trips/);

  // Something to come back to.
  await page.getByRole('button', { name: 'New trip' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title *').fill(TRIP);
  await dialog.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('heading', { name: TRIP })).toBeVisible();

  await test.step('the server stops accepting the token', async () => {
    // The client still reads the token as valid — only the signature is spoiled,
    // which is what an expired session looks like from the page's side.
    await page.evaluate(() => {
      const [h, p] = localStorage.getItem('token').split('.');
      localStorage.setItem('token', `${h}.${p}.not-a-signature`);
    });
  });

  await test.step('the next request raises the dialog — with the form still filled in', async () => {
    // A second trip, typed in full, and the save is what runs into the dead session.
    await page.getByRole('button', { name: 'New trip' }).first().click();
    const form = page.locator('.modal[role="dialog"]').filter({ hasText: 'New trip' });
    await form.getByLabel('Title *').fill(SECOND_TRIP);
    await form.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Session expired')).toBeVisible();
    await expect(page).not.toHaveURL(/\/auth/);
  });

  await test.step('signing in saves what the dead session refused', async () => {
    const modal = page.locator('.modal[role="dialog"]').filter({ hasText: 'Session expired' });
    await modal.getByLabel('Password').fill(PASSWORD);
    await modal.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Session expired')).toBeHidden();
    // Nothing was retyped: the trip the refused request carried is there.
    await expect(page.getByRole('heading', { name: SECOND_TRIP })).toBeVisible();
  });

  await test.step('a token whose own expiry passed asks without being pushed', async () => {
    await page.evaluate(() => {
      const [h, p, s] = localStorage.getItem('token').split('.');
      const payload = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
      payload.exp = Math.floor(Date.now() / 1000) - 3600;
      const next = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      localStorage.setItem('token', `${h}.${next}.${s}`);
      window.dispatchEvent(new Event('focus'));
    });
    await expect(page.getByText('Session expired')).toBeVisible();
  });

  await test.step('signing out leaves for the sign-in page', async () => {
    await page.locator('.modal[role="dialog"]').getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/auth/);
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });
});
