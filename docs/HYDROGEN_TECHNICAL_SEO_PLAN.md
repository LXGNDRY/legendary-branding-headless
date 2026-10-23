# Hydrogen technical SEO correction plan

Status: EXECUTING — code slices target dev only; no production promotion or Shopify configuration changes authorized by this plan.
Date: 2026-10-23 (America/Chicago).
Repository baseline reviewed: `ec9d2c6669483d1938e51efca409caa4da1aebfa` on `dev`.
Owner decision: the domain arrangement below is intentional. Preserve it. The owner assigned execution to Codex in verified slices to dev. Execution evidence: [SEO_EXECUTION.md](SEO_EXECUTION.md).
Execution: read `CLAUDE.md` and this plan before implementation. This is a focused follow-up to the recovery plan, not a claim that its other tasks are closed.

## 1. Target contract

| Surface | Required role |
|---|---|
| https://legendary-branding.com | Public Hydrogen storefront; the only canonical origin for its indexable pages |
| https://www.legendary-branding.com | Shopify Online Store primary domain; published redirect theme forwards ordinary storefront visits to non-www; checkout and Shopify system routes remain available |
| lngndny.myshopify.com | Shopify internal/API identity, not a public SEO origin |
| Oxygen development/preview hosts | Non-indexable; canonical references, when present, point to the public non-www equivalent |
| Checkout | Use the actual Shopify-generated checkout destination; verify www behavior with a cart before configuring consent/checkout variables. Do not invent a checkout subdomain |

Shopify explicitly documents a Hydrogen domain alongside a separate Online Store subdomain and its client-side redirect theme [S1]. Here, www is the intentional Online Store subdomain. A domain's Online Store primary status does not make it Hydrogen's SEO origin.

Use one approved, stable public-origin constant in app/lib/site.ts. Do not derive canonicals from arbitrary Host headers, checkout URLs, or myshopifyDomain. A single intentional technical configuration value is appropriate; this task does not introduce hardcoded product or marketing claims. PUBLIC_STORE_DOMAIN remains the Shopify API domain. PUBLIC_CHECKOUT_DOMAIN must reflect the verified checkout/consent setup, independently of SITE_ORIGIN.

## 2. Evidence and limits

Live HTTP checks on October 23, plus Shopify Admin read-only queries, showed:

| Observation | Evidence |
|---|---|
| Online Store primary is now www | shop.primaryDomain.host and shop.url returned www.legendary-branding.com; myshopifyDomain remained lngndny.myshopify.com |
| Non-www homepage and tested PDP serve Hydrogen | HTTP 200, real title/content, no observed noindex |
| Www homepage and same PDP serve the redirect theme | HTTP 200, canonical to non-www, meta robots noindex, window.location.replace |
| Redirect theme target is non-www | Published hydrogen-redirect-theme-main config/settings_data.json: storefront_hostname = legendary-branding.com |
| Hydrogen canonicals incorrectly point to www | Homepage and /products/marque-legendaire-camo-t-shirt-240gsm |
| Hydrogen sitemap points to www | /sitemap.xml loc values, including home, collections, journal and products |
| Hydrogen robots advertises www sitemap | /robots.txt Sitemap line |
| Old blog addresses are missing | /blogs/legendary_blogging and three tested historic article/localized addresses returned 404 during the preceding investigation |
| Checkout subdomain root returned 503 | This does NOT prove real checkout is broken; no actual cart checkout was verified |
| Search Console access blocked | Connected GSC Wizard subscription expired; Google-selected canonicals, indexing totals and rankings were not retrieved |

Code confirms SITE_ORIGIN is currently https://www.legendary-branding.com. docs/PUBLIC_URLS.md records that same stale contract. Shared URL helpers feed metadata, JSON-LD, robots and sitemap. Product and collection meta exports currently build titles/descriptions from resource fields rather than consistently honoring Shopify SEO overrides. These are code observations, not an assertion that every live route was crawled.

Earlier domain checks had different results. The current contract above supersedes the earlier www-as-Hydrogen recommendation. Do not redirect the theme back to www under this arrangement: it would target its own host.

Google advises consistent canonicalization signals [S3]. The observed cross-host canonical/noindex arrangement is a confirmed technical defect. Its precise contribution to lost traffic is unmeasured.

## 3. Priority and dependencies

