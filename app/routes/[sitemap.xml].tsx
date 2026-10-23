import type {LoaderFunctionArgs} from 'react-router';
import {CacheLong} from '~/lib/cache';
import {localizedUrlEntries} from '~/lib/sitemap';
import {POLICY_PAGES, ROUTES, SITE_ORIGIN, isPolicyHandle, type PolicyHandle} from '~/lib/site';

const PRODUCTS_QUERY = `#graphql
  query SitemapProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) { nodes { handle updatedAt } pageInfo { hasNextPage endCursor } }
  }
` as const;
const COLLECTIONS_QUERY = `#graphql
  query SitemapCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) { nodes { handle updatedAt } pageInfo { hasNextPage endCursor } }
  }
` as const;
const PAGES_QUERY = `#graphql
  query SitemapPages($first: Int!, $after: String) {
    pages(first: $first, after: $after) { nodes { handle updatedAt } pageInfo { hasNextPage endCursor } }
  }
` as const;
const ARTICLES_QUERY = `#graphql
  query SitemapArticles($blogHandle: String!, $first: Int!, $after: String) {
    blog(handle: $blogHandle) {
      articles(first: $first, after: $after) { nodes { handle } pageInfo { hasNextPage endCursor } }
    }
  }
` as const;

// NOTE: the same content the policy route checks (built-in policy body, or the Page of that handle's body), so the
// sitemap can never list a URL that answers 503. Aliases because handles contain hyphens.
const POLICIES_QUERY = `#graphql
  query SitemapPolicies {
    shop {
      refundPolicy { body }
      termsOfService { body }
      shippingPolicy { body }
      privacyPolicy { body }
    }
    refund: page(handle: "refund-policy") { body }
    terms: page(handle: "terms-of-service") { body }
    privacy: page(handle: "privacy-with-legendary-branding") { body }
    shipping: page(handle: "shipping-policy") { body }
    sizeGuide: page(handle: "size-guide") { body }
    about: page(handle: "about") { body }
    faq: page(handle: "legendary_branding_faqs") { body }
  }
` as const;

const POLICY_PAGE_ALIASES: Record<string, string> = {
  'refund-policy': 'refund',
  'terms-of-service': 'terms',
  'privacy-with-legendary-branding': 'privacy',
  'shipping-policy': 'shipping',
  'size-guide': 'sizeGuide',
  about: 'about',
  legendary_branding_faqs: 'faq',
};

type Node = {handle: string; updatedAt?: string};
type Connection = {nodes: Node[]; pageInfo: {hasNextPage: boolean; endCursor?: string | null}};

function sitemapUnavailable() {
  return new Response('Sitemap temporarily unavailable', {
    status: 503,
    headers: {'Cache-Control': 'no-store', 'Retry-After': '300'},
  });
}

async function paginate(queryPage: (after: string | null) => Promise<Connection | null | undefined>) {
  const nodes = new Map<string, Node>();
  const seen = new Set<string>();
  let after: string | null = null;
  for (let page = 0; page < 100; page += 1) {
    const connection = await queryPage(after);
    // NOTE: a missing optional blog is valid only before pagination begins.
    if (!connection && after === null) return [];
    if (!connection) throw sitemapUnavailable();
    for (const node of connection.nodes) nodes.set(node.handle, node);
    if (!connection.pageInfo.hasNextPage) return [...nodes.values()];
    const next = connection.pageInfo.endCursor;
    if (!next || seen.has(next)) throw sitemapUnavailable();
    seen.add(next);
    after = next;
  }
  throw sitemapUnavailable();

}

export async function loader({context}: LoaderFunctionArgs) {
  // NOTE: always the canonical public origin (~/lib/site), the same one every canonical tag, og:url and JSON-LD uses.
  const origin = SITE_ORIGIN;
  // NOTE: deliberately no @inContext/country/language -- the response is served from a shared public cache, so it must be identical for every market (the shop's default market and language).
  const variables = {first: 250};

  const [products, collections, pages, articles, policies] = await Promise.all([
    paginate(async (after) => (await context.storefront.query(PRODUCTS_QUERY, {variables: {...variables, after}, cache: CacheLong()})).products as Connection),
    paginate(async (after) => (await context.storefront.query(COLLECTIONS_QUERY, {variables: {...variables, after}, cache: CacheLong()})).collections as Connection),
    paginate(async (after) => (await context.storefront.query(PAGES_QUERY, {variables: {...variables, after}, cache: CacheLong()})).pages as Connection),
    paginate(async (after) => (await context.storefront.query(ARTICLES_QUERY, {variables: {...variables, after, blogHandle: 'legendary_blogging'}, cache: CacheLong()})).blog?.articles as Connection | undefined),
    context.storefront.query(POLICIES_QUERY, {cache: CacheLong()}) as Promise<Record<string, unknown> & {shop?: Record<string, {body?: string | null} | null> | null}>,
  ]);

  // NOTE: a policy URL is listed only when the route would serve content for it (a built-in policy body, or the body of
  // the Page of that handle). Contact is always served (it renders its own block).
  const usable = (handle: PolicyHandle) => {
    const entry = POLICY_PAGES[handle];
    if (!entry.required) return true;
    const native = entry.native ? policies?.shop?.[entry.native]?.body : null;
    const alias = POLICY_PAGE_ALIASES[handle];
    const page = alias ? (policies?.[alias] as {body?: string | null} | null | undefined)?.body : null;
    return Boolean(native) || Boolean(page);
  };
  const policyHandles = (Object.keys(POLICY_PAGES) as PolicyHandle[]).filter(usable);

  // SEO-07: every logical page is advertised in all 8 enabled languages with reciprocal
  // xhtml:link alternates. Each urlset entry fans out into 8 <url> blocks, so a 182-URL
  // inventory becomes ~1456 entries (well under the 50,000 cap).
  const entries = [
    localizedUrlEntries(origin, '/'),
    localizedUrlEntries(origin, '/collections'),
    localizedUrlEntries(origin, '/journal'),
    ...collections.map((item) => localizedUrlEntries(origin, `/collections/${item.handle}`, item.updatedAt)),
    // NOTE: no <lastmod> for products -- Shopify bumps Product.updatedAt on every inventory adjustment (each order), which is not a real content change.
    ...products.map((item) => localizedUrlEntries(origin, `/products/${item.handle}`)),
    ...policyHandles.map((handle) => localizedUrlEntries(origin, ROUTES.policy(handle))),
    // NOTE: pages with a policy handle redirect to /policies, so they are not listed twice.
    ...pages.filter((item) => !isPolicyHandle(item.handle)).map((item) => localizedUrlEntries(origin, ROUTES.page(item.handle), item.updatedAt)),
    // NOTE: no <lastmod> for articles: the Storefront API exposes only publishedAt, which is not a modified date.
    ...articles.map((item) => localizedUrlEntries(origin, ROUTES.article(item.handle))),
  ];

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>`, {
    headers: {'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'},
  });
}
