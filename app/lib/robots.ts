/**
 * AI search/shopping and training crawlers the owner explicitly welcomes
 * (agentic commerce). They get the same rules as everyone else: a named
 * group REPLACES the wildcard group for that crawler, so it must repeat
 * every rule. Remove a name here to stop naming it; delete a name and add a
 * `Disallow: /` group to block it.
 */
export const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ClaudeBot',
  'PerplexityBot',
  'Google-Extended',
  'meta-externalagent',
  'Amazonbot',
] as const;

/**
 * Pages with no search value: personal, transactional or thin. Prefix
 * match, so '/cart' covers '/cart', '/cart/x' and '/cart?x=1' (a trailing
 * slash would miss the bare path), and '/search' covers '/search?q=x'.
 */
export const DISALLOWED_PATHS = ['/account', '/cart', '/checkout', '/wishlist', '/search', '/api/'] as const;

/**
 * Collection filter/sort parameters. Each combination is a new crawlable URL
 * with the same canonical, so they are blocked to save crawl budget. UTM,
 * currency and product-option parameters are deliberately NOT here: their
 * pages declare a clean canonical, and a blocked URL cannot show it.
 */
export const DISALLOWED_PARAMS = ['sort', 'price_min', 'price_max', 'in_stock', 'type', 'tag', 'vendor'] as const;

/** Oxygen deployment URLs (previews and the raw production URL) must never compete with the live domain. */
export function isIndexableHost(host: string): boolean {
  return !host.toLowerCase().endsWith('.myshopify.dev');
}

export function buildRobotsTxt({origin, indexable}: {origin: string; indexable: boolean}): string {
  if (!indexable) return 'User-agent: *\nDisallow: /\n';

  const rules = [...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`), ...DISALLOWED_PARAMS.map((param) => `Disallow: /*?*${param}=`)];

  return [
    'User-agent: *',
    ...rules,
    '',
    ...AI_CRAWLERS.map((crawler) => `User-agent: ${crawler}`),
    'Allow: /',
    ...rules,
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}
