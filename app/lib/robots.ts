/**
 * AI SEARCH crawlers: these decide whether the brand can be found and cited in
 * AI answers. Keep them allowed. Google-Extended is a control token (not a
 * crawler): it gates Gemini grounding, i.e. Google serving this site's Search
 * index content to Gemini at answer time, and it also permits Gemini training.
 * It does not affect Google Search ranking or inclusion.
 */
export const AI_SEARCH_CRAWLERS = [
  'OAI-SearchBot', // ChatGPT search -- sites that opt out are not shown in its answers
  'Claude-SearchBot',
  'PerplexityBot',
  'meta-webindexer', // Meta AI search results and citations
  'Amzn-SearchBot', // Alexa and other Amazon search
  'Google-Extended',
] as const;

/**
 * Fetchers that load a page when a person asks an assistant about it. Several
 * say they may ignore robots.txt (ChatGPT-User, Perplexity-User,
 * meta-externalfetcher, Amzn-User); they are named so the intent is explicit
 * and the rules still apply wherever they are honoured.
 */
export const AI_ASSISTANT_FETCHERS = ['ChatGPT-User', 'Claude-User', 'Perplexity-User', 'meta-externalfetcher', 'Amzn-User'] as const;

/**
 * Model-TRAINING crawlers. Owner policy: allowed (agentic commerce). This is
 * independent of search visibility: OpenAI and Anthropic both document that
 * search/assistant bots can stay allowed while these are blocked. Pass
 * `allowTraining: false` to buildRobotsTxt to switch them to `Disallow: /`.
 */
export const AI_TRAINING_CRAWLERS = ['GPTBot', 'ClaudeBot', 'meta-externalagent', 'Amazonbot'] as const;

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

const group = (comment: string, agents: readonly string[], lines: readonly string[]) => [
  `# ${comment}`,
  ...agents.map((agent) => `User-agent: ${agent}`),
  ...lines,
  '',
];

export function buildRobotsTxt({
  origin,
  indexable,
  allowTraining = true,
}: {
  origin: string;
  indexable: boolean;
  allowTraining?: boolean;
}): string {
  if (!indexable) return 'User-agent: *\nDisallow: /\n';

  const rules = [...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`), ...DISALLOWED_PARAMS.map((param) => `Disallow: /*?*${param}=`)];
  // NOTE: a named group REPLACES the wildcard group for that crawler, so each one repeats every rule.
  const open = ['Allow: /', ...rules];

  return [
    ...group('Everyone else: Google, Bing, Apple, social previews, any crawler not named below', ['*'], rules),
    ...group('AI search and assistant crawlers: allowed so the brand can be found and cited', [...AI_SEARCH_CRAWLERS, ...AI_ASSISTANT_FETCHERS], open),
    ...group('AI model-training crawlers', AI_TRAINING_CRAWLERS, allowTraining ? open : ['Disallow: /']),
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}
