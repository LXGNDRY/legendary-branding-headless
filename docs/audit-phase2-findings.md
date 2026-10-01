# Audit Phase 2 — Library Layer (`app/lib/`): Findings

Ref: `docs/full-site-audit-plan.md` Phase 2. Status legend: **Pass** / **Gap** / **Fixed**.

| File | Status | Detail |
|---|---|---|
| `session.ts` | Pass | Existing `session.test.ts` covers rotation and tamper rejection. No changes. |
| `cart.ts` | Pass | Existing `cart.test.ts` covers the discount/subtotal math (same class of bug fixed in PR #220). No changes. |
| `market.ts` | Pass | Existing `market.test.ts` covers country/currency/locale fallback. No changes. |
| `i18n.tsx` | Pass | Existing `i18n.test.ts` in place; full cross-catalog key-parity check deferred to Phase 3 (SEO/i18n), not duplicated here. |
| `context.ts` | Pass | Existing `context.test.ts` covers each required-var failure path individually. No changes. |
| `security.ts` | Pass | Existing `security.test.ts` asserts actual header values. No changes. |
| `cache.ts` | Pass | Existing `cache.test.ts` covers `CacheLong`/`CacheShort`/`CacheNone` TTL tiers. `htmlCacheHeaders`/`noCacheHeaders` are untested but trivial one-line header objects — left as-is, not worth the churn. |
| `rate-limit.ts` | **Fixed** | No test existed. Added `rate-limit.test.ts`: sliding-window allow/limit/reset behavior, per-key isolation, `getClientIP`'s header-precedence fallback chain (`cf-connecting-ip` → `x-forwarded-for` → `x-real-ip` → UA hash → `unknown`), and `rateLimitMiddleware`'s 429 response shape. Confirmed wired into all 5 user-input API routes (`api.chat`, `api.wishlist`, `api.search`, `api.waitlist`, `api.newsletter`). |
| `judgeme.ts` | **Fixed** | No test existed, despite being the file responsible for a real, previously-shipped production bug (Milestone 14's metafield-access gap) and carrying genuine branching logic (badge HTML parsing, rating/body-length filtering, reviewer-name masking with a deterministic fallback). Added `judgeme.test.ts`: `parseJudgemeBadge` edge cases (missing attrs, single- vs double-quoted HTML, zero-count rejection), and `fetchJudgemeQuotes` behavior via a mocked `fetch` (network/HTTP-error degradation to `[]`, rating/length filtering, full-name masking to "First L.", and the single-token-name fallback's determinism). |
| `nav.ts` | **Fixed** | No test existed for `resolveMenuCollections`, which drives the homepage's dynamically-sourced "Shop by Category" tiles (the exact logic verified by hand in an earlier session when confirming the homepage isn't hardcoded). Added `nav.test.ts`: menu-order preservation, non-`COLLECTION` item filtering, an unresolvable `resourceId` (unpublished/deleted collection), a `COLLECTION` item with no `resourceId`, and a `null` entry in the `nodes()` result (Shopify returns `null` for a missing id, not an omitted array slot). |
| `customer.ts` | **Fixed (removed)** | Both exports (`unwrapCustomerResponse`, an identity no-op; `hasCustomerAccount`, a type guard) had zero call sites anywhere in the app — confirmed via a full-repo grep. Every `account.*` route does its own inline `if (!customerAccount)` check instead of using this guard. Dead code per CLAUDE.md's "no dead code" rule; deleted rather than artificially wiring it in, since no behavior currently depends on it. |
| `sentry.server.ts` | Gap (acceptable) | Thin wrapper around the Sentry SDK (`initSentryServer`, `captureServerError`, `captureServerMessage`). Not unit-tested — would require mocking Sentry's SDK internals for low signal. Left untested; flagged here rather than silently assumed correct. |
| `monitoring.ts` | Gap (acceptable) | `captureError`/`captureMessage` thinly wrap Sentry; `useWebVitals` is a browser-only hook wiring the `web-vitals` library to Sentry + dev console logging (already verified `DEV`-gated in Phase 1). Same rationale as `sentry.server.ts` — not unit-tested, flagged as an accepted gap rather than assumed correct. |
| `fragments.ts` | Pass | Pure GraphQL query-string constants (`CART_QUERY_FRAGMENT`, `CART_MUTATE_FRAGMENT`) — no branching logic to unit test. Their correctness is exercised indirectly by `cart.test.ts` and the E2E cart journeys. |

## Summary
2 real gaps fixed with new test coverage (`rate-limit.ts`, `nav.ts`), 1 real dead-code removal (`customer.ts`), 1 file newly tested despite not being strictly "untested logic" but carrying real history of production bugs (`judgeme.ts`). 2 files (`sentry.server.ts`, `monitoring.ts`) are explicitly flagged as accepted, low-value-to-test SDK wrappers rather than silently passed. All 7 previously-tested files re-confirmed passing, no regressions. Full gate (`build && typecheck && lint && test`) green — test count went from 93 to 119.

Next: Phase 3 — SEO/schema layer gaps beyond the already-completed `productSchema` work.
