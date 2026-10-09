# Sitemap audit — 2026-10-09

**Status: audit only. PR #336 must not be merged or deployed until this is reviewed.**

Scope of this branch relative to `main`: the sitemap code (index + four per-type sitemaps, image entries, default-market queries, handle guard, `page-routes.ts` used only to choose which URL the sitemap lists), tests, and this folder. `robots.txt`, canonical logic and hreflang are **not modified** (item 9). An earlier commit on this branch that changed the canonical tags of `/pages/*` and `/policies/*` has been reverted.

All live checks were made against `https://www.legendary-branding.com` on 2026-10-09, with the sandbox's `Connection Established` proxy line excluded from every status reading. Raw data is in `evidence/`.

## Result by item

| # | Item | Result |
|---|---|---|
| 1 | Policy/page URLs individually | **Proven** — table below |
| 2 | Cross-reference with the ~5,500 GSC 404s | **Not provable by me.** I cannot access Search Console. I tested every localized/country/currency/variant URL shape directly and wrote `xref-gsc.py` to do the exact cross-check once you export the 404 list |
| 3 | Every sitemap URL canonical, indexable, 200, no query | **Proven** for all 192 URLs of the proposed set |
| 4 | No `/web-pixels`, auth, search, cart, account, market/currency/variant URLs | **Proven** by construction, by a regression test, and by checking all 192 URLs against the live robots.txt |
| 5 | Localized URLs only when valid and self-canonical | **No localized URLs exist on this site**, so none are included; evidence below |
| 6 | Redirects/canonicalization vs sitemap-only | **Determination: sitemap-only is not enough.** Recommendation below |
| 7 | Follows Shopify publication automatically | **Proven** for products, collections, pages, articles; three small manual touchpoints and the cache lag are listed |
| 8 | Exact before/after URL set | **8 removed, 8 added, 184 unchanged** — lists below |
| 9 | robots.txt / canonical / hreflang untouched | **Confirmed** |
| 10 | Do not merge or deploy | **Not merged, not deployed.** Branch pushes do not deploy (CI deploys only on pushes to `main`/`dev`) |

## 1. Policy and page URLs (`evidence/item1-policy-and-page-urls.tsv`)

Every row below: no `robots` meta, no `X-Robots-Tag`, no hreflang. "hop 1" is the first response without following redirects.

| URL | hop 1 | canonical | final |
|---|---|---|---|
| `/policies/size-guide` | 200 | itself | 200 |
| `/policies/refund-policy` | 200 | itself | 200 |
| `/policies/shipping-policy` | 200 | itself | 200 |
| `/policies/terms-of-service` | 200 | itself | 200 |
| `/policies/privacy-with-legendary-branding` | 200 | itself | 200 |
| `/policies/about`, `/policies/contact`, `/policies/legendary_branding_faqs` | 200 | itself | 200 |
| **`/policies/privacy-policy`** | **404** | none | **404** |
| `/pages/size-guide`, `/pages/refund-policy`, `/pages/shipping-policy`, `/pages/terms-of-service`, `/pages/privacy-with-legendary-branding`, `/pages/about`, `/pages/contact`, `/pages/legendary_branding_faqs` | 200 | **itself** | 200 |
| **`/pages/privacy-policy`** | **301** → `/pages/privacy-with-legendary-branding` | none | 200 (1 redirect) |

Findings:
- **All eight documents are live at two URLs, each self-canonical** (about 99% identical text; measured). Today both are indexable.
- **`/policies/privacy-policy` is a real 404.** That is Shopify's native privacy-policy URL, so it is a likely legacy-URL 404 source. `/pages/privacy-policy` *is* redirected, so a Shopify URL redirect exists for one and not the other.
- The `/policies/<handle>` route renders *any* Shopify page handle, so the three non-policy pages (`the-ultimate-streetwear-guide`, `oversized-hoodies-streetwear-the-piece-that-never-loses`, `data-sharing-opt-out`) are also live at `/policies/…` (200, self-canonical).
- Internal links: 17 references in the code point at `/policies/…`; the only internal `/pages/…` links are the three non-policy pages. The old sitemap listed the `/pages/…` copies of the eight.

## 2. Cross-reference with the GSC 404 pattern

I do not have the export, so I cannot say what the 5,500 URLs are or how many fall in each family. I tested 54 URL shapes on a real product, collection and page (`evidence/items2-5-url-shapes.tsv`):

