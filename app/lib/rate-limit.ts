/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding-window approach keyed by IP (or any identifier).
 * Tuned for form submission / API abuse prevention on a DTC storefront.
 *
 * Not intended to replace edge-level rate limiting (Cloudflare / Oxygen
 * has its own), but provides application-level protection against
 * spam and rapid-fire form abuse.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const limits = new Map<string, RateLimitEntry>();

// Cleanup interval: sweep entries older than the window
const CLEANUP_INTERVAL = 60_000; // 1 minute

let cleanupStarted = false;

function startCleanup() {
  if (cleanupStarted) return;
  cleanupStarted = true;
  if (typeof setInterval !== 'undefined') {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of limits) {
        entry.timestamps = entry.timestamps.filter((t) => now - t < 60_000);
        if (entry.timestamps.length === 0) {
          limits.delete(key);
        }
      }
    }, CLEANUP_INTERVAL);
  }
}

/**
 * Check if a request key (e.g. IP address) has exceeded the rate limit.
 *
 * @param key Unique identifier (IP + route path recommended)
 * @param maxRequests Maximum requests allowed in the window
 * @param windowMs Window size in milliseconds (default 60000 = 1 minute)
 * @returns { limited: boolean; remaining: number; retryAfter: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000,
): {limited: boolean; remaining: number; retryAfter: number} {
  startCleanup();

  const now = Date.now();
  const entry = limits.get(key) ?? {timestamps: []};

  // Drop timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((windowMs - (now - oldest)) / 1000);
    limits.set(key, entry);
    return {
      limited: true,
      remaining: 0,
      retryAfter,
    };
  }

  entry.timestamps.push(now);
  limits.set(key, entry);

  return {
    limited: false,
    remaining: maxRequests - entry.timestamps.length,
    retryAfter: 0,
  };
}

/**
 * Extract a client IP from a request (best-effort, for rate limiting key only).
 * Falls back to a hash of the user agent if IP is not available.
 */
export function getClientIP(request: Request): string {
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;

  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }

  const xReal = request.headers.get('x-real-ip');
  if (xReal) return xReal;

  // Fallback: user agent hash (less precise but prevents total bypass)
  const ua = request.headers.get('user-agent') || 'unknown';
  return `ua:${ua.slice(0, 40)}`;
}

/**
 * Apply rate limiting to an API route. Returns null if allowed, or a
 * Response with 429 if rate limited.
 */
export function rateLimitMiddleware(
  request: Request,
  routeKey: string,
  maxRequests: number,
  windowMs: number = 60_000,
): Response | null {
  const ip = getClientIP(request);
  const key = `${routeKey}:${ip}`;
  const result = checkRateLimit(key, maxRequests, windowMs);

  if (result.limited) {
    return new Response(JSON.stringify({error: 'Too many requests'}), {
      status: 429,
      statusText: 'Too Many Requests',
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter),
        'X-RateLimit-Limit': String(maxRequests),
        'X-RateLimit-Remaining': '0',
      },
    });
  }

  return null;
}
