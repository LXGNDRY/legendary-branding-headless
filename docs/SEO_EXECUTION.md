# Hydrogen SEO execution evidence

Owner scope: execute the technical SEO plan in verified slices to dev; preserve domain assignments. Production promotion is separate.

## Slice 1 — public origin (SEO-01; SEO-02 shared pointers)

- Base: 4dff35d46c76abc8e38118a6edb7ec2409a52ceb.
- Reproduced: two new contract tests failed on the old www origin and absolute-URL pass-through.
- Changes: non-www shared origin; site-owned absolute URLs normalize the www alias and reject external origins/credentials/ports. Metadata, structured data, sitemap and robots inherit the corrected origin. Existing explicit expected URLs and browser smoke assertions now use non-www.
- Local validation: build, typecheck, lint (existing warnings), 823 tests and coverage passed. Statements 81.76%, branches 69.50%, functions 74.91%, lines 83.27%. Node 24.19/npm 10.9.4 install; default npm 11 failed on missing cross-platform optional lock entries. Lockfile unchanged.
- Browser CI and merge evidence: pending; do not treat local tests as live production verification.

## Slice 2 — discovery integrity (SEO-02)

- Five failing-before tests reproduced preview case/port bypasses, duplicate sitemap nodes and silently incomplete pagination.
- Sitemap connections now deduplicate handles and fail with a non-cacheable 503 on missing/repeated cursors or the safety limit, rather than publish an apparently complete partial inventory.
- Shopify preview aliases and case/port-normalized Oxygen hosts retain noindex protections. Local E2E servers retain their existing behavior.
- Local validation: build, typecheck, lint (existing warnings), 827 tests and coverage passed. Browser CI/merge evidence pending.

## Remaining packages

SEO-02: pagination completeness and preview aliases. SEO-03: historical redirects. SEO-04: read-only www/checkout verification; no settings writes. SEO-05: resource SEO metadata. SEO-06: pagination identity. SEO-07: localized URL/content policy. SEO-08: indexing/feed access. SEO-09: final combined evidence.

Production still serves the old deployment until an explicitly authorized main release. Search Console checks remain unavailable through the expired GSC Wizard subscription. No claim of search recovery or full plan closure.
