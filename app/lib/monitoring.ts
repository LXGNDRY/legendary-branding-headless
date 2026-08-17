/**
 * Monitoring utilities — Sentry error tracking + web vitals.
 *
 * Server: @sentry/cloudflare initialised in server.ts
 * Client: @sentry/react initialised in root.tsx (useEffect)
 *
 * Both sides read PUBLIC_SENTRY_DSN from env.
 * If no DSN is configured, everything no-ops safely.
 */

import {useEffect} from 'react';
import * as SentryBrowser from '@sentry/react';
import {onLCP, onFCP, onCLS, onINP} from 'web-vitals';

// Re-export for convenience (server-side uses direct import)
export {SentryBrowser as Sentry};

let clientInitialized = false;

/**
 * Initialize Sentry on the client (browser).
 * Call once from root.tsx in a useEffect.
 * Safe to call with no DSN — no-ops.
 */
export function initSentry(dsn: string | undefined) {
  if (!dsn || typeof window === 'undefined' || clientInitialized) return;

  try {
    SentryBrowser.init({
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
    clientInitialized = true;
  } catch (err) {
    // Never let Sentry init break the app
    console.warn('[monitoring] Sentry init failed:', err);
  }
}

/**
 * Capture an error — sends to Sentry on the client, or console in dev.
 */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && clientInitialized) {
    SentryBrowser.captureException(error instanceof Error ? error : new Error(String(error)), {
      extra: context,
    });
    return;
  }
  // Fallback: console (also used server-side before Sentry init)
  console.error('[monitoring]', context ?? '', error);
}

/**
 * Capture a message to Sentry.
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (typeof window !== 'undefined' && clientInitialized) {
    SentryBrowser.captureMessage(message, level);
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
      if (clientInitialized) {
        SentryBrowser.metrics.distribution(
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
