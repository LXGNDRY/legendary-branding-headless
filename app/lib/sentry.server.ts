/**
 * Server-side Sentry for Cloudflare Workers (Oxygen).
 *
 * Lightweight manual implementation — no SDK overhead, works in any JS env.
 * Sends errors to Sentry's envelope endpoint via fetch.
 *
 * Safe to import/use when no DSN is configured — everything no-ops.
 */

let dsn: string | null = null;
let initialized = false;

/**
 * Initialize Sentry on the server.
 * Call early in the fetch handler. Safe to call multiple times (idempotent).
 */
export function initSentryServer(env: Env) {
  if (initialized) return;
  initialized = true;
  dsn = env.PUBLIC_SENTRY_DSN || null;
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
  },
) {
  const err = error instanceof Error ? error : new Error(String(error));

  // Always log to console first
  console.error('[sentry]', options?.request?.url ?? '', err);

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
      environment: 'production',
      release: 'legendary-headless@1.0.0',
      message: err.message,
      exception: {
        values: [
          {
            type: err.name || 'Error',
            value: err.message,
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
              url: options.request.url,
              method: options.request.method,
            }
          : {}),
        ...(options?.extra ?? {}),
      },
    };

    // Build Sentry envelope
    const header = JSON.stringify({
      event_id: eventId,
      sdk: {name: 'sentry.javascript.cloudflare', version: '1.0.0'},
    });
    const itemHeader = JSON.stringify({type: 'event', length: JSON.stringify(event).length});
    const envelope = `${header}\n${itemHeader}\n${JSON.stringify(event)}`;

    // Fire-and-forget: don't await, don't let Sentry break the request
    fetch(`https://${parsed.host}/api/${parsed.projectId}/envelope/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'x-sentry-auth': `Sentry sentry_version=7,sentry_client=sentry.javascript.cloudflare/1.0.0,sentry_key=${parsed.key}`,
      },
      body: envelope,
    }).catch(() => {
      // swallow — Sentry failure should never break the app
    });
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
) {
  if (!dsn) {
    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log']('[sentry]', message);
    return;
  }

  // Reuse captureServerError with a synthetic error
  const err = new Error(message);
  err.name = 'Message';
  captureServerError(err, {extra: {level}});
}
