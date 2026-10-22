# Analytics — Legendary Branding Headless Storefront

Code map: `app/components/seo/Analytics.tsx` (banner + event bridge), `app/lib/consent.ts` (consent model),
`app/lib/trackers.ts` (tracker lifecycle), `app/lib/analytics-events.ts` (per-channel event mapping),
`app/root.tsx` (which IDs reach the browser). This describes code behavior, not a legal compliance conclusion.

---

## 1. Consent model

Three categories, chosen independently. Undecided is denied.

| Category | Controls |
|---|---|
| Analytics | GA4 |
| Marketing | Meta Pixel, TikTok Pixel, Klaviyo on-site embed (and GA4 advertising signals) |
| Preferences | No script here; passed through to Shopify |

- The choice is stored as `lb_cookie_consent_v2` (`{v: 2, analytics, marketing, preferences}`) in localStorage.
  The old single flag `lb_cookie_consent` is read once and migrated (accepted = all granted, rejected = all denied).
- If localStorage is unavailable the choice is held in memory for the visit; the banner returns next visit.
- The banner offers **Reject**, **Customize** (per-category checkboxes) and **Accept All**. The footer's
  **Cookie preferences** button reopens it at any time.
- Choices are pushed to Shopify's Customer Privacy API with categories intact (`sale_of_data` stays `false`).
- Shopify wins when it holds a different decision (a later rejection or revocation, e.g. a Global Privacy Control
  signal): the local record and the trackers follow it. Our saved choice is pushed to Shopify only when Shopify has none.

## 2. What loads, and when

Nothing loads before a choice or for a denied category.

| Tracker | Category | On grant | On revoke |
|---|---|---|---|
| GA4 | Analytics | `gtag.js` with Consent Mode defaults (`analytics_storage` granted; ad signals follow Marketing) | `ga-disable-<ID>` set and Consent Mode `denied`; events stop |
| Meta Pixel | Marketing | `fbq init` + `PageView` | `fbq('consent','revoke')`; events stop; regrant resumes |
| TikTok Pixel | Marketing | `ttq.load` + `ttq.page()` | `ttq.revokeConsent()`; events stop; regrant resumes |
| Klaviyo on-site | Marketing | embed script | no revoke API: nothing new is sent from this app, `__kla_id` is cleared, and the script is gone on the next page load |

Third-party IDs (GA4, Meta, TikTok) are only returned to the browser on the live host. Preview (`*.myshopify.dev`,
`*.shopifypreview.com`) and local hosts get none, so they can never send to production properties. Klaviyo's ID is
kept everywhere because it powers on-site forms (still consent-gated). An unrecognized non-local host is treated as live.

## 3. Event contract

Hydrogen events are mapped by pure functions in `analytics-events.ts` and sent only to a channel that is loaded and granted.
Each Hydrogen event is subscribed once (no duplicates under StrictMode); the load page view is not repeated for the same URL.

| Hydrogen event | GA4 | Meta | TikTok |
|---|---|---|---|
| Page viewed (SPA navigation) | enhanced measurement | `PageView` | `page` |
| Product viewed | `view_item` | `ViewContent` | `ViewContent` |
| Collection viewed | `view_item_list` | — | — |
| Search viewed | `search` | `Search` | `Search` |
| Cart viewed | `view_cart` | — | — |
| Added to cart | `add_to_cart` | `AddToCart` | `AddToCart` |
| Removed from cart | `remove_from_cart` | — | — |
| `begin_checkout` | `begin_checkout` | `InitiateCheckout` | `InitiateCheckout` |

- Shapes: GA4 `{currency, value, items:[{item_id, item_name, item_variant, item_brand, item_category, price, quantity}]}`;
  Meta `{content_type:'product', content_ids, contents, value, currency, num_items}`; TikTok `{contents:[{content_id,
  content_type, content_name, quantity, price}], value, currency}`.
- Add/remove events carry only the units changed, priced per unit.
- Meta/TikTok `content_id` is the numeric Shopify **variant** id (product id when absent). **Owner to confirm** this matches
  the catalog the Meta/TikTok channels sync before ad optimisation depends on it.
- Events are skipped (never sent partial) when currency, a usable id or a usable price is missing.

**Purchase is not sent from this repo.** It happens on Shopify's checkout, so it must come from the checkout-side
integrations (Shopify customer events / the channel apps). Verify it there with a test order; this storefront never places one.
No server-side conversions API (Meta CAPI, TikTok Events API) exists in this repo.

## 4. Web Vitals

`useWebVitals()` (`app/lib/monitoring.ts`) pushes LCP, FCP, CLS and INP into `window.dataLayer` and to Sentry when initialized.
It reaches GA4 only when GA4 is loaded and not opted out.

## 5. Configuration

| Env var | Effect if unset |
|---|---|
| `PUBLIC_GA4_MEASUREMENT_ID` | GA4 never loads |
| `PUBLIC_META_PIXEL_ID` | Meta Pixel never loads |
| `PUBLIC_TIKTOK_PIXEL_ID` | TikTok Pixel never loads |
| `PUBLIC_KLAVIYO_COMPANY_ID` | Klaviyo on-site never loads |
| `PUBLIC_SENTRY_DSN` | Sentry no-ops |

IDs are accepted only if they match `[A-Za-z0-9_-]{1,64}` (they are placed in inline script).

**Still needs owner verification (preview/test properties, not production):** with test IDs, accept all, then in each
vendor's debugger confirm one correctly shaped event per step (view, add, remove, cart, checkout); reject and confirm no
requests; revoke and confirm events stop; confirm the purchase event from the checkout-side integration.
