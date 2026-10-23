# Hydrogen SEO execution evidence

Owner scope: execute the technical SEO plan in verified slices to dev; preserve domain assignments. Production promotion is separate.

## Slice 1 — public origin (SEO-01; SEO-02 shared pointers)

- Base: 4dff35d46c76abc8e38118a6edb7ec2409a52ceb.
- Reproduced: two new contract tests failed on the old www origin and absolute-URL pass-through.
- Changes: non-www shared origin; site-owned absolute URLs normalize the www alias and reject external origins/credentials/ports. Metadata, structured data, sitemap and robots inherit the corrected origin. Existing explicit expected URLs and browser smoke assertions now use non-www.
- Local validation: build, typecheck, lint (existing warnings), 823 tests and coverage passed. Statements 81.76%, branches 69.50%, functions 74.91%, lines 83.27%. Node 24.19/npm 10.9.4 install; default npm 11 failed on missing cross-platform optional lock entries. Lockfile unchanged.
- PR #403: quality, governance and all four browser projects passed; merged to dev at 5275adac37245e96c9d3ef1b2b3353bb8a8331d8. This is not production promotion.

## Slice 2 — discovery integrity (SEO-02)

- Five failing-before tests reproduced preview case/port bypasses, duplicate sitemap nodes and silently incomplete pagination.
- Sitemap connections now deduplicate handles and fail with a non-cacheable 503 on missing/repeated cursors or the safety limit, rather than publish an apparently complete partial inventory.
- Shopify preview aliases and case/port-normalized Oxygen hosts retain noindex protections. Local E2E servers retain their existing behavior.
- Local validation: build, typecheck, lint (existing warnings), 827 tests and coverage passed. PR #404: quality/governance and all four browser projects passed; merged to dev at 282307a5e938a19615f1000a0c6d540bba84947d.

## Slice 3 — verified historic blog redirects (SEO-03)

- Two failing-before tests reproduced missing permanent redirects for the known blog index and existing articles.
- The existing catch-all now recognizes only the known default-language blog paths, verifies article existence through the existing journal loader/query, and redirects 301 to the actual non-www resource. Missing articles, unknown blogs, malformed paths and unresolved localized paths remain 404 for Shopify's existing redirect fallback.
- Safe attribution parameters survive; redirect/auth parameters are not forwarded. No GraphQL selections or merchant redirects are changed.
- Localized mappings remain open: do not silently drop a language prefix and claim equivalent content. This slice adds no language URL architecture.
- Local validation: build/typecheck/lint passed; all 835 tests and measured coverage passed. PR #405: quality/governance and all four browser projects passed; merged to dev after verification.

## Slice 4 — merchant metadata and pagination (SEO-05/06)

- Three failing-before metadata tests reproduced ignored merchant SEO fields and the loss of collection pagination identity.
- Product/collection GraphQL queries now select SEO title/description; generated types regenerated successfully with the installed schema. Blank overrides fall back to actual content.
- Canonical collection pagination keeps only a valid cursor/direction pair. The loader uses the same normalization, so direction without a cursor cannot silently fetch the final page. Filter/sort views remain non-indexable duplicates instead of claiming an unfiltered paginated identity.
- Browser regression loads a real next collection page and checks its canonical. React checklist: route metadata/server loading only; no new hooks, UI state, client dependencies or interaction changes.
- PR #406: the revised head 0cf827fe8ab6ecdd2ea8b7e35dcf0656f71306f3 passed quality/governance and all four browser projects; the review finding was corrected and resolved before merging to dev at 4a17d551db50252089cfed226ccf1a3b7338480c. Local codegen/build/typecheck/lint and all 847 tests with coverage passed.

## Open work

The package-state table below is authoritative. Code corrections are staged in dev; localized URLs, feed/Search Console access and production verification remain explicitly open.

Production still serves the old deployment until an explicitly authorized main release. Search Console checks remain unavailable through the expired GSC Wizard subscription. No claim of search recovery or full plan closure.


## Review correction — backwards pagination

PR #406 review identified duplicate canonical identities when returning from page two or reaching an intermediate window backwards. The loader now collapses the first window to the base collection URL. For a backwards intermediate window only, it requests the preceding single item using the same query/sort/filter context to derive the stable forward boundary. Two loader tests and a browser return-to-first-page check cover this behavior. GraphQL selections are unchanged by this correction.

## Current verification limits and next actions

