import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AnalyticsEvent, useAnalytics} from '@shopify/hydrogen';
import {LocaleLink as Link} from '~/components/ui/LocaleLink';
import {
  ALL_DENIED,
  ALL_GRANTED,
  OPEN_COOKIE_PREFERENCES_EVENT,
  consentFromShopify,
  consentToShopify,
  readConsent,
  reconcileConsent,
  writeConsent,
  type ConsentState,
} from '~/lib/consent';
import {
  basketFromCart,
  basketFromLineChange,
  basketFromProducts,
  ga4Basket,
  metaBasket,
  metaViewContent,
  numericId,
  tiktokBasket,
  type CartInput,
  type CartLineInput,
  type ProductInput,
} from '~/lib/analytics-events';
import {applyConsent, shouldTrackPageView, trackEvent, type TrackerConfig} from '~/lib/trackers';

/**
 * Loads GA4, Meta Pixel, TikTok Pixel and the Klaviyo on-site embed only for the categories the visitor
 * granted (analytics: GA4; marketing: Meta, TikTok, Klaviyo), switches them off when a category is revoked,
 * and bridges Hydrogen's commerce events to each enabled channel. See docs/ANALYTICS.md.
 *
 * Configure via env vars (an unset ID simply never loads; the root loader also withholds the third-party IDs
 * on preview and local hosts):
 * - PUBLIC_GA4_MEASUREMENT_ID, PUBLIC_META_PIXEL_ID, PUBLIC_TIKTOK_PIXEL_ID, PUBLIC_KLAVIYO_COMPANY_ID
 */

function CommerceAnalyticsBridge() {
  const {subscribe, register} = useAnalytics();
  // Hydrogen has no unsubscribe, so subscribe exactly once per mount lifetime (StrictMode re-runs effects).
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;
    const {ready} = register('legendary-commerce-bridge');

    subscribe(AnalyticsEvent.PAGE_VIEWED, (payload) => {
      if (!shouldTrackPageView(payload.url)) return;
      trackEvent('meta', 'PageView');
      trackEvent('tiktok', 'page');
    });
    subscribe(AnalyticsEvent.PRODUCT_VIEWED, (payload) => {
      const basket = basketFromProducts(payload.products as ProductInput[], payload.shop?.currency);
      if (!basket) return;
      trackEvent('ga4', 'view_item', ga4Basket(basket));
      trackEvent('meta', 'ViewContent', metaViewContent(basket));
      trackEvent('tiktok', 'ViewContent', tiktokBasket(basket));
    });
    subscribe(AnalyticsEvent.COLLECTION_VIEWED, (payload) => {
      trackEvent('ga4', 'view_item_list', {
        item_list_id: numericId(payload.collection.id) ?? payload.collection.id,
        item_list_name: payload.collection.handle,
      });
    });
    subscribe(AnalyticsEvent.SEARCH_VIEWED, (payload) => {
      if (!payload.searchTerm) return;
      trackEvent('ga4', 'search', {search_term: payload.searchTerm});
      trackEvent('meta', 'Search', {search_string: payload.searchTerm});
      trackEvent('tiktok', 'Search', {query: payload.searchTerm});
    });
    subscribe(AnalyticsEvent.CART_VIEWED, (payload) => {
      const basket = basketFromCart(payload.cart as CartInput);
      if (basket) trackEvent('ga4', 'view_cart', ga4Basket(basket));
    });
    subscribe(AnalyticsEvent.PRODUCT_ADD_TO_CART, (payload) => {
      const basket = basketFromLineChange('add', {
        previous: payload.prevLine as CartLineInput | undefined,
        current: payload.currentLine as CartLineInput | undefined,
      });
      if (!basket) return;
      trackEvent('ga4', 'add_to_cart', ga4Basket(basket));
      trackEvent('meta', 'AddToCart', metaBasket(basket));
      trackEvent('tiktok', 'AddToCart', tiktokBasket(basket));
    });
    subscribe(AnalyticsEvent.PRODUCT_REMOVED_FROM_CART, (payload) => {
      const basket = basketFromLineChange('remove', {
        previous: payload.prevLine as CartLineInput | undefined,
        current: payload.currentLine as CartLineInput | undefined,
      });
      if (basket) trackEvent('ga4', 'remove_from_cart', ga4Basket(basket));
    });
    subscribe(AnalyticsEvent.CUSTOM_EVENT, (payload) => {
      if (payload.eventName !== 'begin_checkout') return;
      const basket = basketFromCart(payload.cart as CartInput);
      if (!basket) return;
      trackEvent('ga4', 'begin_checkout', ga4Basket(basket));
      trackEvent('meta', 'InitiateCheckout', metaBasket(basket));
      trackEvent('tiktok', 'InitiateCheckout', tiktokBasket(basket));
    });
    ready();
  }, [register, subscribe]);

  return null;
}

type AnalyticsProps = TrackerConfig;

