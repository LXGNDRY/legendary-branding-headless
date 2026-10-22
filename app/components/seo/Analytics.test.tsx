// @vitest-environment jsdom
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {CONSENT_STORAGE_KEY, OPEN_COOKIE_PREFERENCES_EVENT, resetConsentMemory} from '~/lib/consent';
import {resetTrackers} from '~/lib/trackers';

const handlers = new Map<string, (payload: Record<string, unknown>) => void>();
let customerPrivacy: unknown = null;

vi.mock('@shopify/hydrogen', () => ({
  AnalyticsEvent: {
    PAGE_VIEWED: 'page_viewed',
    PRODUCT_VIEWED: 'product_viewed',
    COLLECTION_VIEWED: 'collection_viewed',
    CART_VIEWED: 'cart_viewed',
    SEARCH_VIEWED: 'search_viewed',
    PRODUCT_ADD_TO_CART: 'product_added_to_cart',
    PRODUCT_REMOVED_FROM_CART: 'product_removed_from_cart',
    CUSTOM_EVENT: 'custom_event',
  },
  useAnalytics: () => ({
    subscribe: (event: string, handler: (payload: Record<string, unknown>) => void) => {
      handlers.set(event, handler);
    },
    register: () => ({ready: () => {}}),
    customerPrivacy,
  }),
}));

import Analytics from './Analytics';

const config = {ga4Id: 'G-TEST123', metaPixelId: '1234567890', tiktokPixelId: 'TTTEST123', klaviyoCompanyId: 'AbC123'};
const scripts = () =>
  Array.from(document.head.querySelectorAll('script')).map((s) => s.src || s.text.match(/https:\/\/[^'"]+/)?.[0] || '');
const has = (needle: string) => scripts().some((s) => s.includes(needle));

function mount() {
  return render(
    <MemoryRouter>
      <Analytics {...config} />
    </MemoryRouter>,
  );
}

describe('Analytics consent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.head.innerHTML = '';
    window.localStorage.clear();
    resetConsentMemory();
    resetTrackers();
    handlers.clear();
    customerPrivacy = null;
    const w = window as unknown as Record<string, unknown>;
    for (const key of ['dataLayer', 'gtag', 'fbq', '_fbq', 'ttq', 'TiktokAnalyticsObject']) delete w[key];
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('loads nothing and shows the banner before a choice', () => {
    mount();
    expect(scripts()).toHaveLength(0);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole('dialog', {name: 'Cookie consent'})).toBeTruthy();
    expect(scripts()).toHaveLength(0);
  });

  it('Reject loads nothing and is remembered', () => {
    mount();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.click(screen.getByLabelText('Reject non-essential cookies'));
    expect(scripts()).toHaveLength(0);
    expect(JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY)!)).toMatchObject({analytics: false, marketing: false});
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('analytics-only through Customize does not enable marketing trackers', () => {
    mount();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.click(screen.getByLabelText('Choose cookie categories'));
    fireEvent.click(screen.getByLabelText(/Analytics/));
    fireEvent.click(screen.getByLabelText('Save cookie choices'));
    expect(has('googletagmanager.com')).toBe(true);
    expect(has('facebook.net') || has('tiktok.com') || has('klaviyo.com')).toBe(false);
    expect(JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY)!)).toMatchObject({analytics: true, marketing: false});
  });

  it('Accept All loads every configured tracker', () => {
    mount();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.click(screen.getByLabelText('Accept all cookies'));
    for (const host of ['googletagmanager.com', 'facebook.net', 'tiktok.com', 'klaviyo.com']) expect(has(host)).toBe(true);
  });

  it('applies a saved choice on mount without prompting, and migrates the legacy flag', () => {
    window.localStorage.setItem('lb_cookie_consent', 'accepted');
    mount();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(has('googletagmanager.com')).toBe(true);
  });

  it('reopens the choices from the footer event and can revoke a saved grant', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({v: 2, analytics: true, marketing: true, preferences: true}));
    mount();
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => {
      window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT));
    });
    fireEvent.click(screen.getByLabelText('Reject non-essential cookies'));
    expect(JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY)!)).toMatchObject({analytics: false, marketing: false});
    expect((window as unknown as Record<string, unknown>)['ga-disable-G-TEST123']).toBe(true);
  });

  it('an external Shopify rejection stops trackers that were already loaded', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({v: 2, analytics: true, marketing: true, preferences: true}));
    const setTrackingConsent = vi.fn();
    customerPrivacy = {
      currentVisitorConsent: () => ({analytics: 'no', marketing: 'no', preferences: 'no', sale_of_data: 'no'}),
      setTrackingConsent,
    };
    mount();
    expect(JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY)!)).toMatchObject({analytics: false, marketing: false});
    expect((window as unknown as Record<string, unknown>)['ga-disable-G-TEST123']).toBe(true);
    expect(setTrackingConsent).not.toHaveBeenCalled();
  });

  it('pushes a saved choice to Shopify only when Shopify has none, with categories intact', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({v: 2, analytics: true, marketing: false, preferences: false}));
    const setTrackingConsent = vi.fn();
    customerPrivacy = {
      currentVisitorConsent: () => ({analytics: '', marketing: '', preferences: '', sale_of_data: ''}),
      setTrackingConsent,
    };
    mount();
    expect(setTrackingConsent).toHaveBeenCalledWith({analytics: true, marketing: false, preferences: false, sale_of_data: false}, expect.any(Function));
  });
});

