# Phase 5 Changelog — Content, SEO & Functional Completeness

## Overview
Phase 5 closes the content, SEO, and functional gaps surfaced in the enterprise E2E audit.
All changes follow CLAUDE.md conventions: no Liquid/theme/checkout/payment/DNS changes,
all work lands via feature branches → PR → dev.

## 5.1 JSON-LD Consolidation

**Files:**
- `app/components/seo/SeoSchema.tsx` — existing shared generators (unchanged)
- `app/routes/products.$handle.tsx` — replaced inline product JSON-LD with `productSchema()`; added `breadcrumbSchema`
- `app/routes/journal.$articleHandle.tsx` — replaced inline article JSON-LD with `articleSchema()`; added `breadcrumbSchema`
- `app/routes/collections.$handle.tsx` — added `collectionPageSchema` + `breadcrumbSchema`
- `app/routes/collections._index.tsx` — added `breadcrumbSchema`
- `app/routes/policies.$handle.tsx` — added `breadcrumbSchema`
- `app/routes/pages.$handle.tsx` — added `breadcrumbSchema`

**Details:**
- Product and article routes now use the shared generators instead of duplicating schema structure
- Collection pages now emit CollectionPage schema with product item list
- Every page with a visible breadcrumb nav now emits matching BreadcrumbList structured data
- Zero new network cost — all data was already loaded by the page

## 5.2 Meta Tag Completeness

**Routes upgraded from title-only / partial meta to full canonical + og: tags:**
- `collections.$handle` — added canonical, og:type, og:title, og:description, og:url, og:image (from collection image)
- `policies.$handle` — added canonical, og:title, og:description, og:url
- `pages.$handle` — added description, canonical, og:title, og:url
- `wishlist` — added full meta export (was missing entirely)
- `collections._index` — added og:title, og:description, og:url
- `journal._index` — added og:title, og:description, og:url

**Routes that already had full meta (unchanged):** products, journal article, homepage.

## 5.3 robots.txt Canonical Domain Fix

**File:** `app/routes/[robots.txt].ts`

- Now uses `PUBLIC_CHECKOUT_DOMAIN` env var when available (same pattern as `[sitemap.xml].tsx`)
- Sitemap: URL always points to the canonical domain instead of the Oxygen preview origin
- Falls back to request origin when env var is not set (dev/preview behavior preserved)

## 5.4 Favicon Set + PWA Manifest

