import { defineConfig, devices } from '@playwright/test';

/**
 * The gate before `main`: one run, one browser, the whole consultant path.
 *
 * Both servers are started here when they are not already up, so `npm test`
 * inside e2e/ is the single command the gate needs. A dev server that is
 * already running is reused — the backend takes the best part of a minute to
 * boot, and nobody wants that twice.
 */
export default defineConfig({
  testDir: './tests',
  // The path is one story: a step that fails leaves the rest meaningless.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PORTAL_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node ../scripts/dev-backend.mjs',
      url: 'http://localhost:8080/actuator/health',
      reuseExistingServer: true,
      timeout: 180_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev --prefix ../frontend',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