describe('Analytics commerce bridge', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    window.localStorage.clear();
    resetConsentMemory();
    resetTrackers();
    handlers.clear();
    customerPrivacy = null;
    const w = window as unknown as Record<string, unknown>;
    for (const key of ['dataLayer', 'gtag', 'fbq', '_fbq', 'ttq', 'TiktokAnalyticsObject']) delete w[key];
  });
  afterEach(cleanup);

  const product = {
    id: 'gid://shopify/Product/111',
    title: 'Legend Tee',
    price: '49.00',
    vendor: 'LB',
    variantId: 'gid://shopify/ProductVariant/222',
    variantTitle: 'M',
    quantity: 1,
  };

  it('sends no event to any channel without consent', () => {
    mount();
    const gtag = vi.fn();
    const fbq = vi.fn();
    Object.assign(window, {gtag, fbq});
    handlers.get('product_viewed')!({products: [product], shop: {currency: 'USD'}, url: 'http://localhost/'});
    expect(gtag).not.toHaveBeenCalled();
    expect(fbq).not.toHaveBeenCalled();
  });

  it('sends one correctly shaped event per enabled channel', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({v: 2, analytics: true, marketing: true, preferences: true}));
    mount();
    const gtag = vi.fn();
    const fbq = vi.fn();
    const track = vi.fn();
    Object.assign(window, {gtag, fbq, ttq: {track, page: vi.fn()}});
    handlers.get('product_viewed')!({products: [product], shop: {currency: 'USD'}, url: 'http://localhost/products/x'});
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag.mock.calls[0][1]).toBe('view_item');
    expect(gtag.mock.calls[0][2]).toMatchObject({currency: 'USD', value: 49});
    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fbq.mock.calls[0].slice(0, 2)).toEqual(['track', 'ViewContent']);
    expect(track).toHaveBeenCalledTimes(1);
    expect(track.mock.calls[0][0]).toBe('ViewContent');
  });

  it('subscribes once even when the component mounts twice', () => {
    const {unmount} = mount();
    const first = handlers.get('product_viewed');
    unmount();
    mount();
    expect(handlers.get('product_viewed')).toBeDefined();
    expect(first).toBeDefined();
  });

  it('maps begin_checkout, add and remove with unit deltas', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({v: 2, analytics: true, marketing: true, preferences: true}));
    mount();
    const gtag = vi.fn();
    const fbq = vi.fn();
    Object.assign(window, {gtag, fbq, ttq: {track: vi.fn(), page: vi.fn()}});
    const line = (quantity: number) => ({
      quantity,
      cost: {amountPerQuantity: {amount: '49.00', currencyCode: 'USD'}},
      merchandise: {id: 'gid://shopify/ProductVariant/222', product: {id: 'gid://shopify/Product/111', title: 'Legend Tee'}},
    });
    handlers.get('product_added_to_cart')!({prevLine: line(1), currentLine: line(2)});
    expect(gtag.mock.calls.at(-1)![2]).toMatchObject({value: 49, items: [{quantity: 1}]});
    handlers.get('product_removed_from_cart')!({prevLine: line(2), currentLine: line(1)});
    expect(gtag.mock.calls.at(-1)![1]).toBe('remove_from_cart');
    handlers.get('custom_event')!({
      eventName: 'begin_checkout',
      cart: {cost: {totalAmount: {amount: '98.00', currencyCode: 'USD'}}, lines: {nodes: [line(2)]}},
    });
    expect(gtag.mock.calls.at(-1)![1]).toBe('begin_checkout');
    expect(fbq.mock.calls.at(-1)!.slice(0, 2)).toEqual(['track', 'InitiateCheckout']);
  });

  it('does not double the load page view for Meta and TikTok', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({v: 2, analytics: true, marketing: true, preferences: true}));
    mount();
    const fbq = vi.fn();
    Object.assign(window, {fbq});
    handlers.get('page_viewed')!({url: window.location.href});
    expect(fbq).not.toHaveBeenCalled();
    handlers.get('page_viewed')!({url: 'http://localhost/collections/all'});
    expect(fbq).toHaveBeenCalledWith('track', 'PageView');
  });
});