| Shape | Live result |
|---|---|
| Localized prefixes `/en-ca/…`, `/fr/…`, `/fr-ca/…`, `/en-gb/…`, `/en-us/…`, `/ca/…`, `/uk/…`, `/de/…`, `/es/…` (home, product, collection) | **404**, `noindex`, canonical `/404` |
| `/collections/<c>/products/<p>` (Shopify's default scoped product URL) | **404** |
| `/blogs/<blog>/<article>`, `/blogs/news`, `/blogs/legendary_blogging` | **404** (the site uses `/journal`) |
| `/collections/all`, `/product/<h>`, `/collection/<c>` | **404** |
| `/web-pixels@…/…`, `/wpm@…/…`, `/web-pixels-manager@…` | **404**, `noindex` |
| `/products/<h>.json`, `.js` | **404** |
| `/cart/c/…`, `/checkouts/…`, `/apps/…`, `/a/…`, `/services/…` | **404** |
| `?variant=`, `?country=`, `?currency=`, `?locale=`, `?utm_…`, `?_pos=…` on a product | **200**, canonical = the clean product URL |
| `?sort=`, `?page=2` on a collection; `?page=2` on `/journal` | 200, canonical = the clean URL |
| Trailing slash, upper-case `/Products/…`, upper-case handle | 200, canonical = the clean lowercase URL |
| `/account` → 302 `/account/login` → 302 Shopify auth; `/cart` 200; `/search` 200 `noindex` | not 404; robots.txt disallows all three |

Also: the home, a product page and a PDP with reviews contain **no** `web-pixels`/`wpm` references, **no** `/collections/<c>/products/<p>` links, **no** `/blogs/` links and **no** hreflang tags, so the headless site does not generate these URLs itself. Whatever Google holds for them comes from the previous (Liquid) site's URLs or external links.

Other 404 sources I can state exactly: Shopify has **32 UNLISTED and 25 DRAFT** products. Their `/products/<h>` URLs return a real 404 on the headless site (sampled: 4 unlisted, 2 draft).

**Cross-check against the sitemap:** none of the shapes above appear in either the current or the proposed set (item 3 and 4 prove the sets contain only the six clean path prefixes).

**To finish this item:** export Search Console → Page indexing → "Not found (404)" and run  
`python3 -I docs/audits/2026-10-09-sitemap/xref-gsc.py <export.csv> --probe 3`  
It groups the URLs by the families above, reports any URL present in `before-urls.txt` or `after-urls.txt`, and probes samples live. I tested it on a synthetic file (and fixed a bug it exposed: a `?variant=` URL was wrongly matching its clean product URL).

## 3. Every proposed sitemap URL (`evidence/item3-after-set-url-audit.tsv`)

All 192 URLs of the proposed set, each fetched individually without following redirects:
- 192 of 192 return **200**; none redirects.
- 192 of 192 have a canonical **exactly equal to the URL**.
- 0 have a `noindex`/`none` directive in the robots meta or `X-Robots-Tag` header (0 carry either).
- 0 contain `?`, `#` or `@`; all are on `https://www.legendary-branding.com`; no duplicates.
- 0 hreflang tags on any of them.

Limit: these are the proposed URLs as they exist in production today. The deployed sitemap route itself cannot be fetched (the Oxygen preview is behind Shopify login), so the proposed set was produced by running the real route code on live-derived data (below).

## 4. No unwanted URL families can enter

1. **By construction.** URLs come from only three fixed hub paths (`/`, `/collections`, `/journal`) and four Storefront API lists (products, collections, pages, articles) turned into `/products/`, `/collections/`, `/pages/` or `/policies/` + handle, `/journal/` + handle.
2. **Handle guard (new, in this branch).** `paginate()` drops any API node whose handle is not `[A-Za-z0-9][A-Za-z0-9_-]*`, so a `?`, `/`, `#`, `@` or `..` cannot reach a URL.
3. **Regression test** `app/lib/sitemap-routes.test.ts` runs the real loaders with hostile handles (`web-pixels@abc`, `a?variant=1`, `a?country=CA`, `a?currency=CAD`, `a/b`, `en-ca/x`, `account/login`, `../cart`, `a#b`) and asserts that every output URL matches the allowed pattern, contains no `?#@`, and none contains `/account`, `/cart`, `/checkout`, `/search`, `/wishlist`, `/api`, `/web-pixels`, `/wpm`, `/apps`, or a locale prefix.
4. **robots.txt (live, `robots-live-2026-10-09.txt`, parsed with Protego):** 0 of 192 URLs blocked for `*`, Googlebot, Googlebot-Image, Bingbot, OAI-SearchBot, ClaudeBot, GPTBot and PerplexityBot.

Observation, not changed (item 9): robots.txt does **not** disallow `/web-pixels…`, `?variant=`, `?country=` or `?currency=`. Those currently 404 or canonicalize to the clean URL, so they are not in the sitemap and not indexable, but they remain crawlable.

## 5. Localized URLs

There are none. The store has two Markets ("United States", "International") on one domain; the visitor's market comes from Cloudflare's edge country and a session cookie (`app/lib/context.ts`, `api.market.ts`), not from the URL. No locale-prefixed routes exist (all return 404, row 2 above) and no hreflang is emitted anywhere. The sitemap therefore lists no localized URLs, and nothing needs to be added.

New in this branch: the sitemap queries are pinned to the default market (US/EN), so every crawler gets the same sitemap. Caveat: a product published only to the International market would be absent from the sitemap, which matches what a US visitor (and Googlebot) can open.

## 6. `/pages/` vs `/policies/`: redirects or canonicalization?

**Determination: removing the duplicates from the sitemap alone is not a fix, and in this branch it is not even consistent.** With canonical logic untouched, `/pages/<h>` stays live and self-canonical for the eight documents, so the sitemap would advertise `/policies/<h>` while the other URL keeps claiming to be canonical. Google treats the sitemap as a weak hint.

Options, weakest to strongest:
- **A. Sitemap only** (this branch): leaves two indexable copies; mixed signals.
- **B. `rel=canonical`** from the non-preferred copy to the preferred one: consolidates, but both URLs are still crawled and remain 200.
- **C. 301 redirect** of the non-preferred copy: strongest consolidation, ends duplicate crawling, and the non-preferred URLs are not internally linked (the code's internal links go to `/policies/`). Redirects already work here: `server.ts` runs Hydrogen's `storefrontRedirect`, which is the likely source of the existing `/pages/privacy-policy` 301 (I did not inspect Shopify's redirect table).

**Recommendation:** C, in a separate, reviewed PR, with these parts:
1. `/pages/<h>` → `/policies/<h>` for the eight documents.
2. `/policies/<h>` → `/pages/<h>` for the three non-policy pages that the `/policies` route also serves.
3. `/policies/privacy-policy` → `/policies/privacy-with-legendary-branding` (Shopify's native URL is currently a 404).
4. Before choosing the direction, check in Search Console (URL Inspection on a few of each pair) **which copy Google has indexed and which has impressions/links**; redirect toward the stronger one.

Until then, do **not** ship the 8-URL swap: with no redirect or canonical change it only alters which duplicate is advertised.

## 7. Does it follow Shopify publication automatically?

Compared with Shopify Admin on 2026-10-09 (`shopify-admin-active-published-products.txt`):

| Resource | Shopify Admin | Sitemap | Match |
|---|---|---|---|
| Products | 66 ACTIVE, all published to the headless sales channel | 66 | **exact handle-for-handle** |
| Collections | 8 total; 5 published to the headless channel | 5 | exact |
| Pages | 11, all published | 11 | exact |
| Articles | 107 | 107 | exact |

Excluded automatically, with no code involved: 25 DRAFT products, 32 UNLISTED products (Shopify keeps them out of listings; sampled pages return 404 here), the unpublished collections `sets`, `legendary-select` and `halloween-26`, and empty collections. `halloween-26` will appear by itself once it is published and has products. Pagination reads every page (bounded at 100 pages per type).

Manual touchpoints that remain (all small):
- the three hub URLs `/`, `/collections`, `/journal`;
- the blog handle `legendary_blogging` (if the blog is renamed, the journal sitemap would be empty; the same constant is used elsewhere in the app);
- the eight policy-document handles in `app/lib/page-routes.ts`, which only decide `/policies/` vs `/pages/` for a page. A new Shopify page shows up under `/pages/` automatically.

Lag: storefront queries use `CacheLong` (1 h, stale-while-revalidate 24 h) and the sitemap response sends `max-age=3600, stale-while-revalidate=86400`. A publish or unpublish normally shows within about an hour; with stale-while-revalidate a stale copy can be served once for up to about 25 hours if nothing requests the sitemap in between.

## 8. Exact URL set, before vs after

- Before: 192 URLs in one file. After: 192 URLs across four files, listed by a sitemap index. Unique counts equal; no duplicates.
- **Removed (8)** — `diff-removed.txt`: `/pages/about`, `/pages/contact`, `/pages/legendary_branding_faqs`, `/pages/privacy-with-legendary-branding`, `/pages/refund-policy`, `/pages/shipping-policy`, `/pages/size-guide`, `/pages/terms-of-service`.
- **Added (8)** — `diff-added.txt`: the same eight handles under `/policies/`.
- **Unchanged: 184** (66 products, 108 journal/hub URLs, 6 collection/hub URLs, 3 pages, home).
- Not URL changes: `/sitemap.xml` becomes an index of `/sitemap-pages.xml`, `/sitemap-collections.xml`, `/sitemap-products.xml`, `/sitemap-journal.xml`; products gain up to 8 `<image:image>` entries each; collections lose `<lastmod>`.
- No empty collection was dropped today: all five show products on the live site.

How the "after" set was made: the real route loaders were run unmodified on a fixture derived from the live sitemap and live collection pages, with the visitor's market deliberately set to CA/FR to confirm the default-market pinning.

## 9. Files not touched

`git diff origin/main --name-only` contains no `robots`, canonical or hreflang file or change; `app/routes/[robots.txt].ts`, `app/lib/robots.ts`, `app/routes/pages.$handle.tsx` and `app/routes/policies.$handle.tsx` are identical to `main`.

## Other observations (nothing changed)

- A not-found product (`/products/<unlisted-or-draft>`) answers 404 but its HTML carries a self-referencing canonical and no `noindex` (other 404s carry `noindex` and canonical `/404`). Harmless while the status is 404.
- `/pages/data-sharing-opt-out` (a utility page) is in the sitemap.

## Needed from you

1. The Search Console "Not found (404)" export, to complete item 2.
2. A decision on item 6 (direction of redirects, and whether to ship the 8-URL swap at all).
