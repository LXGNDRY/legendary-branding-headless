import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
  FALLBACK_LOGO_URL,
  POLICY_PAGES,
  ROUTES,
  SITE_ORIGIN,
  absoluteUrl,
  canonicalUrl,
  isPolicyHandle,
  withImageTransform,
} from '~/lib/site';

describe('absoluteUrl / canonicalUrl', () => {
  it('builds canonical URLs on the one origin, without query, fragment or trailing slash', () => {
    expect(canonicalUrl('/')).toBe(`${SITE_ORIGIN}/`);
    expect(canonicalUrl('/products/tee')).toBe(`${SITE_ORIGIN}/products/tee`);
    expect(canonicalUrl('/products/tee/')).toBe(`${SITE_ORIGIN}/products/tee`);
    expect(canonicalUrl('/collections/all?sort=price#top')).toBe(`${SITE_ORIGIN}/collections/all`);
  });

  it('never emits a malformed or untrusted URL for bad input', () => {
    for (const bad of ['', 'products/x', '//evil.test/x', 'javascript:alert(1)', 'http://insecure.test/x', '/a b', '/x\u0000y', 'https://user:pw@evil.test/x', 'https://']) {
      expect(absoluteUrl(bad)).toBe(SITE_ORIGIN);
    }
    expect(absoluteUrl(undefined as unknown as string)).toBe(SITE_ORIGIN);
  });

  it('passes a well-formed absolute https URL through without its query', () => {
    expect(absoluteUrl('https://example.com/x?y=1')).toBe('https://example.com/x');
  });

  it('exposes named routes', () => {
    expect(ROUTES.policy('refund-policy')).toBe('/policies/refund-policy');
    expect(ROUTES.article('post')).toBe('/journal/post');
  });
});

describe('withImageTransform', () => {
  it('adds a query to a URL that has none', () => {
    expect(withImageTransform('https://cdn.shopify.com/s/files/x.jpg', {width: 1200, height: 630})).toBe(
      'https://cdn.shopify.com/s/files/x.jpg?width=1200&height=630',
    );
  });

  it('extends an existing query with & instead of a second ?', () => {
    const url = withImageTransform('https://cdn.shopify.com/s/files/x.jpg?v=1789153351', {width: 1200, height: 1200})!;
    expect(url).toBe('https://cdn.shopify.com/s/files/x.jpg?v=1789153351&width=1200&height=1200');
    expect(url.split('?')).toHaveLength(2);
  });

  it('replaces transform parameters the URL already carries', () => {
    expect(withImageTransform('https://cdn.shopify.com/x.jpg?width=100&height=100&v=2', {width: 800})).toBe('https://cdn.shopify.com/x.jpg?width=800&v=2');
  });

  it('returns nothing for a missing, malformed or non-http URL', () => {
    for (const bad of [null, undefined, '', 'not a url', 'javascript:alert(1)', 'data:image/png;base64,AAAA']) {
      expect(withImageTransform(bad, {width: 100})).toBeUndefined();
    }
  });
});

describe('policy pages contract', () => {
  it('recognises exactly the declared handles', () => {
    expect(isPolicyHandle('refund-policy')).toBe(true);
    expect(isPolicyHandle('lookbook')).toBe(false);
    expect(isPolicyHandle('constructor')).toBe(false);
    expect(isPolicyHandle('toString')).toBe(false);
  });

  it('marks contact as the only page that renders without content', () => {
    expect(Object.entries(POLICY_PAGES).filter(([, entry]) => !entry.required).map(([handle]) => handle)).toEqual(['contact']);
  });
});

// ---- source scans: the contract is enforced, not just documented --------------------------------------------------

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'locales' || name === 'test' ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe('source scans', () => {
  const files = sourceFiles('app');

  it('spells the live domain only in site.ts ', () => {
    const allowed = new Set([join('app', 'lib', 'site.ts')]);
    const offenders = files.filter((file) => !allowed.has(file) && /legendary-branding\.com/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('only links to policy pages that the policy route serves', () => {
    const unknown: string[] = [];
    for (const file of files) {
      for (const match of readFileSync(file, 'utf8').matchAll(/['"`]\/policies\/([a-z0-9_-]+)['"`]/g)) {
        if (!isPolicyHandle(match[1])) unknown.push(`${file}: /policies/${match[1]}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it('has a real file behind the fallback logo', () => {
    const path = FALLBACK_LOGO_URL.replace(`${SITE_ORIGIN}/`, '');
    expect(existsSync(join('public', path))).toBe(true);
  });
});
