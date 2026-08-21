import {describe, it, expect} from 'vitest';
import {resolveCountry} from './context';

/**
 * The store has two Shopify Markets sharing one domain (no country subpath):
 * "United States" (primary, US only) and "International" (~150 other
 * countries). resolveCountry() must derive the visitor's market country
 * from Cloudflare's edge-provided `request.cf.country`, falling back to
 * the primary US market when it's absent or malformed.
 */
describe('resolveCountry', () => {
  it('uses request.cf.country when present and valid', () => {
    const request = new Request('https://legendary-branding.com/') as Request & {
      cf?: {country?: string};
    };
    request.cf = {country: 'GB'};

    expect(resolveCountry(request)).toBe('GB');
  });

  it('falls back to US when request.cf is absent', () => {
    const request = new Request('https://legendary-branding.com/');

    expect(resolveCountry(request)).toBe('US');
  });

  it('falls back to US when request.cf.country is malformed', () => {
    const request = new Request('https://legendary-branding.com/') as Request & {
      cf?: {country?: string};
    };
    request.cf = {country: 'T1'};

    expect(resolveCountry(request)).toBe('US');
  });
});
