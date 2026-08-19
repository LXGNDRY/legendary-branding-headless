# Architecture — Legendary Branding Headless Storefront

**Status:** Batch 14 (Release Documentation), drafted from direct codebase reads on 2026-08-19.
Every claim below is grounded in a specific file in this repository. Anything that would require
checking a live environment (Shopify Admin, GitHub secrets, Oxygen dashboard) is called out
explicitly as unverified rather than asserted.

---

## 1. Stack

Shopify Hydrogen 2025 + React Router v7, TypeScript strict mode, Tailwind CSS v4, deployed to
Shopify Oxygen (Cloudflare Workers). Routes are file-based via `flatRoutes()` — see
`app/routes.ts`:

```ts
import {flatRoutes} from '@react-router/fs-routes';
export default flatRoutes() satisfies RouteConfig;
```

Routes are **not** manually registered; a file's name under `app/routes/` determines its URL per
`@react-router/fs-routes` conventions (`.` segments nest paths, `$param` is a dynamic segment,
`_index` is the index route for a parent).

---

## 2. Route Map

Read directly from `app/routes/` (one file per route):

| Route file | URL pattern | Purpose |
|---|---|---|
| `_index.tsx` | `/` | Homepage — featured collections, new drops, best sellers |
| `collections._index.tsx` | `/collections` | Collection index (all collections) |
| `collections.$handle.tsx` | `/collections/:handle` | PLP for one collection |
| `products.$handle.tsx` | `/products/:handle` | PDP — gallery, variants, add-to-cart |
| `cart.tsx` | `/cart` | Cart page (loader + actions, no direct `storefront.query` — see §3) |
| `search.tsx` | `/search` | Full search results page |
| `api.search.ts` | `/api/search` | Predictive/autocomplete search API (JSON) |
| `api.newsletter.ts` | `/api/newsletter` | Newsletter signup → Klaviyo (see §7) |
| `api.wishlist.ts` | `/api/wishlist` | Wishlist read/mutate against Customer Account metafield |
| `wishlist.tsx` | `/wishlist` | Wishlist page (client-rendered, uses `WishlistProvider`) |
| `journal._index.tsx` | `/journal` | Blog/Journal index |
| `journal.$articleHandle.tsx` | `/journal/:articleHandle` | Blog article template |
| `pages.$handle.tsx` | `/pages/:handle` | Generic Shopify page (About, Contact, FAQs, etc.) |
| `policies.$handle.tsx` | `/policies/:handle` | Shopify policy pages (refund, terms, privacy, shipping) |
| `account._index.tsx` | `/account` | Account dashboard |
| `account.login.tsx` | `/account/login` | Customer Account API login redirect |
| `account.register.tsx` | `/account/register` | Registration redirect |
| `account.authorize.tsx` | `/account/authorize` | OAuth/PKCE callback for Customer Account API |
| `account.logout.tsx` | `/account/logout` | Logout |
| `account.edit.tsx` | `/account/edit` | Profile edit |
| `account.addresses.tsx` | `/account/addresses` | Address CRUD (create/update/delete/set-default) |
| `account.orders.tsx` | `/account/orders` | Order history |
| `[robots.txt].ts` | `/robots.txt` | Generated robots file |
| `[sitemap.xml].tsx` | `/sitemap.xml` | Generated sitemap (products, collections, etc.) |
| `docs._index.tsx`, `docs.*.tsx` | `/docs/*` | In-app changelog/design-system docs (not customer-facing) |
| `$.tsx` | catch-all | Branded 404 |

Each PDP/PLP/journal/policy loader explicitly returns/throws a typed 404 (`throw new Response('Not
found', {status: 404})`) when Shopify returns null — verified in `products.$handle.tsx`,
`collections.$handle.tsx`, `pages.$handle.tsx`, `policies.$handle.tsx`, `journal.$articleHandle.tsx`.

---

## 3. Data Flow

