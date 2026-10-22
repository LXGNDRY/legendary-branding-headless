/**
 * Server-side Sentry for Cloudflare Workers (Oxygen).
 *
 * Lightweight manual implementation — no SDK overhead, works in any JS env.
 * Sends errors to Sentry's envelope endpoint via fetch.
 *
 * Safe to import/use when no DSN is configured — everything no-ops.
 */

import {analyticsEnvironment} from '~/lib/analytics-environment';

let dsn: string | null = null;
let initialized = false;
let release = 'unknown';

/** Bound on how long a report may hold a request's isolate open. */
const SEND_TIMEOUT_MS = 3_000;

// Delivery promises started since the last drain. server.ts hands the drained
// batch to `waitUntil` so reports from route-level handlers (which have no
// ExecutionContext of their own) are not cut off when the response returns.
const pendingSends: Promise<unknown>[] = [];

/** Takes the in-flight report deliveries, for `ctx.waitUntil`. */
export function drainServerReports(): Promise<unknown> {
  return Promise.allSettled(pendingSends.splice(0));
}

const SENSITIVE_PARAM = /\b(code|state|token|access_token|id_token|refresh_token|key|password|secret|email|session|cart|checkout)=[^&\s"'<>]*/gi;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const GID_TOKEN = /\b(?:shpat|shpca|shpss)_[A-Za-z0-9]+/g;

/** Strips credentials and personal data from free text before it leaves the worker. */
export function redactText(text: string): string {
  return text.replace(SENSITIVE_PARAM, '$1=[redacted]').replace(EMAIL, '[email]').replace(GID_TOKEN, '[token]');
}

/** Origin and path only; every query value is dropped (OAuth codes, emails, tokens). */
export function redactUrl(raw: string): string {
  try {
    const url = new URL(raw);
    const keys = [...new Set(url.searchParams.keys())];
    return `${url.origin}${url.pathname}${keys.length ? `?${keys.map((k) => `${k}=[redacted]`).join('&')}` : ''}`;
  } catch {
    return '[unparseable url]';
  }
}

function redactExtra(extra: Record<string, unknown> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(extra ?? {})) {
    out[key] = typeof value === 'string' ? redactText(value) : value;
  }
  return out;
}

/**
 * Initialize Sentry on the server.
 * Call early in the fetch handler. Safe to call multiple times (idempotent).
 */
export function initSentryServer(env: Env) {
  if (initialized) return;
  initialized = true;
  dsn = env.PUBLIC_SENTRY_DSN || null;
  release = (env as unknown as {SHOPIFY_HYDROGEN_DEPLOYMENT_ID?: string}).SHOPIFY_HYDROGEN_DEPLOYMENT_ID || 'unknown';
}

/** Parse a DSN into its components */
function parseDsn(raw: string): {projectId: string; host: string; key: string} | null {
  try {
    const url = new URL(raw.replace(/^https?:\/\//, 'https://'));
    const key = url.username;
    const host = url.host;
    const projectId = url.pathname.replace(/^\//, '').replace(/\/$/, '');
    if (!key || !host || !projectId) return null;
    return {projectId, host, key};
  } catch {
    return null;
  }
}

/**
 * Capture an error on the server side.
 * Includes request URL + method when a request is provided.
 */
export function captureServerError(
  error: unknown,
  options?: {
    request?: Request;
    extra?: Record<string, unknown>;
    /**
     * Cloudflare Workers' ExecutionContext.waitUntil, bound to the current
     * request. Without this, the fire-and-forget fetch below to Sentry's
     * envelope endpoint is not registered with the isolate -- once the
     * fetch handler returns its response (typically the 500 this is called
     * from), the runtime can terminate the request before the envelope
     * actually reaches Sentry, silently dropping production error reports.
     */
    waitUntil?: (promise: Promise<unknown>) => void;
  },
) {
  const err = error instanceof Error ? error : new Error(String(error));

  // Always log to console first (URL and message redacted: OAuth callbacks carry codes in the query)
  console.error('[sentry]', options?.request ? redactUrl(options.request.url) : '', redactText(err.message));

  if (!dsn) return;

  try {
    const parsed = parseDsn(dsn);
    if (!parsed) return;

    const eventId = crypto.randomUUID?.() ?? Math.random().toString(16).slice(2);
    const timestamp = new Date().toISOString();

    const event = {
      event_id: eventId,
      timestamp,
      level: 'error' as const,
      platform: 'node' as const,
      // NOTE: live host only; previews and local servers must not report as production.
      environment: options?.request && analyticsEnvironment(options.request.url).reportToShop ? 'production' : 'preview',
      release,
      message: redactText(err.message),
      exception: {
        values: [
          {
            type: err.name || 'Error',
            value: redactText(err.message),
            stacktrace: err.stack
              ? {
                  frames: err.stack
                    .split('\n')
                    .slice(1)
                    .map((line) => {
                      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
                      if (match) {
                        return {
                          function: match[1],
                          filename: match[2],
                          lineno: parseInt(match[3], 10),
                          colno: parseInt(match[4], 10),
                        };
                      }
                      return {function: line.trim(), filename: ''};
                    })
                    .reverse(),
                }
              : undefined,
          },
        ],
      },
      extra: {
        ...(options?.request
          ? {
              url: redactUrl(options.request.url),
              method: options.request.method,
            }
          : {}),
        ...redactExtra(options?.extra),
      },
    };

    // Build Sentry envelope
    const header = JSON.stringify({
      event_id: eventId,
      sdk: {name: 'sentry.javascript.cloudflare', version: '1.0.0'},
    });
    const itemHeader = JSON.stringify({type: 'event', length: JSON.stringify(event).length});
    const envelope = `${header}\n${itemHeader}\n${JSON.stringify(event)}`;

    // Fire-and-forget from this function's own return, but registered with
    // waitUntil (when the caller provides it) so the Workers isolate keeps
    // the request alive long enough for the envelope to actually send.
    const send = fetch(`https://${parsed.host}/api/${parsed.projectId}/envelope/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'x-sentry-auth': `Sentry sentry_version=7,sentry_client=sentry.javascript.cloudflare/1.0.0,sentry_key=${parsed.key}`,
      },
      body: envelope,
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    }).catch(() => {
      // swallow — Sentry failure should never break the app
    });
    pendingSends.push(send);
    options?.waitUntil?.(send);
  } catch {
    // swallow any Sentry errors
  }
}

/**
 * Capture a message on the server side.
 */
export function captureServerMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  waitUntil?: (promise: Promise<unknown>) => void,
) {
  if (!dsn) {
    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log']('[sentry]', message);
    return;
  }

  // Reuse captureServerError with a synthetic error
  const err = new Error(message);
  err.name = 'Message';
  captureServerError(err, {extra: {level}, waitUntil});
}
