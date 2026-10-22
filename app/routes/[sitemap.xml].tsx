import type {LoaderFunctionArgs} from 'react-router';
import {CacheLong} from '~/lib/cache';
import {urlEntry} from '~/lib/sitemap';
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

const POLICIES_QUERY = `#graphql
  query SitemapPolicies {
    shop {
      refundPolicy { id }
      termsOfService { id }
      shippingPolicy { id }
      privacyPolicy { id }
    }
  }
` as const;

type Node = {handle: string; updatedAt?: string};
type Connection = {nodes: Node[]; pageInfo: {hasNextPage: boolean; endCursor?: string | null}};

async function paginate(queryPage: (after: string | null) => Promise<Connection | null | undefined>) {
  const nodes: Node[] = [];
  let after: string | null = null;
  for (let page = 0; page < 100; page += 1) {
    const connection = await queryPage(after);
    if (!connection) break;
    nodes.push(...connection.nodes);
    if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) break;
    after = connection.pageInfo.endCursor;
  }
  return nodes;
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
    context.storefront.query(POLICIES_QUERY, {cache: CacheLong()}).then((data) => data.shop as Record<string, {id?: string} | null> | null),
  ]);

  // NOTE: a policy URL is listed only when it serves real content: its built-in store policy exists, or a Page of that
  // handle does. Contact is always served (it renders its own block).
  const pageHandles = new Set(pages.map((item) => item.handle));
  const usable = (handle: PolicyHandle) => {
    const entry = POLICY_PAGES[handle];
    if (!entry.required) return true;
    return Boolean(entry.native && policies?.[entry.native]?.id) || pageHandles.has(handle);
  };
  const policyHandles = (Object.keys(POLICY_PAGES) as PolicyHandle[]).filter(usable);

  const entries = [
    urlEntry(origin, '/'),
    urlEntry(origin, '/collections'),
    urlEntry(origin, '/journal'),
    ...collections.map((item) => urlEntry(origin, `/collections/${item.handle}`, item.updatedAt)),
    // NOTE: no <lastmod> for products -- Shopify bumps Product.updatedAt on every inventory adjustment (each order), which is not a real content change.
    ...products.map((item) => urlEntry(origin, `/products/${item.handle}`)),
    ...policyHandles.map((handle) => urlEntry(origin, ROUTES.policy(handle))),
    // NOTE: pages with a policy handle redirect to /policies, so they are not listed twice.
    ...pages.filter((item) => !isPolicyHandle(item.handle)).map((item) => urlEntry(origin, ROUTES.page(item.handle), item.updatedAt)),
    // NOTE: no <lastmod> for articles: the Storefront API exposes only publishedAt, which is not a modified date.
    ...articles.map((item) => urlEntry(origin, ROUTES.article(item.handle))),
  ];

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`, {
    headers: {'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'},
  });
}