### Storefront API — `context.storefront.query()`
Used in 11 route files (grep-verified): `_index.tsx`, `collections._index.tsx`,
`collections.$handle.tsx`, `products.$handle.tsx`, `journal._index.tsx`,
`journal.$articleHandle.tsx`, `pages.$handle.tsx`, `policies.$handle.tsx`, `search.tsx`,
`api.search.ts`, `[sitemap.xml].tsx`. Every query is written inline as a `#graphql` tagged
template per `CLAUDE.md`'s convention, and the query result is used directly — no hardcoded
product/price/copy data was found in these loaders.

### Customer Account API — `context.customerAccount`
Used across all `account.*` routes plus `api.wishlist.ts`: `account._index.tsx`,
`account.addresses.tsx`, `account.authorize.tsx`, `account.edit.tsx`, `account.login.tsx`,
`account.logout.tsx`, `account.orders.tsx`, `api.wishlist.ts`. Every one of these guards on
`if (!customerAccount)` before use, and calls `customerAccount.isLoggedIn()` before querying —
so the app degrades gracefully when the Customer Account API isn't configured (see §8).

Per `app/lib/context.ts`, `customerAccount` is only attached to the Hydrogen context when
`PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` is set, and the loader **throws at boot** if
`PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` and `PUBLIC_CUSTOMER_ACCOUNT_API_URL` are set
inconsistently (one present, one missing) — a deliberate fail-fast:

```ts
if (hasClientId !== hasApiUrl) {
  throw new Error('Customer Account API is half-configured: ... Set both or neither.');
}
```

### Cart
`cart.tsx` and the header/drawer components operate on Hydrogen's built-in cart (via
`context.cart`, wired by `createHydrogenContext`) rather than a raw `storefront.query` in the
route file itself — cart mutations go through Hydrogen's cart API and the drawer/cart page render
the resulting `CartData`.

### Wishlist persistence
`api.wishlist.ts` reads/writes a Customer Account metafield via `customerAccount.query` /
`customerAccount.mutate`. Per `docs/PRODUCTION_READINESS.md` §2, this has not been independently
verified end-to-end (log in on one session, confirm persistence on another) — **treat as
unverified until manually tested.**

---

## 4. Caching Tiers

Defined in `app/lib/cache.ts`, three tiers wrapping Hydrogen's `CacheLong`/`CacheShort`/`CacheNone`:

| Tier | `maxAge` | `staleWhileRevalidate` | `staleIfError` | Intended use |
|---|---|---|---|---|
| `CacheLong` | 1 hour | 24 hours | 7 days | Stable content: products, collections, blog, policies |
| `CacheShort` | 1 minute | 15 minutes | 1 hour | Dynamic-but-public: homepage listings, collection listings, search |
| `CacheNone` | 0 | 0 | 0 | Per-user/dynamic: cart, account, personalized |

Actual per-route application (verified by grep of `cache:` args passed into `storefront.query`):

| Route | Tier used |
|---|---|
| `_index.tsx` (homepage) | `CacheLong` |
| `collections._index.tsx` | `CacheLong` |
| `collections.$handle.tsx` | `CacheShort` |
| `products.$handle.tsx` | `CacheLong` |
| `journal._index.tsx`, `journal.$articleHandle.tsx` | `CacheLong` |
| `pages.$handle.tsx`, `policies.$handle.tsx` | `CacheLong` |
| `search.tsx` | `CacheShort` |
| `[sitemap.xml].tsx` | `CacheLong` |
| `api.search.ts` | Raw `Cache-Control: public, max-age=60, stale-while-revalidate=900` header (not the `cache.ts` helpers) |
| `[robots.txt].ts` | Raw `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` header |
| `account.*`, `cart.tsx`, `api.wishlist.ts`, `api.newsletter.ts` | No `CacheLong`/`CacheShort` — implicitly uncached/per-request (consistent with `CacheNone` intent, though these routes don't call `CacheNone()` explicitly since they don't call `storefront.query` with a cache option) |

