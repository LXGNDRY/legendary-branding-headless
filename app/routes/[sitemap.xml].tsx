import type {LoaderFunctionArgs} from 'react-router';
import {CacheLong} from '~/lib/cache';

const PRODUCTS_QUERY = `#graphql
  query SitemapProducts($country: CountryCode, $language: LanguageCode, $first: Int!, $after: String)
    @inContext(country: $country, language: $language) {
    products(first: $first, after: $after) { nodes { handle updatedAt } pageInfo { hasNextPage endCursor } }
  }
` as const;
const COLLECTIONS_QUERY = `#graphql
  query SitemapCollections($country: CountryCode, $language: LanguageCode, $first: Int!, $after: String)
    @inContext(country: $country, language: $language) {
    collections(first: $first, after: $after) { nodes { handle updatedAt } pageInfo { hasNextPage endCursor } }
  }
` as const;
const PAGES_QUERY = `#graphql
  query SitemapPages($country: CountryCode, $language: LanguageCode, $first: Int!, $after: String)
    @inContext(country: $country, language: $language) {
    pages(first: $first, after: $after) { nodes { handle updatedAt } pageInfo { hasNextPage endCursor } }
  }
` as const;
const ARTICLES_QUERY = `#graphql
  query SitemapArticles($blogHandle: String!, $country: CountryCode, $language: LanguageCode, $first: Int!, $after: String)
    @inContext(country: $country, language: $language) {
    blog(handle: $blogHandle) {
      articles(first: $first, after: $after) { nodes { handle updatedAt } pageInfo { hasNextPage endCursor } }
    }
  }
` as const;

type Node = {handle: string; updatedAt: string};
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

export function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function urlEntry(origin: string, path: string, options: {lastmod?: string; priority: string; changefreq: string}) {
  return `  <url>\n    <loc>${escapeXml(`${origin}${path}`)}</loc>${options.lastmod ? `\n    <lastmod>${escapeXml(options.lastmod)}</lastmod>` : ''}\n    <changefreq>${options.changefreq}</changefreq>\n    <priority>${options.priority}</priority>\n  </url>`;
}

export async function loader({request, context}: LoaderFunctionArgs) {
  const domain = context.env.PUBLIC_CHECKOUT_DOMAIN?.trim();
  const origin = domain ? `https://${domain}` : new URL(request.url).origin;
  const variables = {country: context.storefront.i18n.country, language: context.storefront.i18n.language, first: 250};

  const [products, collections, pages, articles] = await Promise.all([
    paginate(async (after) => (await context.storefront.query(PRODUCTS_QUERY, {variables: {...variables, after}, cache: CacheLong()})).products as Connection),
    paginate(async (after) => (await context.storefront.query(COLLECTIONS_QUERY, {variables: {...variables, after}, cache: CacheLong()})).collections as Connection),
    paginate(async (after) => (await context.storefront.query(PAGES_QUERY, {variables: {...variables, after}, cache: CacheLong()})).pages as Connection),
    paginate(async (after) => (await context.storefront.query(ARTICLES_QUERY, {variables: {...variables, after, blogHandle: 'legendary_blogging'}, cache: CacheLong()})).blog?.articles as Connection | undefined),
  ]);

  const entries = [
    urlEntry(origin, '/', {priority: '1.0', changefreq: 'daily'}),
    urlEntry(origin, '/collections', {priority: '0.9', changefreq: 'daily'}),
    urlEntry(origin, '/journal', {priority: '0.6', changefreq: 'weekly'}),
    ...collections.map((item) => urlEntry(origin, `/collections/${item.handle}`, {lastmod: item.updatedAt, priority: '0.8', changefreq: 'weekly'})),
    ...products.map((item) => urlEntry(origin, `/products/${item.handle}`, {lastmod: item.updatedAt, priority: '0.7', changefreq: 'weekly'})),
    ...pages.map((item) => urlEntry(origin, `/pages/${item.handle}`, {lastmod: item.updatedAt, priority: '0.5', changefreq: 'monthly'})),
    ...articles.map((item) => urlEntry(origin, `/journal/${item.handle}`, {lastmod: item.updatedAt, priority: '0.6', changefreq: 'monthly'})),
  ];

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`, {
    headers: {'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'},
  });
}
