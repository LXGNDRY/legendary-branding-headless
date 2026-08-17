import type {LoaderFunctionArgs} from 'react-router';
import {CacheLong} from '~/lib/cache';

const SITEMAP_PRODUCTS_QUERY = `#graphql
  query SitemapProducts($country: CountryCode, $language: LanguageCode, $first: Int = 250)
    @inContext(country: $country, language: $language) {
    products(first: $first) {
      nodes {
        handle
        updatedAt
      }
    }
  }
` as const;

const SITEMAP_COLLECTIONS_QUERY = `#graphql
  query SitemapCollections($country: CountryCode, $language: LanguageCode, $first: Int = 250)
    @inContext(country: $country, language: $language) {
    collections(first: $first) {
      nodes {
        handle
        updatedAt
      }
    }
  }
` as const;

const SITEMAP_PAGES_QUERY = `#graphql
  query SitemapPages($country: CountryCode, $language: LanguageCode, $first: Int = 100)
    @inContext(country: $country, language: $language) {
    pages(first: $first) {
      nodes {
        handle
        updatedAt
      }
    }
  }
` as const;

const STATIC_PAGES = [
  {path: '/', priority: '1.0', changefreq: 'daily'},
  {path: '/collections/all-products', priority: '0.9', changefreq: 'daily'},
  {path: '/search', priority: '0.3', changefreq: 'weekly'},
];

/**
 * Sitemap.xml — resource route.
 *
 * Crawls products, collections, and pages from Shopify,
 * plus static routes, and outputs a standards-compliant sitemap XML.
 *
 * Cached for 1 hour with 24h SWR.
 */
export async function loader({request, context}: LoaderFunctionArgs) {
  // Use PUBLIC_CHECKOUT_DOMAIN when available so sitemap URLs always point
  // to the canonical domain rather than the Oxygen preview origin.
  const env = context.env as {PUBLIC_CHECKOUT_DOMAIN?: string};
  const origin = env.PUBLIC_CHECKOUT_DOMAIN
    ? `https://${env.PUBLIC_CHECKOUT_DOMAIN}`
    : new URL(request.url).origin;

  const [productsRes, collectionsRes, pagesRes] = await Promise.all([
    context.storefront.query(SITEMAP_PRODUCTS_QUERY, {
      variables: {
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
      cache: CacheLong(),
    }),
    context.storefront.query(SITEMAP_COLLECTIONS_QUERY, {
      variables: {
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
      cache: CacheLong(),
    }),
    context.storefront.query(SITEMAP_PAGES_QUERY, {
      variables: {
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
      cache: CacheLong(),
    }),
  ]);

  const products = (productsRes.products as {nodes: {handle: string; updatedAt: string}[]})?.nodes ?? [];
  const collections = (collectionsRes.collections as {nodes: {handle: string; updatedAt: string}[]})?.nodes ?? [];
  const pages = (pagesRes.pages as {nodes: {handle: string; updatedAt: string}[]})?.nodes ?? [];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_PAGES.map(p => `  <url>
    <loc>${origin}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
${collections.map(c => `  <url>
    <loc>${origin}/collections/${c.handle}</loc>
    <lastmod>${c.updatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
${products.map(p => `  <url>
    <loc>${origin}/products/${p.handle}</loc>
    <lastmod>${p.updatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
${pages.map(p => `  <url>
    <loc>${origin}/pages/${p.handle}</loc>
    <lastmod>${p.updatedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