Note: the homepage's tier (`CacheLong`, 1hr/24hr/7day) is longer than `app/lib/cache.ts`'s own
doc comment suggests for the homepage ("dynamic but public... homepage" under `CacheShort`) — the
actual code in `_index.tsx` uses `CacheLong()`. This is a discrepancy between the comment and the
implementation worth flagging to the owner, not something this doc should paper over.

`app/lib/cache.ts` also exports `htmlCacheHeaders()` (default `public, max-age=60,
stale-while-revalidate=900`) and `noCacheHeaders()` (`no-store, no-cache, must-revalidate,
max-age=0`) for full-page HTML cache-control, separate from the GraphQL-level cache tiers above.

---

## 5. Observability

### Server-side errors — `app/lib/sentry.server.ts`
A hand-rolled, dependency-free Sentry envelope sender (not the `@sentry/*` SDK) built for the
Cloudflare Workers runtime. `initSentryServer(env)` reads `env.PUBLIC_SENTRY_DSN`; if unset,
`captureServerError` and `captureServerMessage` no-op except for a `console.error`/`console.warn`
fallback. When a DSN is present, it parses the DSN, builds a minimal Sentry event + envelope by
hand, and does a fire-and-forget `fetch()` to Sentry's envelope endpoint (errors from that fetch
are swallowed so Sentry can never break a request). Called from `server.ts`'s catch block per
`docs/PRODUCTION_READINESS.md`.

### Client-side errors — `app/lib/monitoring.ts`
Uses the real `@sentry/react` SDK. `initSentry(dsn)` is called once from `app/root.tsx` (via
`useEffect`); no-ops with no DSN. `beforeSend` strips `event.user.email` and
`event.user.ip_address` before sending. `captureError()` is the shared entry point — sends to
Sentry when the client SDK is initialized, otherwise falls back to `console.error`. `app/root.tsx`
calls `captureError` from its `ErrorBoundary`.

### Web Vitals
`useWebVitals(ga4Id)` in `app/lib/monitoring.ts` uses the real `web-vitals` npm package
(`onLCP`, `onFCP`, `onCLS`, `onINP`) rather than a CDN script. Each metric is pushed to
`window.dataLayer` (for GA4) and, when the Sentry client is initialized, to
`SentryBrowser.metrics.distribution(...)`. In dev (`import.meta.env.DEV`), metrics are also
`console.log`'d.

### Unverified
Whether `PUBLIC_SENTRY_DSN` is actually set in the real Oxygen environment is **unverified —
needs owner confirmation**. The code path exists and degrades safely either way.

---

## 6. Security

