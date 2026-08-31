import {useCallback, useEffect, useRef, useState} from 'react';
import {AnalyticsEvent, useAnalytics} from '@shopify/hydrogen';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
import {Link} from 'react-router';

/**
 * Analytics component — loads GA4, Meta Pixel, and other tracking scripts
 * AFTER consent is given (GDPR / CCPA compliant).
 *
 * Configure via env vars:
 * - PUBLIC_GA4_MEASUREMENT_ID — Google Analytics 4 measurement ID
 * - PUBLIC_META_PIXEL_ID — Meta (Facebook) Pixel ID
 * - PUBLIC_TIKTOK_PIXEL_ID — TikTok Pixel ID
 * - PUBLIC_KLAVIYO_COMPANY_ID — Klaviyo public API key (on-site embed / popups)
 *
 * If env vars are not set, the scripts simply don't load.
 *
 * NOTE: Klaviyo's on-site embed is gated behind the same consent flow as the
 * other third-party marketing scripts for consistency — the script itself
 * sets Klaviyo tracking cookies and identifies the visitor the moment it
 * loads (independent of whether the visitor ever interacts with a form), so
 * it is treated as marketing/analytics tracking rather than a purely
 * user-initiated action.
 */

// GA4 script
function loadGA4(measurementId: string) {
  if (typeof document === 'undefined') return;

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  (window as {dataLayer?: unknown[]}).dataLayer = (window as {dataLayer?: unknown[]}).dataLayer || [];
  const gtag = (...args: unknown[]) => {
    ((window as {dataLayer?: unknown[]}).dataLayer as unknown[]).push(args);
  };
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId, {
    anonymize_ip: true,
  });
}

// Meta Pixel script
function loadMetaPixel(pixelId: string) {
  if (typeof document === 'undefined') return;

  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);
}

// TikTok Pixel script
function loadTikTokPixel(pixelId: string) {
  if (typeof document === 'undefined') return;

  const script = document.createElement('script');
  script.innerHTML = `
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
      for (var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},n||(n={});var s=Math.round(new Date().getTime()/864e5).toString(),o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&_="+s;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      ttq.load('${pixelId}');
      ttq.page();
    }(window, document, 'ttq');
  `;
  document.head.appendChild(script);
}

// Klaviyo on-site embed — loads Klaviyo-managed on-site forms/popups
// (e.g. the "Join the GOAT Club" form) using the account's public API key.
// Docs: https://help.klaviyo.com/hc/en-us/articles/115005076767
function loadKlaviyo(companyId: string) {
  if (typeof document === 'undefined') return;

  const script = document.createElement('script');
  script.async = true;
  script.type = 'text/javascript';
  script.src = `https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${companyId}`;
  document.head.appendChild(script);
}

interface AnalyticsProps {
  ga4Id?: string;
  metaPixelId?: string;
  tiktokPixelId?: string;
  klaviyoCompanyId?: string;
}

function CommerceAnalyticsBridge() {
  const {subscribe, register} = useAnalytics();

  useEffect(() => {
    const {ready} = register('legendary-commerce-bridge');
    const emit = (event: string, payload: Record<string, unknown>) => {
      if (window.gtag) window.gtag('event', event, payload);
    };

    subscribe(AnalyticsEvent.PRODUCT_VIEWED, (payload) =>
      emit('view_item', {items: payload.products}),
    );
    subscribe(AnalyticsEvent.COLLECTION_VIEWED, (payload) =>
      emit('view_item_list', {item_list_id: payload.collection.id, item_list_name: payload.collection.handle}),
    );
    subscribe(AnalyticsEvent.SEARCH_VIEWED, (payload) =>
      emit('search', {search_term: payload.searchTerm}),
    );
    subscribe(AnalyticsEvent.CART_VIEWED, (payload) =>
      emit('view_cart', {cart: payload.cart}),
    );
    subscribe(AnalyticsEvent.PRODUCT_ADD_TO_CART, (payload) =>
      emit('add_to_cart', {cart: payload.cart, item: payload.currentLine}),
    );
    subscribe(AnalyticsEvent.PRODUCT_REMOVED_FROM_CART, (payload) =>
      emit('remove_from_cart', {cart: payload.cart, item: payload.prevLine}),
    );
    subscribe(AnalyticsEvent.CUSTOM_EVENT, (payload) => {
      if (payload.eventName === 'begin_checkout') {
        emit('begin_checkout', {cart: payload.cart});
      }
    });
    ready();
  }, [register, subscribe]);

  return null;
}

// Our own first-party record of the visitor's choice, source of truth for
// whether the banner shows. Previously this relied entirely on Shopify's
// Customer Privacy API (`currentVisitorConsent()`/`visitorConsentCollected`)
// reflecting a prior `setTrackingConsent()` call by the time this component
// re-mounts on the next page load -- in practice that kept reporting
// "undecided" on refresh regardless of timing workarounds, so the banner
// never stayed dismissed. Storing our own flag removes that dependency
// entirely for the UI decision; `setTrackingConsent` is still called so
// Shopify's own consent-gated behavior (analytics processing, etc.) is
// still informed of the choice.
const CONSENT_STORAGE_KEY = 'lb_cookie_consent';
type StoredConsent = 'accepted' | 'rejected';

function readStoredConsent(): StoredConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    return null;
  }
}

function writeStoredConsent(value: StoredConsent) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Storage unavailable (private browsing, quota) -- the banner will just
    // show again next visit, which is the safe direction to fail in.
  }
}

