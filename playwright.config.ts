import {defineConfig, devices} from '@playwright/test';

/**
 * Playwright E2E test configuration.
 *
 * By default, runs against a locally-started server on port 3000 — the
 * Hydrogen dev server locally, or a production build served via
 * `shopify hydrogen preview` in CI. This is deliberate: Shopify's Oxygen
 * preview (*.myshopify.dev) URLs intercept automated browser traffic
 * (including real Chromium, not just curl) with a "Verifying your
 * connection..." bot-check challenge, which made every E2E test fail
 * uniformly when this suite ran against the live deployed preview URL —
 * not because the app was broken, but because every page navigation
 * landed on Shopify's own challenge page instead. Testing against a
 * locally-served production build sidesteps that entirely and is a more
 * deterministic, faster signal anyway (no network/deploy dependency).
 *
 * Run locally:
 *   npm run test:e2e          # auto-starts `npm run dev` for you
 *
 * To test against a real deployed environment instead (e.g. manual
 * spot-checking after a deploy), set BASE_URL explicitly:
 *   BASE_URL=https://your-preview-url.myshopify.dev npm run test:e2e
 * (expect Shopify's bot-check to block most/all requests when run from
 * a non-interactive environment — this mode is for a human's own machine.)
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
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000',
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
      use: {...devices['Pixel 7']},
    },
    {
      // Real iOS Safari coverage, distinct from the Android/Chrome
      // emulation above. iOS Safari is the single largest share of real
      // mobile shopper traffic and has its own quirks (dvh units,
      // position:sticky/fixed behavior, hover/pointer media-query
      // reporting, autofocus-triggered keyboard behavior) that Chromium's
      // mobile emulation does not reproduce -- several bugs fixed in this
      // codebase's mobile-optimization pass (hover-hidden controls,
      // viewport-meta handling) were exactly this class of issue, so this
      // project exists to actually catch that class going forward.
      name: 'mobile-safari',
      use: {...devices['iPhone 14']},
    },
  ],

  /* Local server — always used unless BASE_URL points at an external
   * deployment. In CI this serves the already-built production bundle
   * (`shopify hydrogen preview`); locally it starts the dev server. */
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: process.env.CI ? 'npm run preview' : 'npm run dev',
        url: 'http://127.0.0.1:3000',
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