| ID | Priority | Work package | Depends on | Owner |
|---|---|---|---|---|
| SEO-00 | P0 | Capture fresh baseline and URL inventory | None | Implementing agent |
| SEO-01 | P0 | Correct the shared public origin | SEO-00 | Implementing agent |
| SEO-02 | P0 | Sitemap and robots consistency | SEO-01 | Implementing agent |
| SEO-03 | P0 | Restore historical URL continuity | SEO-00; release with SEO-01 | Implementing agent; content owner for ambiguous mappings |
| SEO-04 | P0 verification | Verify redirect theme, checkout and consent boundary | SEO-00 | Agent read-only; merchant for any protected configuration |
| SEO-05 | P1 | Server-rendered metadata and structured data | SEO-01 | Implementing agent |
| SEO-06 | P1 | Query parameters, crawl paths and pagination | SEO-01 | Implementing agent |
| SEO-07 | P1 | Localized URL continuity and future locale contract | SEO-03 | Agent; owner decides new locale URL architecture |
| SEO-08 | P1 | Feeds, indexing submission and measurement | SEO-01–07 as applicable | Agent where connected; merchant/platform owner otherwise |
| SEO-09 | P0 release gate | Full verification, evidence and regression checks | All release-scoped packages | Implementing agent |

Each package follows TPS: observe the actual response, record a failing acceptance case, fix the owning contract, verify, then standardize the regression check. Do not expand this into a framework upgrade or blanket rewrite.

## 4. Implementation packages

### SEO-00 — Baseline and inventory

Record source SHA, deployed release SHA, runtime host, HTTP status/Location, raw HTML canonical/meta robots/og:url, X-Robots-Tag and JSON-LD URLs. Use raw HTTP without JavaScript AND browser navigation. Inspect home, PDP, collection, journal index/article, ordinary page, policy, private routes, nonexistent route and preview.

Build a URL inventory from current Hydrogen sitemap, Shopify Online Store sitemap, historical landing pages, known legacy blog routes, and available Search Console/merchant feeds. Include source, destination, locale, response and mapping confidence. Label unavailable sources; never declare the inventory exhaustive without them. Exclude customer/order/account identifiers and tokens from evidence.

Acceptance: a reproducible baseline matrix exists, with the current canonical mismatch captured as a failing check.

### SEO-01 — One correct public origin

