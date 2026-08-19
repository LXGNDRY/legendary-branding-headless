# Legendary Branding Headless — Production Readiness & Release Plan

**Status as of:** 2026-08-19 · **Branch:** `dev` (post PR #47)
**Dark theme (Onyx):** merged to `dev`.
**Owner approval required at:** every PR → `dev`, and the final `dev → main` release gate.

This document is the operational plan for taking this repository from its current state to a commercially operational storefront capable of accepting real Shopify orders. It refines the governance framework the owner provided into a plan grounded in what has **actually been verified in this codebase**, not assumed.

---

## 1. Non-Negotiable Rules (condensed from owner governance doc)

1. **Never** implement feature work directly on `dev` or `main`.
2. **Never** merge a PR without explicit owner approval — a green CI run is not approval.
3. **Never** deploy to production without explicit owner approval.
4. Work in **vertical slices**: one coherent, testable capability per branch → PR → review → merge. No five-slices-at-once, no half-finished functionality left behind.
5. Every slice: branch → implement → test → document → commit → push → verify remote → PR → **stop**.
6. After merge: fetch, verify remote `dev`, re-run the relevant regression before starting the next slice.
7. No fabricated content — testimonials, shipping claims, GSM figures, "free shipping" thresholds, etc. must be verifiable against actual Shopify store configuration or removed.
8. Customer-specific data must never be publicly cached.

**Process note for the owner:** in the current session, PRs opened against `dev` have been merged within seconds of being opened (by an external process, not by the assistant). If the intent is a hard human-review gate on every PR per rule 2, that needs to be enforced outside this tool (branch protection requiring a review, or a person explicitly holding merges) — the assistant will continue to open PRs and stop, but cannot prevent another actor from merging them.

---

## 2. Current State Summary (verified, not assumed)

An audit (3 parallel codebase sweeps + manual verification) plus multiple autonomous hardening passes have already landed on `dev`. This is materially further along than a fresh Batch-0 audit would assume. Verified via direct file reads, `grep`, and running `typecheck`/`lint`/`build`/`test` locally against `dev` HEAD:

| Area | State | Evidence |
|---|---|---|
| Build/typecheck/lint/test | ✅ Green | `npm run typecheck`, `lint`, `build`, `test` (51/51) all pass on `dev` HEAD |
| CI quality gate | ✅ Correct order | `.github/workflows/oxygen-deployment-1000167667.yml`: build → typecheck → lint → test, deploy gated on quality passing on push to `main`/`dev` only |
| Post-deploy smoke test | ✅ Added | Same workflow, curls the deployed URL for critical routes after `Deploy to Oxygen` |
| Server error monitoring | ✅ Wired | `app/lib/sentry.server.ts` (hand-rolled Workers-compatible envelope sender) called from `server.ts`'s catch block |
| Client error monitoring | ✅ Wired | `@sentry/react` in `app/lib/monitoring.ts`, `captureError` called from `app/root.tsx` ErrorBoundary |
| Web vitals | ✅ Real package | `web-vitals` npm dependency (was a CDN-script stub) |
| CSP | ✅ Tightened | `unsafe-eval` removed from `app/lib/security.ts`; `unsafe-inline` remains (documented, needed for current hydration approach) |
| Dependency updates | ✅ Automated | `.github/dependabot.yml` — npm + GitHub Actions, weekly |
| Route/loader test coverage | ✅ Started | `app/__tests__/routes/` — `_index`, `collections.$handle`, `products.$handle`, `search` |
| Browser E2E coverage | ✅ Done | Playwright configured (`playwright.config.ts`), `test:e2e` script, CI `e2e` job runs against a local production build (live Oxygen preview bot-checks automated browsers, so E2E targets `shopify hydrogen preview` locally instead — see PR #44) |
| Mobile menu focus trap | ✅ Fixed | `app/hooks/useFocusTrap.ts`, wired into `MobileMenu.tsx` |
| Size guide modal focus trap | ✅ Fixed | `SizeGuideModal.tsx` already uses `useFocusTrap` (verified 2026-08-19) — doc previously understated this |
| JSON-LD (Product/Article/Collection/Breadcrumb) | ✅ Consolidated | Shared generators in `SeoSchema.tsx` now used everywhere; breadcrumbs added site-wide |
| Meta/canonical/og:image coverage | ✅ Completed | All routes upgraded per `docs/phase5-changelog.md` §5.2 |
| robots.txt canonical domain | ✅ Fixed | Uses `PUBLIC_CHECKOUT_DOMAIN`, matches sitemap.xml |
| Favicon / PWA manifest | ✅ Full set | `public/favicon-{16,32}.png`, `apple-touch-icon.png`, `icon-{192,512}.png`, `site.webmanifest` |
| Newsletter → Klaviyo | ✅ Wired | `app/routes/api.newsletter.ts`, shared `NewsletterForm.tsx`; **requires `PRIVATE_KLAVIYO_API_KEY` + `PUBLIC_KLAVIYO_LIST_ID` to be set in the real environment** — currently degrades to simulated success without them |
| Currency switcher | ✅ Resolved | Dead/non-functional component removed rather than half-wired; country still hardcoded `'US'` in `context.ts` — **multi-currency is not implemented**, only single-market pricing |
| Address CRUD | ✅ Wired | `account.addresses.tsx` full create/update/delete/set-default against Customer Account API, with a **codegen-caught bug fix** (wrong input types/arg names — see `docs/phase6-codegen-changelog.md`) |
| Account profile edit | ✅ Added | `app/routes/account.edit.tsx`, fixes prior dead `/account/edit` link |
| Wishlist persistence | Needs verification | `docs/phase6-codegen-changelog.md` references `app/routes/api.wishlist.ts` syncing to a Customer Account metafield — **not yet independently verified working end-to-end in this doc's audit; treat as unverified until Slice 0.2** |
| Real GraphQL codegen | ✅ Real gate now | `.graphqlrc.ts` fixed to route Customer Account documents to the correct schema; codegen validates in CI, not `continue-on-error` |
| Performance (LCP hints, caching tiers) | ✅ Done | Preconnect hints, `fetchPriority="high"` on hero image, 3-tier cache strategy verified applied per-route (`docs/phase7-10-hardening-changelog.md`) |
| Rate limiting | ✅ Added | In-memory sliding window on newsletter/wishlist/search API routes — **documented limitation: per-Worker-instance only, not globally enforced across Oxygen's edge fleet** |
| 404 / error pages | ✅ Branded | Distinguishes 404 vs 500, route-level PDP error boundary |
| CCPA "Do Not Sell" link | ✅ Fixed (this session) | Points to the real `/pages/data-sharing-opt-out` Shopify page |
| Consent banner gating bug | ✅ Fixed (this session) | No longer silently `return null`s when no analytics pixel IDs are configured |
| Orphaned content pages | ✅ Fixed | Both linked in `Footer.tsx`'s Company column ("Streetwear Guide", "Oversized Hoodie Guide") — verified 2026-08-19 |
| Content-truth audit (testimonials, shipping claims) | ❌ Not done | Homepage testimonials (`_index.tsx`) and marquee claims ("Free Shipping Over $150", "Made to Order", "Authenticity Guaranteed") have not been checked against actual Shopify configuration/policy |
| Real checkout / order verification | ❌ **Never done** | No evidence anywhere in the repo or session history of an actual test order being placed and verified in Shopify Admin. This is the single largest remaining unknown. |
| International market validation | ❌ Not done | `context.ts` hardcodes `country: 'US'` — no other market has been configured or tested |
| Production docs (`ARCHITECTURE.md`, `DEPLOYMENT.md`, `ANALYTICS.md`, `URL_MIGRATION.md`, `LAUNCH_CHECKLIST.md`, `POST_LAUNCH_ROADMAP.md`) | ❌ Not created | Only changelogs and a theme design-system doc exist under `docs/` |
| Sentry DSN actually configured | ⚠️ Unverified | Code path exists; whether `PUBLIC_SENTRY_DSN` is actually set in the real Oxygen environment has not been confirmed |

**Bottom line:** the engineering/hardening work (Batches 5–10 in the owner's numbering: homepage/nav polish groundwork, SEO, analytics/observability, performance, accessibility, security) is substantially complete. The dark theme transformation (Onyx design system) is complete on the `theme-update` branch and ready for PR review. What remains is almost entirely in **Batch 1 (commerce foundation — never actually verified against a real order)**, **content truth**, **E2E test coverage**, **a11y completeness**, and **release documentation/process**. The plan below reorders remaining work accordingly.

---

## 3. Remaining Work — Batches, Re-Sequenced by What's Actually Left

Batches already substantially complete (2, 5 partial, 7, 8, 9, 10 partial) are **not repeated** below except for their specific open items. Batch numbers are kept aligned to the owner's original numbering for traceability.

### BATCH 1 — Commerce Foundation Verification (P0, do first)

This is the highest-risk gap: **no one has confirmed a real Shopify order can be placed end-to-end through this storefront.** Everything else is secondary if this doesn't work.

**Slice 1.1 — Golden Purchase Path, single market (US)**
- Scope: manual, owner-supervised test purchase. Homepage → product → variant selection → add to cart → cart review → checkout redirect → Shopify-hosted checkout → real or Shopify test payment method → order confirmation.
- Acceptance criteria: an order actually appears in Shopify Admin with correct line items, variant, price, and shipping/tax as configured in Shopify.
- This slice cannot be done by an agent alone — it requires either a Shopify test/dev store bogus-gateway order, or the owner authorizing a real low-value order. **Needs owner input on which.**

**Slice 1.2 — Variant/inventory edge cases**
- Sold-out variant, unavailable product, direct URL to an invalid variant, browser back/forward after variant change, rapid repeated add-to-cart clicks.
- Extends the existing `app/__tests__/routes/products.$handle.test.ts` with these cases; add Playwright coverage (Batch 12) for the interactive parts unit tests can't reach.

**Slice 1.3 — Wishlist persistence verification**
- `docs/phase6-codegen-changelog.md` claims a Customer Account metafield sync exists (`api.wishlist.ts`). Independently verify: log in as a test customer, add to wishlist, log out/in on a different session, confirm persistence. If it doesn't work as documented, fix or downgrade the claim.

### BATCH 5 (remainder) — Homepage & Content Truth (P0/P1)

**Slice 5.1 — Content-truth audit**
- Audit every public claim against actual Shopify configuration: "Free Shipping Over $150" (marquee, `_index.tsx`; note: the $150 figure was made internally consistent site-wide in PR #47, but still needs to be checked against Shopify's actual shipping settings), "Made to Order," "Worldwide Shipping," "Authenticity Guaranteed," "New Drops Every Friday," the three hardcoded testimonials (name/location/quote) in `_index.tsx`.
- For each: verify against Shopify shipping settings/policies, or remove/rewrite as generic non-committal copy, or replace fabricated testimonials with real ones the owner supplies (or remove the section).
- **Needs owner input**: which claims are actually true, and whether real customer testimonials exist to substitute.

~~**Slice 5.2 — Link orphaned pages**~~ ✅ Done — both pages already linked in `Footer.tsx`'s Company column.

### BATCH 6 (remainder) — SizeGuideModal Accessibility (P1)
~~Apply the same `useFocusTrap` hook already used in `MobileMenu.tsx` to `SizeGuideModal.tsx`.~~ ✅ Already done — `SizeGuideModal.tsx` uses `useFocusTrap`.

### BATCH 9/12 — E2E Test Coverage (P0 for release confidence) — ✅ Done

Playwright is set up (`playwright.config.ts`, `test:e2e` script, CI `e2e` job) and the 9 golden-journey specs from the owner's §31 list are implemented in `e2e/golden-journeys.spec.ts` and passing in CI. E2E runs against a locally-served production build rather than the live Oxygen preview URL, because Shopify's `*.myshopify.dev` bot-check intercepts automated Chromium the same way it intercepts curl (see PR #44's description for the full root-cause writeup).

International checkout (journey 6 in the owner's list) is deferred to Batch 13 pending market configuration (see below).

### BATCH 13 — International Commerce (P1, needs Shopify Admin access)
- This cannot be verified from the codebase alone — it requires checking which markets are actually enabled in Shopify Admin (Settings → Markets), not assuming the owner's example list (US/CA/UK/MX/BR/CO/CL/AR) are all live.
- **Needs owner input**: which markets are actually configured for checkout today. Once known, either (a) confirm `country: 'US'` hardcoding in `context.ts` is intentional (single-market launch) and document it as a known limitation, or (b) scope real multi-market work as a post-launch slice.

### BATCH 14 — Release Documentation (P0, blocks release candidate)

Per the owner's §5, these don't exist yet and must be created from actual implementation (not aspirational):
- `/docs/ARCHITECTURE.md` — route map, data flow, Storefront/Customer Account API usage, caching tiers, Sentry/rate-limit layers
- `/docs/DEPLOYMENT.md` — the CI/CD flow already documented in `CLAUDE.md`, extracted and expanded with the smoke-test step and rollback procedure (rollback is currently manual — redeploy an older commit)
- `/docs/ANALYTICS.md` — GA4/Meta/TikTok event map, consent behavior, what's verified vs. assumed
- `/docs/URL_MIGRATION.md` — only needed if this replaces an existing live storefront with different URLs; **needs owner input** on whether a URL migration is actually happening or this is a net-new headless launch
- `/docs/LAUNCH_CHECKLIST.md` — the release audit from owner §39, filled in with real verification results, not blank checkboxes
- `/docs/POST_LAUNCH_ROADMAP.md` — advanced recommendations, personalization, multi-market expansion, A/B testing — explicitly deferred, not forgotten

---

## 4. Explicitly Deferred / Needs Owner Decision Before Scoping

These came up during verification and need an owner answer before a slice can be scoped:

1. **Real order testing approach** — Shopify test-mode order, or a real low-value production order? (Batch 1, Slice 1.1)
2. **Content-truth claims** — which marketing claims are true, and are there real testimonials to use? (Batch 5, Slice 5.1)
3. **Market scope** — which countries are actually configured at checkout today vs. aspirational? (Batch 13)
4. **URL migration** — is this replacing a live storefront (needs redirect mapping) or a net-new launch? (Batch 14)
5. **Sentry DSN** — confirm `PUBLIC_SENTRY_DSN` is actually set in the Oxygen environment, not just wired in code.
6. **Klaviyo credentials** — confirm `PRIVATE_KLAVIYO_API_KEY`/`PUBLIC_KLAVIYO_LIST_ID` are set, or newsletter signups are silently no-op'ing in production right now.

---

## 5. Immediate Next Slice

All previously-identified small, zero-ambiguity, agent-executable slices (SizeGuideModal focus trap, orphaned-page linking, Playwright E2E setup) are now done. Everything genuinely remaining in Batches 1, 5.1, 13, and 14 requires owner input (Shopify Admin access, a real/test order, content/testimonial truth decisions, market scope) before it can be scoped into a slice — see §4. Batch 14 (release docs: `ARCHITECTURE.md`, `DEPLOYMENT.md`, `ANALYTICS.md`, `LAUNCH_CHECKLIST.md`, `POST_LAUNCH_ROADMAP.md`) is the one area that can mostly be drafted from the current codebase without owner input, so it's the best next slice to pick up while awaiting answers to §4.

---

## 6. Definition of Done (unchanged from owner's governance doc, restated for traceability)

The project is complete when a real customer can discover, browse, search, select a variant/size, add to cart, checkout, pay, and receive a confirmed order — verified against an actual Shopify order, not just a checkout URL opening. Plus: SEO crawlable and accurate, analytics/purchase tracking verified against real orders, Sentry actionable in production, mobile-performant, accessible, secure, internationally accurate for whichever markets are actually live, fully documented, and explicitly owner-approved at both the `dev` PR gate and the final `dev → main` release gate.