export default function Analytics({
  ga4Id,
  metaPixelId,
  tiktokPixelId,
  klaviyoCompanyId,
}: AnalyticsProps) {
  const {customerPrivacy} = useAnalytics();
  const [showBanner, setShowBanner] = useState(false);
  const scriptsLoadedRef = useRef(false);

  const loadScriptsOnce = useCallback(() => {
    // Ref-guarded rather than state-guarded: this can be invoked from more
    // than one place (initial mount, handleAccept), and under StrictMode's
    // dev double-invoke a state-updater guard can still let both passes
    // through before either commit lands, loading every script twice. A
    // ref reads/writes synchronously, so the second call always sees the
    // first call's write.
    if (scriptsLoadedRef.current) return;
    scriptsLoadedRef.current = true;
    if (ga4Id) loadGA4(ga4Id);
    if (metaPixelId) loadMetaPixel(metaPixelId);
    if (tiktokPixelId) loadTikTokPixel(tiktokPixelId);
    if (klaviyoCompanyId) loadKlaviyo(klaviyoCompanyId);
  }, [ga4Id, metaPixelId, tiktokPixelId, klaviyoCompanyId]);

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored === 'accepted') {
      setShowBanner(false);
      loadScriptsOnce();
      return;
    }
    if (stored === 'rejected') {
      setShowBanner(false);
      return;
    }
    // No local record yet. This could be a genuinely new visitor, or one
    // who already accepted/rejected under the previous Shopify-only flow
    // (before this localStorage-based fix shipped) -- in which case
    // Shopify's API still knows their choice even though we don't yet.
    // Give the reconciliation effect below a brief window to migrate that
    // value in before defaulting to "show the banner", so those visitors
    // aren't re-prompted during the rollout.
    let cancelled = false;
    const fallback = setTimeout(() => {
      if (!cancelled && !readStoredConsent()) setShowBanner(true);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, [loadScriptsOnce]);

  // Reconciles our first-party record against Shopify's Customer Privacy
  // API in both directions: migrates in a decision made under the old
  // flow (or elsewhere, e.g. Shopify's own consent UI) that we don't have
  // locally yet, and pushes our own decision to Shopify when it has none.
  // Runs on mount and again whenever Shopify reports a change, so a newer
  // decision made outside this banner (a later rejection, an expired
  // consent) overrides a stale local copy rather than the reverse.
  useEffect(() => {
    if (!customerPrivacy) return;

    const reconcile = () => {
      const visitorConsent = customerPrivacy.currentVisitorConsent();
      const shopifyState: StoredConsent | null =
        visitorConsent.analytics === true
          ? 'accepted'
          : visitorConsent.analytics === false
            ? 'rejected'
            : null;
      const stored = readStoredConsent();

      if (shopifyState && shopifyState !== stored) {
        writeStoredConsent(shopifyState);
        setShowBanner(false);
        if (shopifyState === 'accepted') loadScriptsOnce();
        return;
      }

      if (stored && !shopifyState) {
        customerPrivacy.setTrackingConsent(
          {
            analytics: stored === 'accepted',
            marketing: stored === 'accepted',
            preferences: stored === 'accepted',
            sale_of_data: false,
          },
          (result) => result?.error && console.error('[privacy] Unable to sync stored consent'),
        );
      }
    };

    reconcile();
    document.addEventListener('visitorConsentCollected', reconcile);
    return () => document.removeEventListener('visitorConsentCollected', reconcile);
  }, [customerPrivacy, loadScriptsOnce]);

  function handleAccept() {
    writeStoredConsent('accepted');
    setShowBanner(false);
    loadScriptsOnce();
    customerPrivacy?.setTrackingConsent(
      {analytics: true, marketing: true, preferences: true, sale_of_data: false},
      (result) => result?.error && console.error('[privacy] Unable to save consent'),
    );
  }

  function handleReject() {
    writeStoredConsent('rejected');
    setShowBanner(false);
    customerPrivacy?.setTrackingConsent(
      {analytics: false, marketing: false, preferences: false, sale_of_data: false},
      (result) => result?.error && console.error('[privacy] Unable to save consent'),
    );
  }

  return (
    <>
      <CommerceAnalyticsBridge />
      {/* Consent banner */}
      {showBanner && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-foreground)] text-[var(--color-text-inverse)] p-4 md:p-6"
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
        >
          <div className="h-container flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">We value your privacy</p>
              <p className="text-xs text-[var(--color-text-inverse)]/70 leading-relaxed">
                We use cookies and similar technologies to analyze traffic and improve your experience.
                You can accept or reject non-essential tracking.
                {' '}
                <Link
                  to="/policies/privacy-with-legendary-branding"
                  className="underline underline-offset-2 hover:text-[var(--color-text-inverse)] transition-colors"
                >
                  Learn more
                </Link>
                .
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={handleReject}
                className="text-xs font-medium tracking-widest uppercase border border-[var(--color-text-inverse)]/30 px-6 py-3 hover:bg-[var(--color-background)]/10 transition-colors"
                aria-label="Reject non-essential cookies"
              >
                Reject
              </button>
              <button
                onClick={handleAccept}
                className="text-xs font-semibold tracking-widest uppercase bg-[var(--color-background)] text-[var(--color-foreground)] px-6 py-3 hover:bg-[var(--color-bg-level-2)]/90 transition-colors"
                aria-label="Accept all cookies"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
