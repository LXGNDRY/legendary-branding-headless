import {describe, expect, it} from 'vitest';
import {loader} from '~/routes/[robots.txt]';
import {
  AI_ASSISTANT_FETCHERS,
  AI_SEARCH_CRAWLERS,
  AI_TRAINING_CRAWLERS,
  DISALLOWED_PATHS,
  buildRobotsTxt,
  isIndexableHost,
} from './robots';

const ORIGIN = 'https://www.legendary-branding.com';
const lines = (text: string) => text.split('\n');
const directive = /^(User-agent|Allow|Disallow|Sitemap): \S/;
const blocks = (text: string) => text.split('\n\n').filter((block) => block.includes('User-agent:'));
const agentsOf = (block: string) => lines(block).filter((l) => l.startsWith('User-agent:')).map((l) => l.slice(12));
const rulesOf = (block: string) => lines(block).filter((l) => l.startsWith('Disallow:'));
const blockFor = (text: string, agent: string) => blocks(text).find((block) => agentsOf(block).includes(agent))!;

describe('buildRobotsTxt', () => {
  const text = buildRobotsTxt({origin: ORIGIN, indexable: true});

  it('is one well-formed directive (or comment) per line', () => {
    const bad = lines(text).filter((line) => line.trim() && !line.startsWith('#') && !directive.test(line));
    expect(bad).toEqual([]);
  });

  it('blocks the bare paths, not just their subtrees', () => {
    expect(lines(text)).toEqual(expect.arrayContaining(['Disallow: /cart', 'Disallow: /account', 'Disallow: /search', 'Disallow: /wishlist']));
    expect(text).not.toContain('Disallow: /cart/');
  });

  it('blocks collection facets but not canonicalised parameters', () => {
    expect(text).toContain('Disallow: /*?*sort=');
    expect(text).toContain('Disallow: /*?*tag=');
    expect(text).not.toMatch(/utm_|currency|country/);
  });

  it('never blocks anything the sitemap publishes', () => {
    const published = ['/products/x', '/collections/x', '/collections', '/pages/about', '/journal', '/journal/x', '/policies/refund-policy', '/'];
    for (const path of published) {
      expect(DISALLOWED_PATHS.some((blocked) => path.startsWith(blocked)), path).toBe(false);
    }
  });

  it('names each AI crawler once, with valid tokens', () => {
    const all = [...AI_SEARCH_CRAWLERS, ...AI_ASSISTANT_FETCHERS, ...AI_TRAINING_CRAWLERS];
    expect(new Set(all).size).toBe(all.length);
    for (const agent of all) expect(agent).toMatch(/^[A-Za-z0-9_-]+$/);
    for (const agent of ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'meta-webindexer', 'Amzn-SearchBot', 'ChatGPT-User']) {
      expect(blockFor(text, agent), agent).toContain('Allow: /');
    }
  });

  it('gives every named group the same disallow rules as the wildcard group', () => {
    const wildcard = rulesOf(blockFor(text, '*'));
    for (const agent of [...AI_SEARCH_CRAWLERS, ...AI_ASSISTANT_FETCHERS, ...AI_TRAINING_CRAWLERS]) {
      expect(rulesOf(blockFor(text, agent)), agent).toEqual(wildcard);
    }
  });

  it('declares the sitemap once, on the canonical host', () => {
    expect(lines(text).filter((line) => line.startsWith('Sitemap:'))).toEqual([`Sitemap: ${ORIGIN}/sitemap.xml`]);
  });

  it('can block training crawlers without touching AI search visibility', () => {
    const noTraining = buildRobotsTxt({origin: ORIGIN, indexable: true, allowTraining: false});
    for (const agent of AI_TRAINING_CRAWLERS) expect(rulesOf(blockFor(noTraining, agent))).toEqual(['Disallow: /']);
    expect(blockFor(noTraining, 'OAI-SearchBot')).toContain('Allow: /');
    expect(blockFor(noTraining, 'Google-Extended')).toContain('Allow: /');
  });

  it('blocks everything when the host is not indexable', () => {
    expect(buildRobotsTxt({origin: ORIGIN, indexable: false})).toBe('User-agent: *\nDisallow: /\n');
  });
});

describe('isIndexableHost', () => {
  it('only blocks Oxygen deployment hosts', () => {
    expect(isIndexableHost('01abc-ce137ca1306df9eea6fa.myshopify.dev')).toBe(false);
    expect(isIndexableHost('www.legendary-branding.com')).toBe(true);
    expect(isIndexableHost('legendary-branding.com')).toBe(true);
    expect(isIndexableHost('localhost:3000')).toBe(true);
  });
});

describe('robots.txt route', () => {
  const run = (url: string, domain?: string) =>
    loader({request: new Request(url), context: {env: {PUBLIC_CHECKOUT_DOMAIN: domain}}} as never);

  it('serves the rules as text/plain, cached for an hour so fixes propagate quickly', async () => {
    const response = await run('https://www.legendary-branding.com/robots.txt', 'legendary-branding.com');
    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(response.headers.get('Cache-Control')).toContain('max-age=3600');
    expect(await response.text()).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  it('blocks an Oxygen deployment URL even when the domain variable is set', async () => {
    const response = await run('https://01abc.myshopify.dev/robots.txt', 'legendary-branding.com');
    expect(await response.text()).toBe('User-agent: *\nDisallow: /\n');
  });
});
