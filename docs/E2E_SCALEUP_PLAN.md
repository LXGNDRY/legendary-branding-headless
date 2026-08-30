# Legendary Branding — E2E Plan: Scaling to a $50K–100K Caliber Hydrogen Storefront

**Baseline as of dev@343ae91 (2026-08-19):** Hydrogen + React Router + TypeScript, Onyx dark theme, 29 routes, 16 section components, Vitest (51/51) + Playwright E2E (9 golden journeys), GitHub Actions CI/CD to Oxygen. Real gaps flagged in `PRODUCTION_READINESS.md`: no verified real checkout/order test, unverified marketing/testimonial claims, incomplete release docs.

**Business model:** Legendary Branding is **premium DTG (direct-to-garment) print-on-demand only**. No wholesale, no bulk/reseller channel, no in-house manufacturing or factory ownership. Every content section below reflects this honestly — the premium story is print craft, quality control, and made-to-order philosophy, not vertical manufacturing.

**What "$50K–100K" actually buys at an agency:** strategic information architecture, brand-truth content, conversion infrastructure, accessibility/legal rigor, internationalization readiness, and a hardened operational pipeline — not more UI components. This plan targets that gap.

---

## Phase 0 — Content-Truth & Business Model Audit (blocking)

1. Audit every hardcoded marketing claim (testimonials, stat strips, badges, review counts) against real data.
2. Scan existing copy (footer, testimonials, editorial-band) for manufacturing/wholesale language that no longer matches the business model.
3. Confirm real production timelines, return policy, sizing methodology, and founding story — see `docs/BRAND_TRUTH.md`.
4. Confirm Klaviyo, Sentry, and pixel credentials are genuinely wired, not placeholder.
5. Deliverable: `docs/BRAND_TRUTH.md` is the single source of truth every new section must cite.

## Phase 1 — New Business & Brand Content Sections

| Section | Route | Purpose |
|---|---|---|
| About / Our Story | `/pages/about` | Founding story, mission, founder voice |
| Our Print Process | `/pages/print-process` | DTG craft transparency: full-color detail, ink durability, quality blanks, made-to-order philosophy |
| Made-to-Order / No Overproduction | within About or `/pages/sustainability` | Honest POD advantage: nothing printed until ordered, no dead stock |
| Size & Fit Guide | full page (expand `SizeGuideModal`) | Real measurement charts, fit philosophy |
| Press / Editorial Features | `/pages/press` | Only real placements; omit if none |
| Careers / Culture (optional) | `/pages/careers` | Only if actively hiring |
| FAQ | `/pages/faq` | Shipping, returns, sizing, payment, and what POD means for order timing |
| Community / Lookbook Hub | expand `journal.*` | Turn Journal into a real content engine |
| Contact / Support | `/pages/contact` | Real support channel and response-time expectation |

**Explicitly removed:** Wholesale/Partnership Inquiry page and any `WholesaleForm.tsx` component — does not fit the DTG POD model.

## Phase 2 — Homepage & Navigation Depth

1. Real mega-menu content strategy with category imagery and an About/Story entry point.
2. "Our Process" homepage module reinforcing DTG craft and made-to-order philosophy.
3. Real Judge.me review counts surfaced on PDP and homepage, not static copy.
4. Press/trust bar only once Phase 0 confirms real placements.

## Phase 3 — Commerce & Conversion Hardening

1. Run a real, verified checkout — test-mode purchase through Shopify Payments/Stripe, confirmed order in Admin, confirmed fulfillment email, confirmed Klaviyo trigger. Highest-risk unresolved item.
2. Set accurate POD production/fulfillment timing on PDP, cart, and confirmation — do not imply same-day fulfillment.
3. Verify abandoned cart / browse abandonment flows actually fire in Klaviyo.
4. Bundle/upsell logic on PDP and cart drawer — feasible in POD with no inventory risk.
5. Post-purchase flow sets correct POD timing expectations plus upsell/referral prompt.
6. Search relevance tuning in `api.search.ts`; add merchandised trending searches.
7. Wishlist → Klaviyo bridge, with "back in stock" language reframed for POD reality.

## Phase 4 — Trust, Legal & Accessibility Rigor

1. Full WCAG 2.1 AA pass: focus states, Onyx contrast, skip-links, form labeling, screen-reader checkout handoff.
2. Legal page completeness audit; confirm return policy language matches actual POD constraints.
3. Structured data (JSON-LD) for Product, BreadcrumbList, Organization, FAQPage.
4. Real cookie-consent and data-rights flow if selling internationally.

## Phase 5 — Internationalization & Markets Readiness (only if selling outside US)

1. Verify Shopify Markets configuration against Hydrogen's localization pattern.
2. Locale-aware routing if launching additional markets.
3. Currency/tax display accuracy per market; accurate international POD shipping windows.

## Phase 6 — Performance, Observability & Release Discipline

1. Core Web Vitals audit (LCP/CLS/INP) on the live Oxygen preview.
2. Confirm Sentry DSN is real and capturing errors.
3. Image pipeline audit: WebP/AVIF, responsive srcset, optimized hero assets.
4. Finish `docs/batch14-release-documentation` before treating this as shippable.
5. Formal rollback runbook: re-publish the current live Liquid theme if headless launch has a critical issue.

## Phase 7 — Domain Cutover Readiness (final gate)

- [ ] Real end-to-end order completed and verified in Shopify Admin
- [ ] All new content sections reviewed and approved (no fabricated manufacturing/wholesale claims)
- [ ] Copy audit confirms zero remaining wholesale/manufacturing references
- [ ] Full Playwright suite green on CI
- [ ] Accessibility pass complete
- [ ] SEO redirects mapped from old theme URLs
- [ ] Analytics/pixels confirmed firing on the new stack
- [ ] Rollback runbook tested

## Suggested Execution Order (branches)

1. `docs/brand-truth-audit` — Phase 0, blocking
2. `feat/about-and-print-process-pages` — Phase 1 core pages
3. `feat/faq-and-size-guide` — Phase 1 support/trust pages
4. `feat/homepage-brand-depth` — Phase 2
5. `fix/verified-checkout-e2e` — Phase 3, highest risk
6. `fix/pod-timing-accuracy` — Phase 3, fulfillment copy correction
7. `fix/a11y-and-legal-audit` — Phase 4
8. `chore/seo-structured-data` — Phase 4
9. `chore/performance-observability-baseline` — Phase 6
10. `docs/release-and-rollback-runbook` — Phase 6, gates Phase 7

Each branch follows the existing `/dev` → PR → CI (typecheck/lint/build/test/E2E) → review → merge pattern. No branch merges to `main` until Phase 7 is fully satisfied.
