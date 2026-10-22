// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ALL_DENIED, ALL_GRANTED} from '~/lib/consent';
import {applyConsent, isChannelActive, resetTrackers, shouldTrackPageView, trackEvent} from '~/lib/trackers';

const config = {ga4Id: 'G-TEST123', metaPixelId: '1234567890', tiktokPixelId: 'TTTEST123', klaviyoCompanyId: 'AbC123'};

const loadedHosts = () =>
  Array.from(document.head.querySelectorAll('script')).map((s) => s.src || s.text.match(/https:\/\/[^'"]+/)?.[0] || '');
const loaded = (needle: string) => loadedHosts().some((h) => h.includes(needle));

describe('applyConsent', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    resetTrackers();
    const w = window as unknown as Record<string, unknown>;
    for (const key of ['dataLayer', 'gtag', 'fbq', '_fbq', 'ttq', 'TiktokAnalyticsObject']) delete w[key];
    delete w['ga-disable-G-TEST123'];
  });
  afterEach(() => vi.restoreAllMocks());

  it('loads nothing before a choice or after rejecting everything', () => {
    applyConsent(config, null);
    applyConsent(config, ALL_DENIED);
    expect(document.head.querySelectorAll('script')).toHaveLength(0);
    expect(trackEvent('ga4', 'view_item', {})).toBe(false);
  });

  it('analytics-only loads GA4 and none of the marketing trackers', () => {
    applyConsent(config, {analytics: true, marketing: false, preferences: false});
    expect(loaded('googletagmanager.com')).toBe(true);
    expect(loaded('facebook.net')).toBe(false);
    expect(loaded('tiktok.com')).toBe(false);
    expect(loaded('klaviyo.com')).toBe(false);
  });

  it('marketing-only loads Meta, TikTok and Klaviyo but not GA4', () => {
    applyConsent(config, {analytics: false, marketing: true, preferences: false});
    expect(loaded('googletagmanager.com')).toBe(false);
    expect(loaded('facebook.net')).toBe(true);
    expect(loaded('tiktok.com')).toBe(true);
    expect(loaded('klaviyo.com')).toBe(true);
  });

  it('does not load a tracker twice', () => {
    applyConsent(config, ALL_GRANTED);
    const count = document.head.querySelectorAll('script').length;
    applyConsent(config, ALL_GRANTED);
    expect(document.head.querySelectorAll('script')).toHaveLength(count);
  });

  it('starts GA4 with advertising signals denied unless marketing is granted', () => {
    applyConsent(config, {analytics: true, marketing: false, preferences: false});
    const entries = (window as unknown as {dataLayer: ArrayLike<unknown>[]}).dataLayer.map((e) => Array.from(e));
    expect(entries[0]).toEqual(['consent', 'default', {analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'}]);
  });

  it('revoking analytics stops GA4 events and sets the opt-out flag and denial', () => {
    applyConsent(config, ALL_GRANTED);
    expect(isChannelActive('ga4')).toBe(true);
    applyConsent(config, {analytics: false, marketing: true, preferences: true});
    expect(isChannelActive('ga4')).toBe(false);
    expect((window as unknown as Record<string, unknown>)['ga-disable-G-TEST123']).toBe(true);
    const updates = (window as unknown as {dataLayer: ArrayLike<unknown>[]}).dataLayer.map((e) => Array.from(e)).filter((e) => e[0] === 'consent' && e[1] === 'update');
    expect(updates.at(-1)![2]).toMatchObject({analytics_storage: 'denied'});
    expect(trackEvent('ga4', 'add_to_cart', {})).toBe(false);
  });

  it('revoking marketing revokes Meta and TikTok and stops their events', () => {
    applyConsent(config, ALL_GRANTED);
    const fbq = vi.fn();
    const revokeConsent = vi.fn();
    Object.assign(window, {fbq, ttq: {revokeConsent, track: vi.fn(), page: vi.fn()}});
    applyConsent(config, {analytics: true, marketing: false, preferences: true});
    expect(fbq).toHaveBeenCalledWith('consent', 'revoke');
    expect(revokeConsent).toHaveBeenCalled();
    expect(trackEvent('meta', 'AddToCart', {})).toBe(false);
    expect(trackEvent('tiktok', 'AddToCart', {})).toBe(false);
  });

  it('regranting after a revocation resumes without reloading the script', () => {
    applyConsent(config, ALL_GRANTED);
    const count = document.head.querySelectorAll('script').length;
    const fbq = vi.fn();
    Object.assign(window, {fbq});
    applyConsent(config, ALL_DENIED);
    applyConsent(config, ALL_GRANTED);
    expect(document.head.querySelectorAll('script')).toHaveLength(count);
    expect(fbq).toHaveBeenCalledWith('consent', 'grant');
    expect(isChannelActive('meta')).toBe(true);
  });

  it('sends each event to exactly the channel that is loaded and granted', () => {
    applyConsent(config, {analytics: true, marketing: false, preferences: false});
    const gtag = vi.fn();
    const fbq = vi.fn();
    Object.assign(window, {gtag, fbq});
    expect(trackEvent('ga4', 'view_item', {value: 1})).toBe(true);
    expect(trackEvent('meta', 'ViewContent', {value: 1})).toBe(false);
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith('event', 'view_item', {value: 1});
    expect(fbq).not.toHaveBeenCalled();
  });

  it('refuses ids that could break out of the inline snippet', () => {
    applyConsent({ga4Id: "G-1'); alert(1);//", metaPixelId: "1'); alert(1);//", tiktokPixelId: "x'); alert(1);//"}, ALL_GRANTED);
    expect(document.head.querySelectorAll('script')).toHaveLength(0);
  });

  it('counts the load view once and then only new URLs', () => {
    applyConsent(config, ALL_GRANTED);
    expect(shouldTrackPageView(window.location.href)).toBe(false);
    expect(shouldTrackPageView('http://localhost/next')).toBe(true);
    expect(shouldTrackPageView('http://localhost/next')).toBe(false);
  });
});