- Production baseline: 182 unique sitemap URLs, all still www. Five sampled public pages still declare www. Default/localized historic blog examples remain 404 in production. See the baseline JSON; these code slices are dev-only.
- Checkout: an anonymous test cart through Hydrogen's public proxy produced a www checkout URL and returned HTTP 200; its test lines were removed. No customer information/order was submitted. This establishes the destination host, not full browser consent/checkout continuity. A generic JavaScript redirect string in checkout HTML is not proof of a redirect-theme failure.
- Runtime PUBLIC_CHECKOUT_DOMAIN was observed as non-www in public SSR data. Review it against the verified www checkout destination before a separately authorized runtime configuration change. No settings were changed here.
- Local production-worker startup is blocked by Shopify CLI uv_interface_addresses in this sandbox. Local default npm 11 also rejects cross-platform optional lock entries; npm 10.9.4 installed successfully with no lockfile change. GitHub's configured browser/worker and deploy checks provide runtime evidence.
- SEO-07 remains open for genuine localized routes/content mapping. Existing cookie/session selection cannot justify invented hreflang URLs. Unknown localized links are not silently rewritten as English.
- SEO-08: Search Console selected-canonical/submission checks are blocked by expired GSC Wizard access. Merchant feed link/mobile_link values still require a connected feed audit; preserve variant parameters when switching their landing origin to non-www. No feed edits were made.
- SEO-09: full production URL crawl, Rich Results Test, Google-selected canonical checks and production consent continuity remain release/access dependent. Green dev CI must not be labeled production SEO recovery.


## Published URL inventory completed

The complete current production sitemap contained 182 unique URLs. Every equivalent non-www path was fetched with concurrency 3: 182/182 HTTP 200, no request errors, and no observed meta noindex. This confirms destination availability at crawl time, not canonical correctness: all 182 sitemap entries still used www because production has not received these dev changes. Full evidence is in [SEO_URL_INVENTORY.json](audits/2026-10-23/SEO_URL_INVENTORY.json). This inventory does not include historical URLs absent from the current sitemap or inaccessible Search Console history.

## Package state after four code slices

| Package | State |
|---|---|
| SEO-00 | Published URL baseline complete; historical/Search Console inventory still partial |
| SEO-01 | Implemented and verified in dev, PR #403 |
| SEO-02 | Origin, sitemap pagination integrity and known preview protections implemented in dev, PR #403/#404; live corrected-output crawl awaits a main release |
| SEO-03 | Default-language known blog redirects implemented in dev, PR #405; localized/other legacy mappings remain open |
| SEO-04 | Www checkout destination verified with anonymous cart and HTTP 200; browser consent continuity and runtime checkout-domain review remain open |
| SEO-05 | Merchant product/collection SEO fields implemented, types regenerated, shared JSON-LD origin corrected; Google Rich Results/live-render checks remain open |
| SEO-06 | Forward/backward collection window identity fixed and browser-tested, PR #406 |
| SEO-07 | No new locale architecture or hreflang claims shipped; localized legacy mapping requires a genuine translated-content contract |
| SEO-08 | Search Console access and merchant feed verification remain open; no feed/settings writes |
| SEO-09 | All four code PRs passed quality/governance and chromium/webkit/mobile/mobile-safari before dev merge; combined dev deployment evidence is tracked by Actions. Production verification is not claimed |

These are staged corrections, not full plan closure. No main merge or domain/theme/merchant-setting change was made. Further main promotion requires the owner's explicit call under CLAUDE.md.


## Slice 5 — deployment smoke compatibility and evidence

The first combined dev run (39911774645) built and published successfully, but its smoke result was 7/8: the collection returned HTTP 200 with a valid merchant SEO title, while the old smoke asserted the uppercase brand string. This is not treated as a green deploy. The correction retains the existing error-boundary/status checks and requires a nonempty resource title plus CollectionPage JSON-LD, the exact non-www collection canonical and real product links. PDP checks also honor merchant title casing while retaining Product schema and a non-www product canonical. Five focused regression cases exercise actual grep matching, including missing evidence and empty titles; two failed before the fix.

The optional Shopify standalone component validator was also attempted for the touched routes. It does not use this project's DOM.Iterable/strict-null compiler context and reported incompatible existing Money props; those diagnostics were not hidden with application suppressions. Pinned-project codegen, strict tsc and the full browser gates remain the implementation evidence.

Slice 5 local validation: workflow YAML parsed, smoke shell syntax checked, build/typecheck/lint passed, all 852 tests and coverage thresholds passed. Its PR/browser/deploy gates remain required before a healthy staging claim.


## Slice 6 — Shopify analytics CSP destination

The installed Hydrogen 2026.4.7 provider calls sendShopifyAnalytics without a shopDomain override; its sender fetches https://monorail-edge.shopifysvc.com/unstable/produce_batch. app/lib/security.ts supplied a custom connect-src allowing Shopify .com hosts but omitted this distinct .shopifysvc.com destination. Shopify's own default CSP includes that exact origin. The new unit test failed before the fix.

The correction adds only https://monorail-edge.shopifysvc.com to connect-src, preserving consent, preview suppression and the rest of the policy. A browser test intercepts a synthetic request to verify actual CSP permission without sending an analytics event to Shopify. This fixes a concrete reporting barrier; it does not prove organic traffic, attribution or complete consent continuity. Verify real consenting production events after an authorized release.

Official references: [Hydrogen analytics validation](https://shopify.dev/docs/storefronts/headless/legacy/hydrogen/analytics/validation) and [2026-04 CSP utility](https://shopify.dev/docs/api/hydrogen/2026-04/utilities/createcontentsecuritypolicy). Local validation: build/typecheck/lint and all 853 tests with coverage passed. Browser/merge gates pending.
