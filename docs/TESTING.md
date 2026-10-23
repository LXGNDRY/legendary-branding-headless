# Testing evidence

| Layer | Command | Gate |
|---|---|---|
| Unit/behavior (Vitest, hermetic: unmocked `fetch` fails) | `npm run test:coverage` | CI quality job; coverage floors in `vitest.config.ts` only ratchet up |
| Accessibility (axe, jsdom + real browser) | included above / `e2e/a11y.spec.ts` | CI; `color-contrast` in e2e still off until a preview run |
| E2E (Playwright: chromium, webkit, mobile, mobile-safari) | `npm run test:e2e` | CI e2e job (needs live Storefront credentials) |
| E2E execution record | e2e job summary artifacts | each E2E project records executed/skipped/flaky counts (`e2e-summary-<project>`); the deploy job folds them into `release-evidence-<sha>`, and a production deploy fails unless all four projects executed tests with no unexpected failures |
| Post-deploy smoke + release probe | deploy job | blocks the deploy job; first run on every merge to `dev`/`main` |
| Failing-before audit | `npm run test:mutations` | manual / before release: re-introduces 12 P0/P1 defects one at a time and requires a test to fail for each |

## Failing-before audit (2026-10-23)

12/12 re-introduced defects were caught: JSON-LD `<` escaping (F06), HTML sanitization (F07), cart cookie append (F05),
unsupported cart actions and line validation (F04), rate-limit boundary (F27), consent adoption and marketing gating
(F25), private-page caching (F29), reviewer-name masking (F31), variant pagination (F19), release-probe contract (F44).

The script restores every file after each run and reports `STALE` if a pattern no longer matches exactly once (update
the pattern when the code is refactored on purpose). It is intentionally not a CI gate: it is brittle to refactors.

## Known gaps
- No failing-before mutation yet for the UI-level findings (R10 wishlist, R11 locale, R13 filters, R20 overlays).
- E2E and smoke changes execute only in CI; they cannot run locally without live store credentials.