`app/lib/security.ts` defines `SECURITY_HEADERS`, applied to every response via
`applySecurityHeaders()` (called from the root loader's headers, per `docs/PRODUCTION_READINESS.md`).
Headers set: a full `Content-Security-Policy` (see below), `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Strict-Transport-Security` (1 year, includeSubDomains, preload), a restrictive
`Permissions-Policy` (camera/microphone/geolocation/payment/usb/bluetooth all disabled), and
`Cross-Origin-*` headers (`same-origin-allow-popups` / `cross-origin` / `unsafe-none`).

CSP specifics (from the source):
- `script-src 'self' 'unsafe-inline' cdn.shopify.com shop.app *.shopifypay.com
  www.googletagmanager.com connect.facebook.net analytics.tiktok.com` — `unsafe-inline` is
  present (documented as needed for React hydration + inline script preloading); `unsafe-eval`
  has been removed.
- `style-src` allows `'unsafe-inline'` (Tailwind) plus Google Fonts + Shopify CDN.
- `connect-src` allows Shopify, GA4, GTM, Meta Graph, TikTok analytics, and `*.sentry.io`.
- `frame-src` allows Shopify checkout/Shop Pay iframes.
- `isAssetRequest(request)` is a helper to detect static-asset requests (by extension) so heavy
  security headers can be skipped for assets.

**Known limitation, stated in the source comment itself**: CSP is "non-strict by default" —
`unsafe-inline` remains for both scripts and styles. Removing it (nonce-based CSP) is deferred —
see `docs/POST_LAUNCH_ROADMAP.md`.

### Rate limiting — `app/lib/rate-limit.ts`
An in-memory sliding-window limiter keyed by an identifier (recommended: IP + route path).
`getClientIP(request)` reads `cf-connecting-ip`, then `x-forwarded-for`, then `x-real-ip`,
falling back to a truncated User-Agent string if none are present. `checkRateLimit(key,
maxRequests, windowMs)` returns `{limited, remaining, retryAfter}`. A background sweep
(`setInterval`, 60s) evicts stale entries. Used by `app/routes/api.newsletter.ts`,
`app/routes/api.search.ts`, and `app/routes/api.wishlist.ts` (grep-verified).

**Documented limitation, stated in the source comment**: this is in-memory per Worker isolate —
"not intended to replace edge-level rate limiting" — it does **not** enforce a global limit across
Oxygen's edge fleet. A client hitting different edge instances can exceed the nominal limit. See
`docs/POST_LAUNCH_ROADMAP.md`.

---

## 7. Session — `app/lib/session.ts`

`AppSession` implements Hydrogen's `HydrogenSession` interface on top of React Router's
`createCookieSessionStorage`. Cookie config: name `__session`, `httpOnly: true`, `path: '/'`,
`sameSite: 'lax'`, `secure` true in production or over HTTPS
(`IS_PRODUCTION || url.protocol === 'https:'`), 7-day `maxAge`, and `secrets` supplied from
`env.SESSION_SECRET` (supports rotation via a secrets array, though only one secret is currently
passed in `app/lib/context.ts`: `AppSession.init(request, [env.SESSION_SECRET])`).
`IS_PRODUCTION` is derived from `import.meta.env.PROD` (a Vite/Rollup compile-time constant) —
explicitly **not** `process.env.NODE_ENV`, since Node globals don't exist in the Oxygen/Cloudflare
Workers runtime.

`createAppLoadContext` (`app/lib/context.ts`) also uses the session to persist a `currency` value
read from a `?currency=` URL param or the existing session value, defaulting to `'USD'` — but note
`i18n: {language: 'EN', country: 'US', currency: activeCurrency}` still **hardcodes `country:
'US'`**, so this currency plumbing does not amount to real multi-market support (see
`docs/POST_LAUNCH_ROADMAP.md`).

---

## 8. Environment Variable Validation (fail-fast)

`createAppLoadContext` in `app/lib/context.ts` throws at boot if any of `SESSION_SECRET`,
`PUBLIC_STORE_DOMAIN`, or `PUBLIC_STOREFRONT_API_TOKEN` are missing. `PRIVATE_STOREFRONT_API_TOKEN`
is optional (Hydrogen falls back to the public token). Customer Account API vars
(`PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` / `PUBLIC_CUSTOMER_ACCOUNT_API_URL`) are validated
both-or-neither, also fail-fast. Analytics (`PUBLIC_GA4_MEASUREMENT_ID`, `PUBLIC_META_PIXEL_ID`,
`PUBLIC_TIKTOK_PIXEL_ID`), monitoring (`PUBLIC_SENTRY_DSN`), and Klaviyo
(`PRIVATE_KLAVIYO_API_KEY`, `PUBLIC_KLAVIYO_LIST_ID`) vars are all optional and degrade to
no-op/disabled behavior rather than throwing — confirmed by reading each consuming module.

Full variable list is declared in `env.d.ts` and templated (placeholders only) in `.env.example`.

---

## 9. What This Document Does Not Cover

- Whether the real Oxygen environment actually has `PUBLIC_SENTRY_DSN`, Klaviyo keys, or Customer
  Account API vars set — **unverified, needs owner confirmation.**
- Which Shopify Markets are actually live at checkout — **unverified, needs owner confirmation**
  (see `docs/PRODUCTION_READINESS.md` §3, Batch 13).
- Whether a real Shopify order has ever been placed and verified end-to-end through this
  storefront — **not done**, per `docs/PRODUCTION_READINESS.md` §2.
