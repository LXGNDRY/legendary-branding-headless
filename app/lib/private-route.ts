/**
 * Private routes (customer account, cart) carry per-visitor data. Every response from them, errors and
 * redirects included, must be uncacheable and unindexable; this is the one place that contract lives.
 */

const PRIVATE_PREFIXES = ['/account', '/cart'];

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Route `meta` entry for private pages. Child routes replace the parent's meta, so each one includes it. */
export const PRIVATE_ROBOTS_META = {name: 'robots', content: 'noindex, nofollow'} as const;

/** Returns the response with the private contract applied (a new Response if its headers are immutable). */
export function applyPrivateHeaders(response: Response, requestUrl: string): Response {
  let pathname: string;
  try {
    pathname = new URL(requestUrl).pathname;
  } catch {
    return response;
  }
  if (!isPrivatePath(pathname)) return response;

  const set = (headers: Headers) => {
    headers.set('Cache-Control', 'private, no-store');
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  };
  try {
    set(response.headers);
    return response;
  } catch {
    const headers = new Headers(response.headers);
    set(headers);
    return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
  }
}