Primary file: app/lib/site.ts; consumers: app/root.tsx, app/routes/*.tsx and app/components/seo/SeoSchema.tsx.
Set SITE_ORIGIN to https://legendary-branding.com. Review every consumer and update docs/PUBLIC_URLS.md and relevant fixtures. Audit any remaining literal www, myshopify, request-origin or checkout-origin URLs that enter SEO outputs. Keep legitimate CDN, social, API and checkout URLs intact.

Review absoluteUrl(): it currently accepts arbitrary absolute HTTPS origins. For canonical/site-identity callers, prevent a Shopify Online Store URL or untrusted host from escaping the public-origin contract. Do not rewrite external images/social URLs through a site URL helper. Define separate typed responsibilities if necessary.

Acceptance: all tested indexable Hydrogen pages have exactly one absolute non-www canonical in the initial HTML head; matching og:url and site-owned JSON-LD identifiers; no query/fragment except explicitly approved pagination rules. No SEO origin comes from PUBLIC_CHECKOUT_DOMAIN. Tests use explicit expected non-www values, not just the same imported constant as the implementation.

### SEO-02 — Discovery and index controls

Files: app/routes/[sitemap.xml].tsx, app/routes/[robots.txt].ts, app/lib/sitemap.ts, app/lib/robots.ts and their tests.

Publish only non-www, canonical, public, successful URLs in Hydrogen's sitemap. Check every emitted URL with bounded concurrency; record status, indexability and canonical equality. Exclude redirect aliases, private/error pages and filter combinations. Keep XML escaping, actual pagination through Storefront connections and accurate dates. Reject truncated inventories when safety limits are reached instead of silently treating partial output as complete. Split at protocol limits (50,000 URLs or 50 MB uncompressed), if needed [S6].

Robots must advertise https://legendary-branding.com/sitemap.xml. Keep public products, collections, articles, pages, images and rendering assets crawlable. Preserve owner-approved AI crawler policy. Keep preview protection; review host normalization/ports and known preview aliases so a new preview hostname cannot silently become indexable.

Robots disallow is a crawl control, not reliable removal from Google's index. A blocked crawler may not see noindex. For already indexed unwanted URLs, plan crawlable noindex/redirect handling first, then crawl restrictions where appropriate [S9].

Acceptance: zero www loc values or sitemap pointers on Hydrogen; zero emitted URL failures; public HTML has no blocking robots directive; private pages remain noindex and uncacheable; preview responses remain noindex and do not compete with production. Disallow alone must not be reported as proof of deindexing.

### SEO-03 — Historical URLs and permanent redirects

Files: server.ts (existing storefrontRedirect fallback), journal routes, pages/policies routes and route tests. Choose one auditable owner for explicit legacy mappings; do not add competing redirect engines unnecessarily.

Map /blogs/legendary_blogging to /journal and each known old article to its actual /journal/:handle equivalent. Verify the article exists before creating the redirect. Preserve case, encoding and safe attribution parameters deliberately. Test changed product/collection handles, /collections/all and historic /pages aliases using the inventory. Return 404/410 for permanently absent content without a meaningful replacement; do not send every missing page to home.

Hydrogen-controlled legacy paths should use 301/308 directly to the final non-www content. Existing Shopify Admin redirects must continue to work; agent code changes must not mutate Admin settings. Resolve collisions when two blogs share article handles before flattening paths.

Acceptance: every inventoried high-value historic URL has a verified 200 destination via its approved mapping, or a documented intentional removal; no loops, open redirects, homepage dumping or accidental query loss. Target one Hydrogen-side hop. Keep useful redirects at least one year [S4].

### SEO-04 — Www bridge and checkout boundary

Read-only verification first. Shopify supplies the client-side redirect theme [S1]; Google prefers server-side redirects where available [S5]. These are different platform constraints, not a reason to move the intentional domain targets.

Verify www storefront pages redirect in a real browser to the corresponding non-www route with safe path/query preservation. Test accounts, discount links, challenge/checkpoint, Shopify app proxies and checkout separately. A root 200 from a redirect theme is not an HTTP 301. Its current noindex may cause Google to skip JavaScript rendering [S7], so record that the bridge is a weaker migration signal; Hydrogen discovery must stand independently.

Do not claim full search-signal transfer through this bridge. Do not remove noindex, modify the live Liquid theme, intercept checkout, or add blanket www redirects as part of the Hydrogen patch. Any bridge enhancement is a separately reviewed, platform-supported change; preserve Shopify checkout/system exemptions and remain within repository constraints.

Verify an actual Shopify-generated checkout URL using a designated test cart, without submitting an order. Compare its host with runtime PUBLIC_CHECKOUT_DOMAIN and consent cookie scope. Current observed runtime checkoutDomain is non-www, which requires investigation under the new split. Correcting an application variable is a separate task from changing Shopify checkout settings.

Acceptance: browser bridge reaches the intended Hydrogen resource; no loop or checkout interception; checkout destination and consent continuity have captured evidence. An unavailable checkout test remains an open release blocker for any checkout-domain variable change.

### SEO-05 — Metadata and structured data

Use Shopify product/collection SEO title and description when provided; use genuine resource content as fallback. Check generated types and run codegen if GraphQL selections change. Ensure titles, descriptions, canonical, social metadata, heading and primary content exist without client interaction [S2].

Audit product offers, availability, currency, SKU/variant association, image URLs, reviews and merchant-policy claims against rendered Shopify-backed content. Site identity, breadcrumb, product and article URLs use non-www. Evaluate ProductGroup/variant markup against the actual UI and Google's requirements rather than merely adding schema fields [S10]. The query-free product canonical can coexist with functional variant selection URLs. Never strip variant selectors from transactional/feed landing URLs just to make the canonical clean.

Acceptance: raw HTML and hydrated document agree; exactly one canonical; safely serialized valid JSON-LD; no invented reviews/policy claims; representative available/unavailable and multi-variant products pass Rich Results Test critical requirements. Record warnings and eligibility limits; rich-result appearance is not guaranteed.

### SEO-06 — Pagination and parameters

Collection pagination currently needs verification beyond the shared helper's blanket query removal. Define a URL policy for tracking, variant, sort/filter, search and genuine pagination parameters. Duplicate tracking URLs canonicalize to the clean page; non-duplicate paginated collection pages retain their distinct canonical pagination identity [S8]. Do not canonicalize every subsequent page to page one.

Provide real href links for sequential pagination and product discovery; crawlers do not click load-more controls [S8]. If the complete collection is intentionally SSR-rendered in one page, document and test that contract instead. Test cursor/page stability, empty/out-of-range responses and duplicate content under market/filter combinations.

Acceptance: all published products can be discovered from links and/or sitemap; no JS-only discovery dependency; page two is not incorrectly canonicalized as page one; filters cannot create unbounded crawl spaces; parameter normalization does not break shopping.

### SEO-07 — Locales

Inspect existing route/context market handling before designing prefixes. Cookie/session language selection is not equivalent to separately indexable translated pages. Google recommends distinct URLs for language variants [S11]. Do not emit hreflang pointing to nonexistent /fr or /de pages.

First preserve known historic localized URLs with verified content or meaningfully mapped replacements. Do not blanket strip locale prefixes while serving different-language content. Where the existing app cannot serve a localized equivalent, record the limitation and mapping decision.

A later locale-URL implementation must provide deterministic server rendering, correct html lang, self-canonicals for genuine translations, reciprocal hreflang including self and appropriate x-default, crawlable language links, and compatible cache keys. Owner selects URL/content policy before expanding routes.

Acceptance: every published alternate URL exists and serves its declared language without needing a prior cookie; reciprocal annotations resolve to canonical 200 pages. Until that is true, do not advertise unimplemented alternates.

### SEO-08 — Search and merchant distribution

Check product feed link/mobile_link and variant preselection against non-www. Shopify's migration guide calls out product-feed domain updates [S12]. Do not alter feeds or Admin resources in this code task. Prepare exact changes and validate after the responsible owner applies them.

Submit the non-www sitemap when authorized access is available. Use a domain Search Console property covering both hosts, or verified properties for both; keep old-host visibility available during migration. Do not delete old properties. Inspect homepage, key products/collections, journal and legacy redirects for Google-selected canonical and rendered content.

Separate Google impressions/clicks from Shopify/GA4 sessions, developer activity and bots. Verify consenting production page/product/cart events separately from SEO; analytics consent does not justify hiding public SSR content from crawlers.

Acceptance: sitemap processing and representative Google-selected canonicals recorded when access works; feed targets reach intended products/variants; daily non-www search and public-host session baselines exist. GSC Wizard subscription failure is an access limitation, not zero traffic or zero indexed pages.

## 5. Verification and release

Add high-value regression coverage to existing site/schema, robots, sitemap, route and E2E suites. Include explicit host expectations, legacy redirects, actual error status, public/private/preview distinctions, pagination and a split-host production smoke matrix. Local Playwright alone cannot prove Shopify domain routing.

Follow current CLAUDE.md: agent branch → PR dev → all checks green → merge dev; production only on the owner's explicit release call. No framework upgrade is needed for this fix. The installed Hydrogen version is 2026.4.7: use the matching 2026-04/legacy documentation; do not copy 2026-10 replacement APIs.

Required implementation checks: codegen when queries change; build before typecheck; lint; measured coverage; locale check; E2E chromium/webkit/mobile/mobile-safari. Capture deployed /api/release SHA and fresh public-host evidence after production promotion. A plan PR or green preview does not mean live SEO is corrected.

Release acceptance:
- Every emitted sitemap URL is non-www, canonical, indexable and 200.
- Representative raw HTML and browser outputs agree on non-www identity.
- No public page canonicals or site-identity JSON-LD point to the www bridge.
- Historical landing mappings pass; meaningful failures are not disguised as 200.
- Preview/private protections and cart/checkout behavior pass.
- Shopify domain targets, published Liquid theme and merchant data remain unchanged by the Hydrogen patch.

Rollback: keep packages small and record last known-good deployed SHA. If checkout/cart/public rendering regresses, revert the responsible code PR through dev and the authorized main release path; verify release SHA and smoke again. Avoid automatic rollback of the corrected non-www SEO origin solely because rankings fluctuate. Preserve successful legacy redirects and the owner-approved domain arrangement. Do not make emergency DNS/theme changes as a substitute for a code revert.

## 6. Success measurement

Engineering success is immediate and deterministic: zero host mismatches, zero broken sitemap destinations, passing migration/checkout tests and captured release evidence. Search recovery is measured separately: inspect processing after release, compare non-www impressions/clicks and indexed canonicals weekly, and review 14/28-day trends without treating incomplete recent data as settled. No ranking, visit or sales guarantee is attached.

## 7. Primary-source cross-reference

All sources reviewed 2026-10-23. Requirements above are applied to observed code; hypotheses and inaccessible checks remain explicit.

| Ref | Official source | Plan use |
|---|---|---|
| S1 | [Shopify: Redirect traffic to Hydrogen](https://shopify.dev/docs/storefronts/headless/legacy/hydrogen/migrate/redirect-traffic) | Split domains and supported redirect theme |
| S2 | [Shopify: Hydrogen SEO](https://shopify.dev/docs/storefronts/headless/legacy/hydrogen/seo) | Route metadata, sitemap, robots; matching installed version |
| S3 | [Google: Canonical URL methods](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) | Consistent identity signals |
| S4 | [Google: Site moves](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) | Mapping, destinations, migration monitoring |
| S5 | [Google: Redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects) | HTTP vs client-side limitations |
| S6 | [Google: Build a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) | Canonical inventory and limits |
| S7 | [Google: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) | Initial HTML, noindex/rendering, status codes |
| S8 | [Google: Ecommerce pagination](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading) | Crawl links and pagination identity |
| S9 | [Google: Robots meta specifications](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) | Crawlability vs index controls |
| S10 | [Google: Product variants](https://developers.google.com/search/docs/appearance/structured-data/product-variants) | Variant/structured-data verification |
| S11 | [Google: Multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites) | Stable translated URLs |
| S12 | [Shopify: Online Store migration](https://shopify.dev/docs/storefronts/headless/legacy/hydrogen/migrate) | Product-feed destinations and checkout separation |
