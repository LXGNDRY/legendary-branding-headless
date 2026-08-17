import {useEffect, useState} from 'react';
import {Link} from 'react-router';

/**
 * Analytics component — loads GA4, Meta Pixel, and other tracking scripts
 * AFTER consent is given (GDPR / CCPA compliant).
 *
 * Configure via env vars:
 * - PUBLIC_GA4_MEASUREMENT_ID — Google Analytics 4 measurement ID
 * - PUBLIC_META_PIXEL_ID — Meta (Facebook) Pixel ID
 * - PUBLIC_TIKTOK_PIXEL_ID — TikTok Pixel ID
 *
 * If env vars are not set, the scripts simply don't load.
 */

const CONSENT_COOKIE_NAME = 'lb_consent';

type ConsentState = 'accepted' | 'rejected' | 'undecided';

function getConsentFromCookie(): ConsentState {
  if (typeof document === 'undefined') return 'undecided';
  const match = document.cookie.match(
    new RegExp('(^| )' + CONSENT_COOKIE_NAME + '=([^;]+)'),
  );
  const value = match ? decodeURIComponent(match[2]) : '';
  if (value === 'accepted') return 'accepted';
  if (value === 'rejected') return 'rejected';
  return 'undecided';
}

function setConsentCookie(value: ConsentState) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
  document.cookie =
    CONSENT_COOKIE_NAME +
    '=' +
    encodeURIComponent(value) +
    '; expires=' +
    expires +
    '; path=/; SameSite=Lax' +
    (location.protocol === 'https:' ? '; Secure' : '');
}

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

interface AnalyticsProps {
  ga4Id?: string;
  metaPixelId?: string;
  tiktokPixelId?: string;
}

export default function Analytics({
  ga4Id,
  metaPixelId,
  tiktokPixelId,
}: AnalyticsProps) {
  const [consent, setConsent] = useState<ConsentState>('undecided');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const current = getConsentFromCookie();
    setConsent(current);

    // Show banner if undecided
    if (current === 'undecided') {
      setShowBanner(true);
    } else if (current === 'accepted') {
      // Load analytics scripts
      if (ga4Id) loadGA4(ga4Id);
      if (metaPixelId) loadMetaPixel(metaPixelId);
      if (tiktokPixelId) loadTikTokPixel(tiktokPixelId);
    }
  }, [ga4Id, metaPixelId, tiktokPixelId]);

  function handleAccept() {
    setConsent('accepted');
    setConsentCookie('accepted');
    setShowBanner(false);

    // Load analytics
    if (ga4Id) loadGA4(ga4Id);
    if (metaPixelId) loadMetaPixel(metaPixelId);
    if (tiktokPixelId) loadTikTokPixel(tiktokPixelId);
  }

  function handleReject() {
    setConsent('rejected');
    setConsentCookie('rejected');
    setShowBanner(false);
  }

  // Don't show banner if no analytics IDs configured
  if (!ga4Id && !metaPixelId && !tiktokPixelId) return null;

  return (
    <>
      {/* Consent banner */}
      {showBanner && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] text-[#FAF9F6] p-4 md:p-6"
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
        >
          <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">We value your privacy</p>
              <p className="text-xs text-[#FAF9F6]/70 leading-relaxed">
                We use cookies and similar technologies to analyze traffic and improve your experience.
                You can accept or reject non-essential tracking.
                {' '}
                <Link
                  to="/policies/privacy-with-legendary-branding"
                  className="underline underline-offset-2 hover:text-[#FAF9F6] transition-colors"
                >
                  Learn more
                </Link>
                .
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={handleReject}
                className="text-xs font-medium tracking-widest uppercase border border-[#FAF9F6]/30 px-6 py-3 hover:bg-[#FAF9F6]/10 transition-colors"
                aria-label="Reject non-essential cookies"
              >
                Reject
              </button>
              <button
                onClick={handleAccept}
                className="text-xs font-semibold tracking-widest uppercase bg-[#FAF9F6] text-[#1A1A1A] px-6 py-3 hover:bg-white/90 transition-colors"
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
