/**
 * Monitoring utilities — Sentry error tracking + web vitals.
 *
 * Server: @sentry/cloudflare initialised in server.ts
 * Client: @sentry/react initialised in root.tsx (useEffect)
 *
 * Both sides read PUBLIC_SENTRY_DSN from env.
 * If no DSN is configured, everything no-ops safely.
 *
 * @sentry/react is loaded via a dynamic import gated on a DSN actually
 * being present, rather than a static top-level import -- most storefronts
 * running this code won't have PUBLIC_SENTRY_DSN configured, and a static
 * import ships and parses the full Sentry client bundle regardless of
 * whether it will ever be used.
 */

import {useEffect} from 'react';
import {onLCP, onFCP, onCLS, onINP} from 'web-vitals';

type SentryModule = typeof import('@sentry/react');

let clientInitialized = false;
let clientInitializing = false;
let sentryModule: SentryModule | null = null;

/**
 * Initialize Sentry on the client (browser).
 * Called from root.tsx's render body (not a useEffect), which can invoke
 * this more than once before the dynamic import below resolves -- guarded
 * separately from clientInitialized so a second call while the first is
 * still in flight doesn't kick off a duplicate import/init.
 * Safe to call with no DSN — no-ops without ever importing @sentry/react.
 */
export async function initSentry(dsn: string | undefined) {
  if (!dsn || typeof window === 'undefined' || clientInitialized || clientInitializing) return;
  clientInitializing = true;

  try {
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'production',
      release: 'legendary-headless@' + (import.meta.env.VITE_APP_VERSION || '1.0.0'),
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      integrations: [],
      beforeSend(event) {
        // Never send user PII
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        return event;
      },
    });
    sentryModule = Sentry;
    clientInitialized = true;
  } catch (err) {
    // Never let Sentry init break the app
    console.warn('[monitoring] Sentry init failed:', err);
  } finally {
    clientInitializing = false;
  }
}

/**
 * Capture an error — sends to Sentry on the client, or console in dev.
 */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && clientInitialized && sentryModule) {
    sentryModule.captureException(error instanceof Error ? error : new Error(String(error)), {
      extra: context,
    });
    return;
  }
  // Fallback: console (also used server-side before Sentry init, and on
  // the client if an error fires before the dynamic import resolves)
  console.error('[monitoring]', context ?? '', error);
}

/**
 * Capture a message to Sentry.
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (typeof window !== 'undefined' && clientInitialized && sentryModule) {
    sentryModule.captureMessage(message, level);
    return;
  }
  console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log']('[monitoring]', message);
}

/**
 * Web Vitals hook — reports Core Web Vitals (LCP, FID, CLS, INP)
 * to GA4 via the dataLayer, and to Sentry when client is initialized.
 */
export function useWebVitals(ga4Id?: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reportMetric = (metric: {name: string; value: number; rating?: string}) => {
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

      // Send to Sentry as a measurement
      if (clientInitialized && sentryModule) {
        sentryModule.metrics.distribution(
          `web_vitals.${metric.name.toLowerCase()}`,
          metric.value,
          {unit: metric.name === 'CLS' ? 'unitless' : 'millisecond'},
        );
      }

      // Dev logging
      if (import.meta.env.DEV) {
        console.log(`[web-vitals] ${metric.name}: ${metric.value}`);
      }
    };

    const cleanup: Array<() => void> = [];

    // web-vitals v6 functions accept a callback and return a cleanup fn or void
    const attach = (fn: (cb: (metric: {name: string; value: number; rating?: string}) => void) => unknown, cb: (metric: {name: string; value: number; rating?: string}) => void) => {
      const result = fn(cb) as unknown;
      return typeof result === 'function' ? (result as () => void) : () => {};
    };

    cleanup.push(attach(onLCP, reportMetric));
    cleanup.push(attach(onFCP, reportMetric));
    cleanup.push(attach(onCLS, reportMetric));
    cleanup.push(attach(onINP, reportMetric));

    return () => cleanup.forEach((fn) => fn());
  }, [ga4Id]);
}
