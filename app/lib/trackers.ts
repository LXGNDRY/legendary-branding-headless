/**
 * Third-party tracker lifecycle: load only for a granted category, switch off when it is revoked, and send an
 * event only while the channel is both loaded and granted. Browser only; every function no-ops on the server.
 */
import type {ConsentState} from '~/lib/consent';
import {markKlaviyoOnsiteLoading} from '~/lib/klaviyo-onsite';

export type TrackerConfig = {
  ga4Id?: string;
  metaPixelId?: string;
  tiktokPixelId?: string;
  klaviyoCompanyId?: string;
};

export type Channel = 'ga4' | 'meta' | 'tiktok';

type Win = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  ttq?: Record<string, (...args: unknown[]) => void>;
  [key: `ga-disable-${string}`]: boolean | undefined;
};

type Runtime = {
  loaded: Set<Channel | 'klaviyo'>;
  granted: Set<Channel | 'klaviyo'>;
  // The URL each pixel already counted as a page view, so SPA page-view events never double the load view.
  pageViewUrl: string | null;
};

const state: Runtime = {loaded: new Set(), granted: new Set(), pageViewUrl: null};

const inBrowser = () => typeof document !== 'undefined' && typeof window !== 'undefined';

export function isChannelActive(channel: Channel): boolean {
  return state.loaded.has(channel) && state.granted.has(channel);
}

/** Test hook. */
export function resetTrackers() {
  state.loaded.clear();
  state.granted.clear();
  state.pageViewUrl = null;
}

function addScript(src: string): void {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function addInline(code: string): void {
  const script = document.createElement('script');
  script.text = code;
  document.head.appendChild(script);
}

// Ids are interpolated into inline script, so only the characters real ids use are allowed through.
const safeId = (id: string) => /^[A-Za-z0-9_-]{1,64}$/.test(id);

function loadGA4(id: string, marketing: boolean) {
  const w = window as unknown as Win;
  w.dataLayer = w.dataLayer || [];
  // NOTE: gtag.js only processes `arguments` objects in dataLayer; a rest-param array is silently ignored.
  function gtag() {
    w.dataLayer!.push(arguments);
  }
  w.gtag = gtag as unknown as Win['gtag'];
  const grant = (flag: boolean) => (flag ? 'granted' : 'denied');
  w.gtag!('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: grant(marketing),
    ad_user_data: grant(marketing),
    ad_personalization: grant(marketing),
  });
  w.gtag!('js', new Date());
  w.gtag!('config', id, {anonymize_ip: true});
  addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
}

function loadMeta(id: string) {
  addInline(`
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${id}');
    fbq('track', 'PageView');
  `);
}

function loadTikTok(id: string) {
  addInline(`
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
      for (var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},n||(n={});var s=Math.round(new Date().getTime()/864e5).toString(),o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&_="+s;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      ttq.load('${id}');
      ttq.page();
    }(window, document, 'ttq');
  `);
}

function loadKlaviyo(companyId: string) {
  markKlaviyoOnsiteLoading();
  addScript(`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${encodeURIComponent(companyId)}`);
}

function expireCookie(name: string) {
  const host = window.location.hostname;
  const parts = host.split('.');
  const domains = [undefined, host, ...(parts.length > 2 ? [parts.slice(-2).join('.')] : [])];
  for (const domain of domains) {
    document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ''}`;
  }
}

/**
 * Brings every configured tracker in line with the consent state. Idempotent: call it on mount and on every
 * change. Undecided (null) is treated as denied.
 */
export function applyConsent(config: TrackerConfig, consent: ConsentState | null): void {
  if (!inBrowser()) return;
  const w = window as unknown as Win;
  const analytics = consent?.analytics === true;
  const marketing = consent?.marketing === true;

  // GA4 (analytics)
  if (config.ga4Id && safeId(config.ga4Id)) {
    const key = `ga-disable-${config.ga4Id}` as const;
    if (analytics) {
      if (!state.loaded.has('ga4')) {
        loadGA4(config.ga4Id, marketing);
        state.loaded.add('ga4');
        state.pageViewUrl = window.location.href;
      } else {
        w[key] = false;
        const grant = marketing ? 'granted' : 'denied';
        w.gtag?.('consent', 'update', {analytics_storage: 'granted', ad_storage: grant, ad_user_data: grant, ad_personalization: grant});
      }
      state.granted.add('ga4');
    } else {
      if (state.loaded.has('ga4')) {
        // NOTE: the documented opt-out switch plus Consent Mode denial; gtag.js stops measuring either way.
        w[key] = true;
        w.gtag?.('consent', 'update', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        });
      }
      state.granted.delete('ga4');
    }
  }

  // Meta and TikTok (marketing)
  if (config.metaPixelId && safeId(config.metaPixelId)) {
    if (marketing) {
      if (!state.loaded.has('meta')) {
        loadMeta(config.metaPixelId);
        state.loaded.add('meta');
        state.pageViewUrl = window.location.href;
      } else {
        w.fbq?.('consent', 'grant');
      }
      state.granted.add('meta');
    } else {
      if (state.loaded.has('meta')) w.fbq?.('consent', 'revoke');
      state.granted.delete('meta');
    }
  }

  if (config.tiktokPixelId && safeId(config.tiktokPixelId)) {
    if (marketing) {
      if (!state.loaded.has('tiktok')) {
        loadTikTok(config.tiktokPixelId);
        state.loaded.add('tiktok');
        state.pageViewUrl = window.location.href;
      } else {
        w.ttq?.grantConsent?.();
      }
      state.granted.add('tiktok');
    } else {
      if (state.loaded.has('tiktok')) w.ttq?.revokeConsent?.();
      state.granted.delete('tiktok');
    }
  }

  // Klaviyo on-site (marketing). Its script has no revoke API, so revocation stops everything this app
  // controls (no new load, no events) and removes its identifying cookies; the already-loaded script is gone on
  // the next page load.
  if (config.klaviyoCompanyId && safeId(config.klaviyoCompanyId)) {
    if (marketing) {
      if (!state.loaded.has('klaviyo')) {
        loadKlaviyo(config.klaviyoCompanyId);
        state.loaded.add('klaviyo');
      }
      state.granted.add('klaviyo');
    } else {
      if (state.loaded.has('klaviyo')) {
        expireCookie('__kla_id');
      }
      state.granted.delete('klaviyo');
    }
  }
}

/** True once for the first SPA page view of a URL the pixels have not already counted. */
export function shouldTrackPageView(url: string): boolean {
  if (state.pageViewUrl === url) return false;
  state.pageViewUrl = url;
  return true;
}

type Params = Record<string, unknown>;

/** Sends one event to a channel, only while it is loaded and granted. Returns whether it was sent. */
export function trackEvent(channel: Channel, name: string, params?: Params): boolean {
  if (!inBrowser() || !isChannelActive(channel)) return false;
  const w = window as unknown as Win;
  if (channel === 'ga4') {
    if (!w.gtag) return false;
    w.gtag('event', name, params ?? {});
    return true;
  }
  if (channel === 'meta') {
    if (!w.fbq) return false;
    if (params) w.fbq('track', name, params);
    else w.fbq('track', name);
    return true;
  }
  if (!w.ttq) return false;
  if (name === 'page') {
    w.ttq.page?.();
    return true;
  }
  w.ttq.track?.(name, params ?? {});
  return true;
}
