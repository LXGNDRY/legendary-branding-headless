# Dev Baseline Audit

**Audit date:** 2026-08-21  
**Branch:** `dev`  
**Baseline commit:** `3f39be784a09ab950a9f8b9030dc8108d63c8a1e`  
**Relationship to `main`:** 69 commits ahead, 0 behind

This document freezes the evidence used to begin the production-hardening
program. A capability is marked verified only when the implementation was read
and the applicable local check completed successfully. Live Shopify and Oxygen
configuration is not inferred from repository code.

## Local quality results

| Gate | Result | Evidence |
|---|---|---|
| Dependency install | Pass | `npm ci --legacy-peer-deps` completed using an isolated writable npm cache |
| TypeScript | Pass | `npm run typecheck` / `tsc --noEmit` exited 0 |
| ESLint | Pass | `eslint .` exited 0 |
| Unit and route tests | Pass | 9 files, 54 tests passed |
| Production build | Pass with warnings | Client and Oxygen server bundles built successfully |
| GraphQL codegen | Environment-blocked locally | Requires Shopify schema access/credentials; remains a required CI gate |
| Browser E2E | Not accepted as a release proof | Existing suite does not complete an add-to-cart-to-checkout journey and CI only runs Chromium |

The production build emitted React Router v8 future-behavior warnings. They are
not current build failures, but must be resolved before a framework-major
upgrade.

## Verified strengths

- Hydrogen/React Router application builds successfully.
- Storefront, cart, account, search, journal, policy, sitemap and robots routes exist.
- Server and client error-monitoring paths are implemented.
- Cookie sessions use HTTP-only, SameSite and production Secure attributes.
- Security headers are applied to application responses.
- Unit and route tests are green at the baseline commit.
- Playwright infrastructure and a local production-preview test server exist.
- `dev` contains the full current work and is not behind `main`.

## Release blockers

1. `dev` is not protected and has no enforced required checks or review gate.
2. The latest `dev` commit has no reported combined commit statuses.
3. The E2E suite does not prove variant selection, cart mutation or checkout handoff.
4. Newsletter submission may report success without durable Klaviyo capture.
5. Exact `/cart`, `/search` and `/account` routes are not reliably covered by the trailing-slash robots rules.
6. `/search` is included in the sitemap despite being a non-canonical result surface.
7. Sitemap queries stop at the first 250 products/collections and first 100 pages.
8. Public `/docs` routes expose and encourage indexing of internal engineering material.
9. The `currency` query parameter is accepted and persisted without allowlist validation.
10. Live Oxygen secrets, Customer Account configuration, analytics, Sentry, Klaviyo and checkout behavior remain unverified.
11. No repository evidence proves a completed Shopify test order, refund and cancellation.

## Evidence policy

- Documentation is not proof of live configuration.
- A skipped, expected-failure or bot-check-intercepted E2E test is not a release pass.
- A checkout link rendering is not proof that an order can be completed.
- Environment-dependent capabilities remain unverified until exercised against
  the intended Shopify/Oxygen environment.

## Next slice

Establish enforceable repository governance for `dev` and `main`, then make CI
status checks authoritative before expanding feature work.