**New files in `public/`:**
- `favicon-16.png` — 16×16 standard
- `favicon-32.png` — 32×32 standard
- `apple-touch-icon.png` — 180×180 iOS home screen
- `icon-192.png` — 192×192 PWA icon
- `icon-512.png` — 512×512 PWA icon (also maskable)
- `site.webmanifest` — PWA manifest with brand theming (#1A1A1A theme, #FAF9F6 background)

**Wired into:** `app/root.tsx` links export

Existing `favicon.svg` remains the primary icon.

## 5.5 Newsletter → Klaviyo

**New files:**
- `app/routes/api.newsletter.ts` — server-side newsletter subscribe route
- `app/components/ui/NewsletterForm.tsx` — shared form component with 3 variants (footer/band/popup)

**Updated files:**
- `app/components/layout/Footer.tsx` — replaced inline form with `<NewsletterForm variant="footer" />`
- `app/components/sections/NewsletterBand.tsx` — replaced inline form with `<NewsletterForm variant="band" />`
- `app/components/sections/NewsletterPopup.tsx` — replaced inline form with `<NewsletterForm variant="popup" />`
- `env.d.ts` — added `PRIVATE_KLAVIYO_API_KEY` + `PUBLIC_KLAVIYO_LIST_ID` types

**API route details:**
- Accepts both `application/json` and `application/x-www-form-urlencoded` POST bodies
- Calls Klaviyo `/api/profile-subscription-bulk-create-jobs/` endpoint (2024-02-15 revision)
- Graceful degradation: returns simulated success when API key not configured (dev/preview safe)
- Server-only — API key never exposed to client bundle
- Email validation + error handling for API failures

**Required env vars (both must be set for real Klaviyo integration):**
- `PRIVATE_KLAVIYO_API_KEY` — private Klaviyo API key (server-only, never sent to browser)
- `PUBLIC_KLAVIYO_LIST_ID` — Klaviyo list/audience ID to subscribe to

## 5.6 Currency Switcher Removed

**Removed:** `app/components/ui/CurrencySwitcher.tsx` (dead component, never rendered anywhere)

Session-based currency infrastructure in `app/lib/context.ts` (URL param + session storage)
remains intact in case multi-currency is needed later. Country is still hardcoded to `'US'`.

## 5.7 Address CRUD + Account Edit

**New file:** `app/routes/account.edit.tsx` — profile editing page (first name, last name)
- Uses `customerUpdate` mutation via Customer Account API
- Shows success/error states
- Email is displayed as read-only

**Updated:** `app/routes/account.addresses.tsx` — full address CRUD
- `customerAddressCreate` — add new address via inline form
- `customerAddressUpdate` — edit existing address inline
- `customerAddressDelete` — delete with confirmation (useFetcher)
- `customerDefaultAddressUpdate` — set default address (useFetcher)
- Form validation + user error display
- All mutations go through the Customer Account API

Dead links in `account._index.tsx` and quick links now resolve correctly.

## 5.8 Wishlist Persistence

**New file:** `app/routes/api.wishlist.ts` — server-side wishlist sync bridge

**Updated:** `app/components/ui/Wishlist.tsx`
- Guest users: localStorage only (unchanged behavior, 30-day TTL)
- Logged-in users: bidirectional sync via `/api/wishlist`
  - On login: fetches server wishlist, merges with local (by handle, keeps older addedAt)
  - On change: debounced 500ms POST back to server (Customer Account `custom.wishlist` metafield)
  - Network failures are non-critical — localStorage stays the source of truth
- `isLoggedIn` prop passed from root loader into `WishlistProvider`
- New `isLoading` property on context (always false on server, true until hydrate on client)
- 100-item cap on server to avoid oversized metafields

**Customer Account metafield used:** `custom.wishlist` (type: `json`)

## 5.9 Metafields Audit

**Updated:** `docs/metafield-definitions.md` — added Status column to every table

| Status | Meaning |
|---|---|
| ✅ Wired | Queried AND rendered in the UI |
| ⚠️ Queried but unused | Present in the GraphQL query but never displayed |
| 📋 Aspirational | Documented but not yet implemented |

**PDP metafields now fully wired:**
- `custom.material` — ✅ Material accordion (was queried, now shown)
- `custom.fit` — ✅ Fit accordion (was queried, now shown)
- `custom.care` — ✅ Care Guide accordion
- `custom.size_chart` — ⚠️ Queried but unused (SizeGuideModal uses hardcoded chart)
- `custom.new_drop`, `lookbook_images`, `waitlist_available`, `accents` — 📋 Aspirational

**Collection metafields:** all 📋 aspirational (DropTimer receives date as prop)
**Page metafields:** `custom.content_blocks` — ✅ wired
**Customer metafields:** `custom.wishlist` — ✅ now wired; `size_preferences` — 📋

## 5.10 Explicit Image Dimensions

Added explicit `width` + `height` props to every `<Image>` component alongside the
existing `aspectRatio` prop, per CLAUDE.md's CLS-prevention rule.

**Components done:**
- `ProductCard` — all 3 instances (cart/primary/secondary hover)
- `ProductGallery` — main image + thumbnail grid
- `HeroSplit` — both left and right images
- `CategoryGrid` — all category cards
- `CollectionGrid` — all collection cards
- `Lookbook` — all lookbook images
- `BrandStory` — brand image
- `BeforeAfter` — both before and after images
- `FitCheck` — main image
- `DropTimer` — product image
- `StreetHero` — both left and right images
- `CartDrawer` — line item thumbnails
- `cart.tsx` — line item images
- `collections.$handle` — collection hero
- `collections._index` — collection grid
- `journal._index` — featured article + grid
- `journal.$articleHandle` — article hero

## Checks
- ✅ Typecheck passes (`npm run typecheck`)
- ✅ Lint passes (`npm run lint`)

## Next Phase (6 — Codegen)
Lower-priority DX improvement: generate real Storefront API + Customer Account API
types via `npm run codegen` (currently stub files). Dependent on live API credentials
being configured in CI secrets.