const CATEGORY_COPY: Array<{key: keyof ConsentState; label: string; detail: string}> = [
  {key: 'analytics', label: 'Analytics', detail: 'Measures traffic and how the store is used (Google Analytics).'},
  {key: 'marketing', label: 'Marketing', detail: 'Ad measurement and on-site signup forms (Meta, TikTok, Klaviyo).'},
  {key: 'preferences', label: 'Preferences', detail: 'Remembers choices such as region and language.'},
];

export default function Analytics({ga4Id, metaPixelId, tiktokPixelId, klaviyoCompanyId}: AnalyticsProps) {
  const {customerPrivacy} = useAnalytics();
  const config = useMemo<TrackerConfig>(
    () => ({ga4Id, metaPixelId, tiktokPixelId, klaviyoCompanyId}),
    [ga4Id, metaPixelId, tiktokPixelId, klaviyoCompanyId],
  );
  const [showBanner, setShowBanner] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [draft, setDraft] = useState<ConsentState>(ALL_DENIED);

  const adopt = useCallback(
    (next: ConsentState) => {
      setDraft(next);
      setShowBanner(false);
      setCustomizing(false);
      applyConsent(config, next);
    },
    [config],
  );

  // Saved choice first; with none, give the Shopify reconciliation below a brief window to migrate a decision
  // made elsewhere before prompting, so visitors who already chose are not asked again.
  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      setDraft(stored);
      setShowBanner(false);
      applyConsent(config, stored);
      return;
    }
    applyConsent(config, null);
    let cancelled = false;
    const fallback = setTimeout(() => {
      if (!cancelled && !readConsent()) setShowBanner(true);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, [config]);

  // Shopify wins when it holds a different decision (a later rejection or revocation), and our saved choice is
  // pushed to Shopify only when Shopify has none. Re-runs whenever Shopify reports a change.
  useEffect(() => {
    if (!customerPrivacy) return;
    const reconcile = () => {
      const result = reconcileConsent(readConsent(), consentFromShopify(customerPrivacy.currentVisitorConsent()));
      if (result.action === 'adopt') {
        writeConsent(result.state);
        adopt(result.state);
      } else if (result.action === 'push') {
        customerPrivacy.setTrackingConsent(
          consentToShopify(result.state),
          (response) => response?.error && console.error('[privacy] Unable to sync stored consent'),
        );
      }
    };
    reconcile();
    document.addEventListener('visitorConsentCollected', reconcile);
    return () => document.removeEventListener('visitorConsentCollected', reconcile);
  }, [customerPrivacy, adopt]);

  useEffect(() => {
    const open = () => {
      setDraft(readConsent() ?? ALL_DENIED);
      setCustomizing(true);
      setShowBanner(true);
    };
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, open);
  }, []);

  function choose(next: ConsentState) {
    writeConsent(next);
    adopt(next);
    customerPrivacy?.setTrackingConsent(
      consentToShopify(next),
      (response) => response?.error && console.error('[privacy] Unable to save consent'),
    );
  }

  const buttonBase = 'text-xs tracking-widest uppercase px-6 py-3 transition-colors';

  return (
    <>
      <CommerceAnalyticsBridge />
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
                You can accept all, reject all, or choose by category.
                {' '}
                <Link
                  to="/policies/privacy-with-legendary-branding"
                  className="underline underline-offset-2 hover:text-[var(--color-text-inverse)] transition-colors"
                >
                  Learn more
                </Link>
                .
              </p>
              {customizing && (
                <fieldset className="mt-3 space-y-2">
                  <legend className="sr-only">Cookie categories</legend>
                  <label className="flex items-start gap-2 text-xs opacity-70">
                    <input type="checkbox" checked disabled className="mt-0.5" />
                    <span>
                      <span className="font-medium">Necessary</span> — cart, checkout and security. Always on.
                    </span>
                  </label>
                  {CATEGORY_COPY.map(({key, label, detail}) => (
                    <label key={key} className="flex items-start gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={draft[key]}
                        onChange={(event) => setDraft((current) => ({...current, [key]: event.target.checked}))}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-medium">{label}</span> — {detail}
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                type="button"
                onClick={() => choose({...ALL_DENIED})}
                className={`${buttonBase} font-medium border border-[var(--color-text-inverse)]/30 hover:bg-[var(--color-background)]/10`}
                aria-label="Reject non-essential cookies"
              >
                Reject
              </button>
              {customizing ? (
                <button
                  type="button"
                  onClick={() => choose({...draft})}
                  className={`${buttonBase} font-medium border border-[var(--color-text-inverse)]/30 hover:bg-[var(--color-background)]/10`}
                  aria-label="Save cookie choices"
                >
                  Save choices
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(readConsent() ?? ALL_DENIED);
                    setCustomizing(true);
                  }}
                  className={`${buttonBase} font-medium border border-[var(--color-text-inverse)]/30 hover:bg-[var(--color-background)]/10`}
                  aria-label="Choose cookie categories"
                >
                  Customize
                </button>
              )}
              <button
                type="button"
                onClick={() => choose({...ALL_GRANTED})}
                className={`${buttonBase} font-semibold bg-[var(--color-background)] text-[var(--color-foreground)] hover:bg-[var(--color-bg-level-2)]/90`}
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
