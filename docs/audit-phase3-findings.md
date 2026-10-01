# Audit Phase 3 — SEO/Schema Layer: Findings

Ref: `docs/full-site-audit-plan.md` Phase 3. Status legend: **Pass** / **Gap** / **Fixed**.

| # | Item | Status | Detail |
|---|---|---|---|
| 13 | www-canonical/real-data discipline on `organizationSchema`, `websiteSchema`, `faqPageSchema`, `articleSchema` | Pass | All already use the absolute `https://www.legendary-branding.com` origin (fixed in the earlier canonical-domain PR #251). No hardcoded placeholder data found. |
| 13 | Same discipline on `breadcrumbSchema`, `collectionPageSchema` | **Fixed** | Both accepted a site-relative path (`/`, `/journal`, `/products/x`, etc.) and emitted it verbatim into `item`/`url` fields that schema.org/Google's structured-data guidelines require to be **absolute** URLs — every one of the 6 call sites across the app had this defect. Added a shared `toAbsoluteUrl()` helper in `SeoSchema.tsx` used by both functions, so every call site is fixed at the source rather than needing 6 individual route edits. Added regression tests (`SeoSchema.test.ts`) covering relative-path resolution, already-absolute passthrough, and the no-`url` final-breadcrumb case. |
| 14 | `breadcrumbSchema`/`articleSchema` called from every route that should emit them | **Fixed** (1 gap found) | Confirmed present on `products.$handle`, `collections.$handle`, `collections._index`, `journal.$articleHandle`, `pages.$handle`, `policies.$handle`. **`journal._index` (the blog listing page) had none** — inconsistent with its sibling `collections._index`, which does. Added the same `breadcrumbSchema([{name: 'Home', url: '/'}, {name: 'Journal'}])` + `<JsonLd>` pattern. `search.tsx` correctly has no JSON-LD — it's `noindex, follow`, so structured data there would be wasted/ignored by crawlers anyway. |
| 15 | hreflang / locale-URL architectural gap | Pass (documented, not actioned) | Confirmed still accurate: the i18n system is client-side (`LocaleProvider`/`useTranslation`) on a single URL per page rather than locale-specific URL paths, so hreflang tags have no distinct URLs to point to. This remains a structural decision outside a quick-patch scope — not touched, per the standing note from the original SEO audit. |
| — | Locale catalog key parity (deferred from Phase 2) | Pass | Full key-by-key diff of all 8 `app/locales/*.json` catalogs against `en.json`: zero missing keys, zero extra keys, across the board. No action needed. |

## Summary
2 real, fixed gaps: a repo-wide BreadcrumbList/ItemList absolute-URL defect (schema.org/Google structured-data compliance — present in 100% of call sites, now fixed at the shared-helper source with regression tests), and a missing breadcrumb on the Journal listing page (inconsistent with its sibling Collections listing page). Everything else in Phase 3 passed as documented in the earlier SEO audit, with the i18n locale-catalog parity check now independently re-verified rather than assumed. Full gate (`build && typecheck && lint && test`) green; test count 119 → 123.

Next: Phase 4 — route-by-route functional audit (30 routes).
