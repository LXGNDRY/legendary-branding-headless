/**
 * Application-level rate limiting for API routes.
 *
 * LOCAL LAYER ONLY. State lives in one worker isolate's memory: it resets when an isolate is recycled and is not
 * shared between isolates, so the effective limit across the fleet is roughly (limit x live isolates). It slows
 * spam and accidental loops; it is NOT a spend or abuse guarantee. Anything that costs money per call (chat)
 * also needs a shared control (provider spend cap or an edge rule): see docs/CHAT_PROTECTION.md.
 */

export type RatePolicy = {
  max: number;
  windowMs: number;
  /** 'client' keys by caller identity; 'global' is one bucket for the whole isolate. */
  scope?: 'client' | 'global';
};

/** Every route's limit lives here so the numbers are reviewed in one place. */
export const RATE_POLICIES = {
  chat: {max: 15, windowMs: 60_000},
  'chat-hourly': {max: 60, windowMs: 3_600_000},
  // NOTE: soft per-isolate ceiling on paid model calls; see the header comment for why it is not a cap.
  'chat-global': {max: 600, windowMs: 3_600_000, scope: 'global'},
  newsletter: {max: 5, windowMs: 60_000},
  waitlist: {max: 5, windowMs: 60_000},
  market: {max: 10, windowMs: 60_000},
  wishlist: {max: 30, windowMs: 60_000},
  'wishlist-products': {max: 60, windowMs: 60_000},
  search: {max: 60, windowMs: 60_000},
  'quick-add': {max: 60, windowMs: 60_000},
} as const satisfies Record<string, RatePolicy>;

export type RatePolicyName = keyof typeof RATE_POLICIES;

/** Hard bound on tracked keys so a flood of distinct identities cannot grow memory without limit. */
export const MAX_TRACKED_KEYS = 5_000;
const SWEEP_EVERY = 200;

interface RateLimitEntry {
  timestamps: number[];
  /** When the newest recorded request leaves its own window; the entry is dead after this. */
  expiresAt: number;
}

const limits = new Map<string, RateLimitEntry>();
let callsSinceSweep = 0;

function sweep(now: number) {
  callsSinceSweep = 0;
  for (const [key, entry] of limits) {
    if (entry.expiresAt <= now) limits.delete(key);
  }
  // Still over the bound (a flood of live identities): drop the oldest-inserted until it fits.
  for (const key of limits.keys()) {
    if (limits.size <= MAX_TRACKED_KEYS) break;
    limits.delete(key);
  }
}

/** Test hook. */
export function resetRateLimits() {
  limits.clear();
  callsSinceSweep = 0;
}

/** Test hook. */
export function trackedKeyCount() {
  return limits.size;
}

/**
 * Check if a key has exceeded the limit.
 *
 * @param key Unique identifier (route + caller)
 * @param maxRequests Maximum requests allowed in the window
 * @param windowMs Window size in milliseconds (default 60000 = 1 minute)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000,
): {limited: boolean; remaining: number; retryAfter: number} {
  const now = Date.now();
  callsSinceSweep += 1;
  if (callsSinceSweep >= SWEEP_EVERY || limits.size > MAX_TRACKED_KEYS) sweep(now);

  const entry = limits.get(key) ?? {timestamps: [], expiresAt: 0};
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - entry.timestamps[0])) / 1000));
    entry.expiresAt = now + windowMs;
    limits.set(key, entry);
    return {limited: true, remaining: 0, retryAfter};
  }

  entry.timestamps.push(now);
  entry.expiresAt = now + windowMs;
  limits.set(key, entry);

  return {limited: false, remaining: maxRequests - entry.timestamps.length, retryAfter: 0};
}

const UNIDENTIFIED = 'unidentified';
const printable = (value: string) => value.length > 0 && value.length <= 64 && !/[\p{Cc}\s]/u.test(value);

/**
 * Caller identity for rate limiting only.
 *
 * Production traffic reaches the worker through Cloudflare, which sets `cf-connecting-ip` itself and overwrites
 * any client-supplied value, so that header is trusted. `x-forwarded-for` / `x-real-ip` are client-controllable
 * and are consulted ONLY when the edge header is absent (local dev, tests), never alongside it. A request with
 * no usable identity shares one bucket: an attacker-chosen value (a user agent, a forged header) can never mint
 * a fresh limit.
 */
export function getClientIP(request: Request): string {
  const edge = request.headers.get('cf-connecting-ip')?.trim();
  if (edge !== undefined && printable(edge)) return edge;
  if (edge === undefined) {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded && printable(forwarded)) return forwarded;
    const real = request.headers.get('x-real-ip')?.trim();
    if (real && printable(real)) return real;
  }
  return UNIDENTIFIED;
}

function tooMany(maxRequests: number, retryAfter: number): Response {
  return new Response(JSON.stringify({error: 'Too many requests'}), {
    status: 429,
    statusText: 'Too Many Requests',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Retry-After': String(retryAfter),
      'X-RateLimit-Limit': String(maxRequests),
      'X-RateLimit-Remaining': '0',
    },
  });
}

/**
 * Apply an ad-hoc limit. Returns null if allowed, or a 429 Response. Prefer `enforceRatePolicy` for routes.
 */
export function rateLimitMiddleware(
  request: Request,
  routeKey: string,
  maxRequests: number,
  windowMs: number = 60_000,
): Response | null {
  const result = checkRateLimit(`${routeKey}:${getClientIP(request)}`, maxRequests, windowMs);
  return result.limited ? tooMany(maxRequests, result.retryAfter) : null;
}

/** Apply a named policy (or several, all must pass). Returns null if allowed, or a 429 Response. */
export function enforceRatePolicy(request: Request, ...names: RatePolicyName[]): Response | null {
  for (const name of names) {
    const policy: RatePolicy = RATE_POLICIES[name];
    const key = policy.scope === 'global' ? `${name}:*` : `${name}:${getClientIP(request)}`;
    const result = checkRateLimit(key, policy.max, policy.windowMs);
    if (result.limited) return tooMany(policy.max, result.retryAfter);
  }
  return null;
}
