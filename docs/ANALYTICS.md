# Analytics — Legendary Branding Headless Storefront

Grounded entirely in `app/components/seo/Analytics.tsx` (the only analytics-pixel component in the
repo) plus `app/root.tsx`, `app/lib/monitoring.ts`, `env.d.ts`, and `.env.example`. No event
tracking is asserted here beyond what is actually wired in code.

---

## 1. Consent Model

`Analytics.tsx` implements a cookie-based consent gate (`lb_consent`, 365-day expiry, `SameSite=Lax`,
`Secure` when served over HTTPS). Three states: `accepted`, `rejected`, `undecided`.

- On mount, it reads the existing cookie. If `undecided`, it renders a consent banner
  (`role="dialog"`, `aria-live="polite"`, `aria-label="Cookie consent"`) with **Reject** and
  **Accept All** buttons.
- If already `accepted`, it loads every configured pixel immediately on mount — no re-prompt.
- If already `rejected`, nothing loads and no banner is shown.
- **Accept** → sets the cookie, hides the banner, loads GA4/Meta/TikTok (whichever have an ID
  configured).
- **Reject** → sets the cookie, hides the banner. No scripts load.

There is no separate/granular consent per vendor (e.g. "GA4 yes, Meta no") — it is a single
accept/reject decision that gates all three pixels together.

---

## 2. What Loads, and When

### Google Analytics 4 (`loadGA4`)
Injects `https://www.googletagmanager.com/gtag/js?id=<PUBLIC_GA4_MEASUREMENT_ID>`, initializes
`window.dataLayer`, and calls `gtag('config', measurementId, {anonymize_ip: true})`. This is a
standard GA4 pageview/config call — no custom GA4 events (purchase, add_to_cart, etc.) are sent
from this function.

### Meta (Facebook) Pixel (`loadMetaPixel`)
Injects the standard Meta Pixel bootstrap snippet, calls `fbq('init', pixelId)` then
`fbq('track', 'PageView')`. Only `PageView` is tracked — no `Purchase`, `AddToCart`, or
`InitiateCheckout` events are fired anywhere in this component or elsewhere in the codebase
(verified: `Analytics.tsx` is the only place `fbq(` appears).

### TikTok Pixel (`loadTikTokPixel`)
Injects the standard TikTok pixel loader, calls `ttq.load(pixelId)` then `ttq.page()`. Only the
page-view call (`ttq.page()`) fires — no custom TikTok events.

### Web Vitals → GA4 dataLayer
Separately, `useWebVitals()` in `app/lib/monitoring.ts` (called from `app/root.tsx`) pushes LCP,
FCP, CLS, and INP measurements into `window.dataLayer` as a `web_vitals` event, and to Sentry as a
distribution metric when the Sentry client is initialized. This only reaches GA4 if the GA4 script
above has already loaded (i.e., only after consent is accepted and `gtag.js` is present) —
`window.dataLayer.push` before `gtag.js` loads just buffers the event array without an active GA4
session config attached yet, consistent with how gtag's async queue is designed to work.

---

## 3. Event Coverage — What Is and Isn't Implemented

**Implemented:** page-view tracking only, for each of the three pixels, gated behind consent, plus
Web Vitals pushed to the GA4 dataLayer and to Sentry.

**Not implemented — stated explicitly, not left ambiguous:**
- No custom `add_to_cart` / `AddToCart` event tracking anywhere in the codebase for any of the
  three pixels.
- No `purchase` / `Purchase` / checkout-completed event tracking — the app redirects to
  Shopify-hosted checkout (per `CLAUDE.md`, checkout is out of scope for this headless storefront),
  and no client-side purchase event is fired before that redirect.
- No `begin_checkout` / `InitiateCheckout` event on the "proceed to checkout" action.
- No Shopify `Analytics.Provider` (Hydrogen's built-in analytics component) is used anywhere —
  grep of `app/root.tsx` and the rest of `app/` for `Analytics.Provider` returns no matches. All
  analytics in this app come from the hand-rolled `Analytics.tsx` component described above, not
  from Hydrogen's built-in subscriber system.
- No server-side conversions API (Meta CAPI, TikTok Events API) integration exists in this repo.

**Conclusion:** the only analytics currently implemented, end to end, is consent-gated page-view
tracking across GA4/Meta/TikTok plus Web Vitals reporting. Anyone relying on this storefront for
purchase-funnel or add-to-cart analytics today has no data source for that from this codebase —
it would need to be built.

---

## 4. Configuration

Each pixel is entirely optional and independently toggled by whether its env var is set — read
from `env.d.ts` and `.env.example`:

| Env var | Declared in `env.d.ts` | Declared in `.env.example` | Effect if unset |
|---|---|---|---|
| `PUBLIC_GA4_MEASUREMENT_ID` | Yes | Yes | GA4 script never loads |
| `PUBLIC_META_PIXEL_ID` | Yes | Yes | Meta Pixel script never loads |
| `PUBLIC_TIKTOK_PIXEL_ID` | Yes | Yes | TikTok Pixel script never loads |
| `PUBLIC_SENTRY_DSN` | Yes | Yes | Sentry (both client and server) no-ops; Web Vitals still push to `dataLayer` but not to Sentry |

All four are documented with empty placeholders in `.env.example` (comment: "Leave empty to
disable each feature"), consistent with the code's behavior of loading nothing when the ID/DSN is
absent.

**Unverified — needs owner confirmation:** whether these four vars are actually set with real IDs
in the live Oxygen environment (production and/or preview). The code path exists and degrades
safely to "off" either way, but that means analytics could currently be silently disabled in
production if the IDs were never set there. This mirrors the same open question already logged in
`docs/PRODUCTION_READINESS.md` §4 (item 5, Sentry DSN) — the same applies to the three pixel IDs.
