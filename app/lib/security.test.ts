import {describe, it, expect} from 'vitest';
import {applySecurityHeaders, isAssetRequest, requireSameOrigin, SECURITY_HEADERS} from './security';

describe('Security headers', () => {
  describe('SECURITY_HEADERS constants', () => {
    it('includes Content-Security-Policy', () => {
      expect(SECURITY_HEADERS['Content-Security-Policy']).toBeTruthy();
    });

    it('CSP blocks object-src', () => {
      expect(SECURITY_HEADERS['Content-Security-Policy']).toContain("object-src 'none'");
    });

    it('CSP upgrades insecure requests', () => {
      expect(SECURITY_HEADERS['Content-Security-Policy']).toContain('upgrade-insecure-requests');
    });

    it('prevents clickjacking', () => {
      expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
    });

    it('prevents MIME sniffing', () => {
      expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    });

    it('sets HSTS with long max-age', () => {
      const hsts = SECURITY_HEADERS['Strict-Transport-Security'];
      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('includeSubDomains');
    });

    it('disables payment API in permissions policy', () => {
      expect(SECURITY_HEADERS['Permissions-Policy']).toContain('payment=()');
    });
  });

  describe('applySecurityHeaders', () => {
    it('adds security headers to a response', () => {
      const original = new Response('OK', {status: 200});
      const secured = applySecurityHeaders(original);

      expect(secured.headers.get('X-Frame-Options')).toBe('DENY');
      expect(secured.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(secured.headers.get('Content-Security-Policy')).toBeTruthy();
    });

    it('does not mutate the original response', () => {
      const original = new Response('OK', {status: 200});
      const before = original.headers.get('X-Frame-Options');
      applySecurityHeaders(original);
      expect(original.headers.get('X-Frame-Options')).toBe(before);
    });

    it('preserves existing headers on the response', () => {
      const original = new Response('OK', {
        headers: {'Content-Type': 'application/json'},
      });
      const secured = applySecurityHeaders(original);
      expect(secured.headers.get('Content-Type')).toBe('application/json');
    });

    it('does not overwrite pre-set security headers', () => {
      const original = new Response('OK', {
        headers: {'X-Frame-Options': 'SAMEORIGIN'},
      });
      const secured = applySecurityHeaders(original);
      // Pre-existing value should be preserved, not overwritten
      expect(secured.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    });

    it('preserves response body and status', () => {
      const original = new Response('Hello', {status: 201});
      const secured = applySecurityHeaders(original);
      expect(secured.status).toBe(201);
    });

    it('only emits HTTPS-enforcement directives on HTTPS responses', () => {
      const secured = applySecurityHeaders(
        new Response('OK'),
        new Request('http://127.0.0.1:3000/'),
      );
      expect(secured.headers.has('Strict-Transport-Security')).toBe(false);
      expect(secured.headers.get('Content-Security-Policy')).not.toContain(
        'upgrade-insecure-requests',
      );
    });
  });

  describe('isAssetRequest', () => {
    const makeRequest = (url: string) => new Request(url);

    it('identifies CSS files as asset requests', () => {
      expect(isAssetRequest(makeRequest('https://example.com/styles/app.css'))).toBe(true);
    });

    it('identifies JS files as asset requests', () => {
      expect(isAssetRequest(makeRequest('https://example.com/build/app.js'))).toBe(true);
    });

    it('identifies image files as asset requests', () => {
      expect(isAssetRequest(makeRequest('https://example.com/images/logo.png'))).toBe(true);
      expect(isAssetRequest(makeRequest('https://example.com/images/photo.webp'))).toBe(true);
      expect(isAssetRequest(makeRequest('https://example.com/images/photo.avif'))).toBe(true);
    });

    it('identifies font files as asset requests', () => {
      expect(isAssetRequest(makeRequest('https://example.com/fonts/inter.woff2'))).toBe(true);
    });

    it('does not classify HTML page requests as assets', () => {
      expect(isAssetRequest(makeRequest('https://example.com/'))).toBe(false);
      expect(isAssetRequest(makeRequest('https://example.com/products/t-shirt'))).toBe(false);
      expect(isAssetRequest(makeRequest('https://example.com/collections/all'))).toBe(false);
    });

    it('does not classify API calls as assets', () => {
      expect(isAssetRequest(makeRequest('https://example.com/api/search?q=hoodie'))).toBe(false);
    });
  });
});

describe('requireSameOrigin', () => {
  it('allows same-origin browser mutations', () => {
    const request = new Request('https://legendary-branding.com/cart', {
      method: 'POST',
      headers: {Origin: 'https://legendary-branding.com'},
    });
    expect(requireSameOrigin(request)).toBeNull();
  });

  it('rejects cross-origin browser mutations', () => {
    const request = new Request('https://legendary-branding.com/cart', {
      method: 'POST',
      headers: {Origin: 'https://attacker.example'},
    });
    expect(requireSameOrigin(request)?.status).toBe(403);
  });
});
