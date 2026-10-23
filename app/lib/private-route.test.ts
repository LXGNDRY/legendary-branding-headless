import {describe, expect, it} from 'vitest';
import {applyPrivateHeaders, isPrivatePath, PRIVATE_ROBOTS_META} from '~/lib/private-route';

describe('isPrivatePath', () => {
  it('covers the account and cart trees', () => {
    for (const path of ['/account', '/account/orders', '/account/addresses', '/cart', '/cart/c/abc']) {
      expect(isPrivatePath(path)).toBe(true);
    }
  });

  it('covers the React Router data requests for those pages and the root loader', () => {
    for (const path of ['/cart.data', '/account.data', '/account/orders.data', '/account/addresses.data', '/_root.data']) {
      expect(isPrivatePath(path)).toBe(true);
    }
    expect(isPrivatePath('/products/tee.data')).toBe(false);
    expect(isPrivatePath('/accounting.data')).toBe(false);
  });

  it('does not catch look-alike public paths', () => {
    for (const path of ['/', '/accounting', '/carts', '/products/cart', '/collections/account']) {
      expect(isPrivatePath(path)).toBe(false);
    }
  });
});

describe('applyPrivateHeaders', () => {
  const respond = (status: number, init?: HeadersInit) => new Response('x', {status, headers: init});

  it('makes every private response uncacheable and unindexable, errors and redirects included', () => {
    for (const status of [200, 302, 404, 500, 503]) {
      const result = applyPrivateHeaders(respond(status, {'Cache-Control': 'public, max-age=3600'}), 'https://shop.test/account/orders');
      expect(result.status).toBe(status);
      expect(result.headers.get('Cache-Control')).toBe('private, no-store');
      expect(result.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    }
  });

  it('leaves public responses alone', () => {
    const result = applyPrivateHeaders(respond(200, {'Cache-Control': 'public, max-age=60'}), 'https://shop.test/collections/all');
    expect(result.headers.get('Cache-Control')).toBe('public, max-age=60');
    expect(result.headers.get('X-Robots-Tag')).toBeNull();
  });

  it('works on a response whose headers are immutable', () => {
    const immutable = Response.redirect('https://shop.test/account/login', 302);
    const result = applyPrivateHeaders(immutable, 'https://shop.test/account');
    expect(result.status).toBe(302);
    expect(result.headers.get('Location')).toBe('https://shop.test/account/login');
    expect(result.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('ignores an unparseable URL', () => {
    const response = respond(200);
    expect(applyPrivateHeaders(response, 'not a url')).toBe(response);
  });

  it('exposes the matching robots meta entry', () => {
    expect(PRIVATE_ROBOTS_META).toEqual({name: 'robots', content: 'noindex, nofollow'});
  });

  // SEO-07 regression (Codex P1 on #411): routes are mirrored under every locale slug,
  // so the private-route contract must apply to the localized variants too — otherwise
  // /de/cart, /pt-br/account/x and their .data payloads leak per-visitor data uncached.
  it('treats every locale-prefixed private path as private', () => {
    for (const slug of ['de', 'es', 'fr', 'hi', 'id', 'it', 'pt-br']) {
      expect(isPrivatePath(`/${slug}/account`)).toBe(true);
      expect(isPrivatePath(`/${slug}/account/orders`)).toBe(true);
      expect(isPrivatePath(`/${slug}/cart`)).toBe(true);
      expect(isPrivatePath(`/${slug}/account.data`)).toBe(true);
      expect(isPrivatePath(`/${slug}/cart/x.data`)).toBe(true);
    }
    // And still ignores locale-prefixed public paths.
    expect(isPrivatePath('/de/products/foo')).toBe(false);
    expect(isPrivatePath('/pt-br/journal/x')).toBe(false);
  });

  it('applies private headers to locale-prefixed account/cart URLs', () => {
    const response = respond(200);
    const result = applyPrivateHeaders(response, 'https://shop.test/de/account');
    expect(result.headers.get('Cache-Control')).toBe('private, no-store');
    expect(result.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });
});
