# Launch Checklist — Legendary Branding Headless Storefront

Status legend: **✅ verified done** · **⚠️ implemented but unverified in the live environment** ·
**❌ not done**.

Translated directly from the "Current State Summary" table in
`docs/PRODUCTION_READINESS.md` §2, as of that document's 2026-08-18 audit (branch `dev` @
`e65c82f`). Nothing here is marked ✅ unless it was independently verified by file reads and/or a
passing local `typecheck`/`lint`/`build`/`test` run — not by assumption.

---

## Engineering Quality Gate

- [x] ✅ Build, typecheck, lint, and unit tests all pass on `dev` HEAD (`npm run
      typecheck`/`lint`/`build`/`test`; 51/51 tests at last audit).
- [x] ✅ CI quality gate runs build → typecheck → lint → test in the correct order (build before
      typecheck, required for React Router v7 type stub generation), gated before any deploy job.
- [x] ✅ Post-deploy smoke test exists in the deploy job, checking critical routes after deploy.
- [ ] ❌ Browser E2E coverage (Playwright) — no config/spec suite confirmed present at last audit;
      re-verify current state before relying on it (see `docs/DEPLOYMENT.md` §2 note).

## Observability & Security

- [x] ✅ Server-side error capture wired (`app/lib/sentry.server.ts`, called from `server.ts`).
- [x] ✅ Client-side error capture wired (`@sentry/react` in `app/lib/monitoring.ts`, called from
      `app/root.tsx`'s `ErrorBoundary`).
- [x] ✅ Web Vitals reporting uses the real `web-vitals` npm package (not a CDN stub).
- [ ] ⚠️ `PUBLIC_SENTRY_DSN` actually set in the live Oxygen environment — code path exists and
      degrades safely without it, but presence in the real environment is unverified. **Needs
      owner confirmation.**
- [x] ✅ CSP tightened — `unsafe-eval` removed from `app/lib/security.ts`.
- [ ] ❌ CSP still relies on `unsafe-inline` for scripts and styles — documented as a known,
      accepted limitation (nonce-based CSP deferred; see `docs/POST_LAUNCH_ROADMAP.md`).
- [x] ✅ Dependency updates automated via `.github/dependabot.yml` (npm + GitHub Actions, weekly).
- [x] ✅ Rate limiting added on newsletter/wishlist/search API routes (`app/lib/rate-limit.ts`).
- [ ] ❌ Rate limiting is per-Worker-instance only, not globally enforced across Oxygen's edge
      fleet — documented limitation, deferred (see `docs/POST_LAUNCH_ROADMAP.md`).

## Accessibility

- [x] ✅ Mobile menu focus trap fixed (`app/hooks/useFocusTrap.ts`, wired into `MobileMenu.tsx`).
- [ ] ❌ Size guide modal focus trap — `SizeGuideModal.tsx` does not use `useFocusTrap` at last
      audit; small, isolated fix, not yet done.

## SEO

- [x] ✅ JSON-LD (Product/Article/Collection/Breadcrumb) consolidated into shared generators in
      `SeoSchema.tsx`, used site-wide including breadcrumbs.
- [x] ✅ Meta/canonical/`og:image` coverage completed across all routes.
- [x] ✅ `robots.txt` uses the canonical `PUBLIC_CHECKOUT_DOMAIN`, matching `sitemap.xml`.
- [x] ✅ Favicon / PWA manifest — full icon set and `site.webmanifest` present.

## Commerce & Content Integrations

- [x] ✅ Newsletter signup wired to Klaviyo (`app/routes/api.newsletter.ts`,
      shared `NewsletterForm.tsx`).
- [ ] ⚠️ `PRIVATE_KLAVIYO_API_KEY` / `PUBLIC_KLAVIYO_LIST_ID` actually set in the live
      environment — without them the signup flow degrades to a simulated success. **Needs owner
      confirmation.**
- [x] ✅ Currency switcher resolved — dead/non-functional UI removed rather than half-wired.
- [ ] ❌ Multi-currency / multi-market is **not implemented** — `country: 'US'` is hardcoded in
      `app/lib/context.ts`; only single-market (US) pricing exists today.
- [x] ✅ Address CRUD (create/update/delete/set-default) wired against the Customer Account API,
      with a codegen-caught bug fix documented in `docs/phase6-codegen-changelog.md`.
- [x] ✅ Account profile edit added (`app/routes/account.edit.tsx`), fixing a prior dead link.
- [ ] ⚠️ Wishlist persistence (`app/routes/api.wishlist.ts` syncing to a Customer Account
      metafield) — not independently verified end-to-end (log in on one session, confirm
      persistence on another). **Needs manual verification before launch.**
- [x] ✅ GraphQL codegen is a real, blocking CI gate (`.graphqlrc.ts` fixed to route Customer
      Account documents to the correct schema).
- [x] ✅ Caching tiers (`CacheLong`/`CacheShort`/`CacheNone`) verified applied per-route — see
      `docs/ARCHITECTURE.md` §4 for the exact mapping.

## Legal / Compliance

- [x] ✅ CCPA "Do Not Sell" link fixed — points to the real
      `/pages/data-sharing-opt-out` Shopify page.
- [x] ✅ Consent banner gating bug fixed — no longer silently `return null`s when no analytics
      pixel IDs are configured.
- [ ] ⚠️ `PUBLIC_GA4_MEASUREMENT_ID` / `PUBLIC_META_PIXEL_ID` / `PUBLIC_TIKTOK_PIXEL_ID` actually
      set with real IDs in the live environment — see `docs/ANALYTICS.md` §4. **Needs owner
      confirmation.**

## Content Truth

- [ ] ❌ Orphaned content pages (`the-ultimate-streetwear-guide`,
      `oversized-hoodies-streetwear-the-piece-that-never-loses`) remain unlinked anywhere in
      `app/`. Not done.
- [ ] ❌ Content-truth audit not done — homepage testimonials and marquee claims ("Free Shipping
      Over $150", "Made to Order", "Authenticity Guaranteed", etc. in `_index.tsx`) have not been
      checked against actual Shopify shipping/policy configuration. **Needs owner input** on which
      claims are true and whether real testimonials exist to replace the current ones.

## Commerce Verification (Highest-Risk Open Item)

- [ ] ❌ **Real checkout / order verification — never done.** No evidence in the repo or session
      history of an actual test order being placed and confirmed in Shopify Admin (correct line
      items, variant, price, shipping, tax). This is the single largest remaining unknown before
      launch. **Needs owner decision**: Shopify test/dev-store bogus-gateway order, or an
      owner-authorized real low-value order.
- [ ] ❌ Variant/inventory edge cases (sold-out variant, invalid variant URL, rapid repeated
      add-to-cart) not yet covered by extended tests.

## International

- [ ] ❌ International market validation not done — `context.ts` hardcodes `country: 'US'`; no
      other market has been configured or tested. **Needs owner input** on which markets are
      actually live in Shopify Admin → Settings → Markets before this can even be scoped.

## Release Documentation (this batch)

- [x] ✅ `docs/ARCHITECTURE.md` created, grounded in direct file reads.
- [x] ✅ `docs/DEPLOYMENT.md` created, grounded in the actual workflow file.
- [x] ✅ `docs/ANALYTICS.md` created, grounded in `Analytics.tsx`.
- [x] ✅ `docs/LAUNCH_CHECKLIST.md` (this file) created.
- [x] ✅ `docs/POST_LAUNCH_ROADMAP.md` created.
- [ ] — `docs/URL_MIGRATION.md` intentionally **not created** — per
      `docs/PRODUCTION_READINESS.md` §4 item 4, whether a URL migration is even happening is an
      open owner question. Creating it now would be premature.

---

## Bottom Line

The engineering/hardening work (observability, security headers, SEO, caching, CI gate) is
substantially complete and verified. What blocks a genuine launch decision is **not** more
engineering polish — it's the owner-only decisions and verifications above: a real order has never
been confirmed end-to-end, content claims haven't been fact-checked, market scope is undefined, and
several integrations (Sentry, Klaviyo, analytics pixels, wishlist persistence) are implemented in
code but unverified in the live environment.
