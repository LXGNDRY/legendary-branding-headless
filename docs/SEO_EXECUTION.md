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
- Local validation: codegen/build/typecheck/lint and 845 tests with coverage passed; final browser CI pending.

## Remaining packages

SEO-02: pagination completeness and preview aliases. SEO-03: historical redirects. SEO-04: read-only www/checkout verification; no settings writes. SEO-05: resource SEO metadata. SEO-06: pagination identity. SEO-07: localized URL/content policy. SEO-08: indexing/feed access. SEO-09: final combined evidence.

Production still serves the old deployment until an explicitly authorized main release. Search Console checks remain unavailable through the expired GSC Wizard subscription. No claim of search recovery or full plan closure.
