/**
 * Private routes (customer account, cart) carry per-visitor data. Every response from them, errors and
 * redirects included, must be uncacheable and unindexable; this is the one place that contract lives.
 */
import {parseLocalizedPath} from './locale';

const PRIVATE_PREFIXES = ['/account', '/cart'];

/**
 * React Router fetches page data from `<path>.data` (and `/_root.data` for a root-only revalidation). Those
 * responses carry the same private data as the page: the root loader returns the cart and sign-in state.
 */
function normalize(pathname: string): string {
  return pathname.endsWith('.data') ? pathname.slice(0, -'.data'.length) : pathname;
}

export function isPrivatePath(pathname: string): boolean {
  const path = normalize(pathname);
  if (pathname.endsWith('.data') && path === '/_root') return true;
  // SEO-07: routes are mirrored under every locale slug, so `/de/cart`, `/pt-br/account/x`
  // and their `.data` variants carry the same private payload as the unprefixed path and
  // must receive the same `private, no-store` + `X-Robots-Tag: noindex, nofollow` treatment.
  const {path: bare} = parseLocalizedPath(path);
  return PRIVATE_PREFIXES.some((prefix) => bare === prefix || bare.startsWith(`${prefix}/`));
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
