import { defineConfig } from 'vitest/config';

// Unit tests live next to the code they test, in lib/core and the portal's
// composables; components and views are exercised in the browser.
export default defineConfig({
  test: {
    include: ['lib/**/*.test.js', 'app/**/*.test.js'],
    environment: 'node',
  },
});
