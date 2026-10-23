import {describe, expect, it} from 'vitest';
import {assertAll} from './seo-postrelease-baseline.mjs';

const PASS_BASELINE = Object.freeze({
  indexable: [
    {path: '/', status: 200, canonical: ['https://legendary-branding.com/'], noindex: false},
    {path: '/collections/all-products', status: 200, canonical: ['https://legendary-branding.com/collections/all-products'], noindex: false},
  ],
  legacyRedirects: [
    {path: '/blogs/legendary_blogging', status: 301, location: 'https://legendary-branding.com/journal'},
  ],
  sitemap: {status: 200, total: 182, www: 0, nonWww: 182, sample: []},
  robots: {status: 200, sitemaps: ['https://legendary-branding.com/sitemap.xml']},
  release: {status: 200, release: {ok: true, sha: 'abcdef1234', missing: 0}},
});

const clone = (overrides) => ({
  ...PASS_BASELINE,
  ...overrides,
  indexable: overrides.indexable ?? PASS_BASELINE.indexable.map((check) => ({...check, canonical: [...check.canonical]})),
  legacyRedirects: overrides.legacyRedirects ?? PASS_BASELINE.legacyRedirects.map((redirect) => ({...redirect})),
  sitemap: overrides.sitemap ?? {...PASS_BASELINE.sitemap},
  robots: overrides.robots ?? {...PASS_BASELINE.robots, sitemaps: [...PASS_BASELINE.robots.sitemaps]},
  release: overrides.release ?? {...PASS_BASELINE.release, release: {...PASS_BASELINE.release.release}},
});

describe('assertAll (post-release SEO baseline)', () => {
  it('passes a correctly fixed baseline', () => {
    expect(assertAll(PASS_BASELINE)).toEqual([]);
  });

  it('fails when any canonical still points to www', () => {
    const bad = clone({indexable: [{path: '/', status: 200, canonical: ['https://www.legendary-branding.com/'], noindex: false}]});
    expect(assertAll(bad)).toEqual(expect.arrayContaining([expect.stringContaining('canonical points to www')]));
  });

  it('fails when the legacy blog redirect still 404s', () => {
    const bad = clone({legacyRedirects: [{path: '/blogs/legendary_blogging', status: 404, location: null}]});
    const failures = assertAll(bad);
    expect(failures.some((failure) => failure.includes('status 404'))).toBe(true);
    expect(failures.some((failure) => failure.includes('redirect target off origin'))).toBe(true);
  });

  it('fails when the sitemap still carries www loc entries', () => {
    const bad = clone({sitemap: {status: 200, total: 182, www: 5, nonWww: 177, sample: []}});
    expect(assertAll(bad)).toEqual(expect.arrayContaining([expect.stringContaining('sitemap has 5 www loc')]));
  });

  it('fails when the robots.txt Sitemap: line advertises www', () => {
    const bad = clone({robots: {status: 200, sitemaps: ['https://www.legendary-branding.com/sitemap.xml']}});
    expect(assertAll(bad)).toEqual(expect.arrayContaining([expect.stringContaining('Sitemap: line points to www')]));
  });

  it('fails when a page has noindex', () => {
    const bad = clone({indexable: [{path: '/', status: 200, canonical: ['https://legendary-branding.com/'], noindex: true}]});
    expect(assertAll(bad)).toEqual(expect.arrayContaining([expect.stringContaining('has noindex')]));
  });

  it('fails when a page has more than one canonical tag', () => {
    const bad = clone({indexable: [{path: '/', status: 200, canonical: ['https://legendary-branding.com/', 'https://legendary-branding.com/'], noindex: false}]});
    expect(assertAll(bad)).toEqual(expect.arrayContaining([expect.stringContaining('has 2 canonical')]));
  });

  it('passes when /api/release serves the expected SHA with a complete env contract', () => {
    expect(assertAll(PASS_BASELINE, 'abcdef1234')).toEqual([]);
  });

  it('fails when /api/release reports a sha other than the expected release SHA', () => {
    const failures = assertAll(PASS_BASELINE, 'deadbeef');
    expect(failures).toEqual(expect.arrayContaining([expect.stringContaining('!= expected deadbeef')]));
  });

  it('fails when the release probe is not 200 (origin down or serving an error)', () => {
    const bad = clone({release: {status: 503, release: undefined}});
    expect(assertAll(bad, 'abcdef1234')).toEqual(expect.arrayContaining([expect.stringContaining('probe status 503')]));
  });

  it('fails when the release probe reports an incomplete runtime env contract', () => {
    const bad = clone({release: {status: 200, release: {ok: false, sha: 'abcdef1234', missing: 2}}});
    expect(assertAll(bad, 'abcdef1234')).toEqual(expect.arrayContaining([expect.stringContaining('incomplete runtime env contract')]));
  });

  it('fails when the release probe reports no sha', () => {
    const bad = clone({release: {status: 200, release: {ok: true, missing: 0}}});
    expect(assertAll(bad, 'abcdef1234')).toEqual(expect.arrayContaining([expect.stringContaining('did not report a sha')]));
  });

  it('does not check the release probe when no expected SHA is supplied', () => {
    expect(assertAll(PASS_BASELINE, null)).toEqual([]);
    // Even a down probe is ignored without an expected SHA (callers that want the
    // gate pass --release-sha; local snapshots may omit it).
    const noSha = clone({release: {status: 0, release: undefined}});
    expect(assertAll(noSha)).toEqual([]);
  });
});
