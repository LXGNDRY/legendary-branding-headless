# Post-Launch Roadmap — Legendary Branding Headless Storefront

**None of the items below are required for launch.** They are explicitly deferred improvements,
called out separately so they don't get conflated with launch blockers in
`docs/LAUNCH_CHECKLIST.md`. Each item is grounded in a real, verified gap in the current codebase
— not aspirational feature ideas.

---

## 1. True Multi-Market / Multi-Currency Support

**Current state:** `app/lib/context.ts` hardcodes `i18n: {language: 'EN', country: 'US', ...}`.
A `currency` value can be set via a `?currency=` URL param or session, but the `country` remains
fixed to `'US'` regardless — so this does not amount to real market support (localized pricing,
duties/tax rules, market-specific inventory, or checkout in another market's currency).

**Deferred work:** configure real Shopify Markets, thread the selected market's country code
through `context.ts` instead of a hardcoded literal, and validate checkout end-to-end for each
market the owner decides to support (see the open question in `docs/PRODUCTION_READINESS.md` §4
item 3 — which markets are actually live is not yet known).

## 2. Personalization

Not implemented in any form today (no user-segment-aware content, no product recommendation
personalization beyond Shopify's own related-products data already used on the PDP). Scoping this
requires product/marketing input on what "personalization" should mean for this storefront before
any engineering starts.

## 3. A/B Testing

No experimentation framework exists in the codebase. Any future A/B testing (homepage layout,
pricing display, CTA copy) would need its own infrastructure decision (e.g., an edge-based bucket
assignment in the Worker, or a third-party experimentation platform) — out of scope for this
release.

## 4. Automated Rollback

**Current state**, per `docs/DEPLOYMENT.md` §4: rollback is entirely manual (`git revert` + push,
or a manual `npx shopify hydrogen deploy` from an older commit, always with explicit human
approval). There is no automatic revert on a failed post-deploy smoke test, and no deployment
history/pinning mechanism beyond what the Shopify Partners dashboard shows.

**Deferred work:** a rollback job that, on smoke-test failure, automatically redeploys the last
known-good commit's build rather than requiring a human to notice and act.

## 5. Nonce-Based CSP (removing `unsafe-inline`)

**Current state:** `app/lib/security.ts`'s `Content-Security-Policy` includes `'unsafe-inline'` for
both `script-src` and `style-src`, documented in the source as needed for the current
React-hydration + inline-script-preloading + Tailwind approach. `unsafe-eval` has already been
removed, but `unsafe-inline` remains a real (if commonly accepted) CSP weakening.

**Deferred work:** move to a nonce- or hash-based CSP, which requires auditing every inline
`<script>`/`<style>` emission point in the React Router SSR pipeline and Tailwind's runtime output
— a larger, cross-cutting change appropriately deferred past initial launch.

## 6. Globally-Enforced Rate Limiting

**Current state:** `app/lib/rate-limit.ts` is an in-memory sliding-window limiter scoped to a
single Worker isolate, applied to `api.newsletter.ts`, `api.search.ts`, `api.wishlist.ts`. It
explicitly does not enforce a limit across Oxygen's whole edge fleet — a client can exceed the
nominal per-route limit by hitting different edge instances.

**Deferred work:** move to an edge-shared store (e.g., Cloudflare KV/Durable Objects, or a
dedicated rate-limiting service) so the limit is enforced globally rather than per-instance.

## 7. Browser E2E Coverage Expansion

A Playwright job (`e2e` in the CI workflow) exists and runs against a local production preview
build, but per `docs/PRODUCTION_READINESS.md` §2 the actual spec coverage was still being built out
as of the last audit (the owner's nine golden customer journeys, listed in
`docs/PRODUCTION_READINESS.md` §3 Batch 9/12, are the target set). Confirming full coverage of all
nine journeys — including international checkout, deferred pending market scope in item 1 above —
is post-launch follow-up work, not a hard blocker if the core golden path (homepage → product →
cart → checkout redirect) is covered.

## 8. Real Purchase / Add-to-Cart Event Tracking

Per `docs/ANALYTICS.md`, only consent-gated page-view tracking exists today across GA4, Meta
Pixel, and TikTok Pixel — no `add_to_cart`, `begin_checkout`, or `purchase` events are fired
anywhere in the codebase, and no Shopify `Analytics.Provider` or server-side conversions API
integration exists. Building real funnel/conversion tracking is deferred, and should be scoped only
once the real-order-verification blocker in `docs/LAUNCH_CHECKLIST.md` is resolved (there's little
value instrumenting purchase events before a real purchase has even been confirmed to work).
