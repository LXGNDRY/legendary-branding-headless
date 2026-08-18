import {defineConfig, devices} from '@playwright/test';

/**
 * Playwright E2E test configuration.
 *
 * Runs against the Hydrogen dev server (shopify hydrogen dev) on port 3000.
 * In CI, tests run against the deployed preview URL after the deploy step.
 *
 * Run locally:
 *   # Terminal 1: npm run dev
 *   # Terminal 2: npm run test:e2e
 *
 * Set BASE_URL to test against a deployed environment.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },
    {
      name: 'webkit',
      use: {...devices['Desktop Safari']},
    },
    {
      name: 'mobile',
      use: {...devices['iPhone 14']},
    },
  ],

  /* Dev server — only used when running locally without BASE_URL set */
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
