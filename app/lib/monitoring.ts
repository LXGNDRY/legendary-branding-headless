/**
 * Monitoring utilities — error tracking + web vitals.
 *
 * Sentry is loaded if PUBLIC_SENTRY_DSN is configured.
 * Core Web Vitals are reported to a configurable endpoint (or GA4).
 */

import {useEffect} from 'react';

declare global {
  interface Window {
    Sentry?: {
      init: (opts: Record<string, unknown>) => void;
      captureException: (err: unknown) => void;
    };
  }
}

/**
 * Load Sentry browser SDK lazily (only if DSN is set).
 * Call once in the root layout via useEffect.
 */
export function initSentry(dsn: string | undefined) {
  if (!dsn || typeof window === 'undefined') return;

  // Lazy-load the Sentry SDK
  const script = document.createElement('script');
  script.src = 'https://browser.sentry-cdn.com/7.120.3/bundle.tracing.min.js';
  script.crossOrigin = 'anonymous';
  script.onload = () => {
    if (window.Sentry) {
      window.Sentry.init({
        dsn,
        environment: import.meta.env.MODE || 'production',
        release: 'legendary-headless@' + (import.meta.env.npm_package_version || '1.0.0'),
        tracesSampleRate: 0.1,
        integrations: [],
      });
    }
  };
  document.head.appendChild(script);
}

/**
 * Capture an error in Sentry (or console in dev).
 */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.Sentry) {
    if (context) {
      window.Sentry.captureException(Object.assign(error instanceof Error ? error : new Error(String(error)), context));
    } else {
      window.Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
    }
    return;
  }
  // Fallback: console
  console.error('[monitoring]', context ?? '', error);
}

/**
 * Web Vitals hook — reports Core Web Vitals (LCP, FID, CLS, INP)
 * to GA4 via the dataLayer, or console in dev.
 */
export function useWebVitals(ga4Id?: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load web-vitals library dynamically
    // (in a real setup, npm install web-vitals and import reportWebVitals)
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js';
    script.onload = () => {
      const wv = (window as unknown as {
        webVitals?: {
          onLCP: (cb: (m: {name: string; value: number; rating?: string}) => void) => void;
          onFID: (cb: (m: {name: string; value: number; rating?: string}) => void) => void;
          onCLS: (cb: (m: {name: string; value: number; rating?: string}) => void) => void;
          onINP: (cb: (m: {name: string; value: number; rating?: string}) => void) => void;
        };
      }).webVitals;

      if (!wv) return;

      const report = (metric: {name: string; value: number; rating?: string}) => {
        // Send to GA4 dataLayer
        const dataLayer = (window as {dataLayer?: unknown[]}).dataLayer;
        if (dataLayer) {
          dataLayer.push({
            event: 'web_vitals',
            event_category: 'Web Vitals',
            event_label: metric.name,
            event_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            metric_name: metric.name + (metric.rating ? ` (${metric.rating})` : ''),
            metric_value: metric.value,
          });
        }
        // Dev logging
        if (import.meta.env.DEV) {
          console.log(`[web-vitals] ${metric.name}: ${metric.value}`);
        }
      };

      wv.onLCP(report);
      wv.onFID(report);
      wv.onCLS(report);
      wv.onINP(report);
    };
    document.head.appendChild(script);
  }, [ga4Id]);
}