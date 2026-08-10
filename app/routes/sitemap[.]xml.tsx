import type {LoaderFunctionArgs} from 'react-router';

const COLLECTIONS_QUERY = `#graphql
  query SitemapCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 50, sortKey: UPDATED_AT) {
      nodes { handle updatedAt }
    }
  }
` as const;

const PRODUCTS_QUERY = `#graphql
  query SitemapProducts($country: CountryCode, $language: LanguageCode, $first: Int!)
    @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: UPDATED_AT, reverse: true) {
      nodes { handle updatedAt }
    }
  }
` as const;

const ARTICLES_QUERY = `#graphql
  query SitemapArticles($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    blog(handle: "legendary_blogging") {
      articles(first: 50, sortKey: PUBLISHED_AT, reverse: true) {
        nodes { handle publishedAt }
      }
    }
  }
` as const;

function url(base: string, path: string, lastmod?: string) {
  const lastmodTag = lastmod
    ? `\n    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>`
    : '';
  return `  <url>\n    <loc>${base}${path}</loc>${lastmodTag}\n  </url>`;
}

export async function loader({request, context}: LoaderFunctionArgs) {
  const base = new URL(request.url).origin;
  const vars = {
    country: context.storefront.i18n.country,
    language: context.storefront.i18n.language,
  };

  const [collectionsRes, productsRes, articlesRes] = await Promise.all([
    context.storefront.query(COLLECTIONS_QUERY, {variables: vars}),
    context.storefront.query(PRODUCTS_QUERY, {variables: {...vars, first: 250}}),
    context.storefront.query(ARTICLES_QUERY, {variables: vars}),
  ]);

  type HandleNode = {handle: string; updatedAt?: string; publishedAt?: string};

  const collections = (collectionsRes.collections?.nodes ?? []) as HandleNode[];
  const products = (productsRes.products?.nodes ?? []) as HandleNode[];
  const articles = (articlesRes.blog?.articles?.nodes ?? []) as HandleNode[];

  const staticPages = [
    {path: '/', lastmod: undefined},
    {path: '/collections', lastmod: undefined},
    {path: '/journal', lastmod: undefined},
    {path: '/search', lastmod: undefined},
    {path: '/policies/about', lastmod: undefined},
    {path: '/policies/contact', lastmod: undefined},
    {path: '/policies/refund-policy', lastmod: undefined},
    {path: '/policies/shipping-policy', lastmod: undefined},
    {path: '/policies/privacy-with-legendary-branding', lastmod: undefined},
    {path: '/policies/terms-of-service', lastmod: undefined},
    {path: '/policies/size-guide', lastmod: undefined},
  ];

  const urls = [
    ...staticPages.map(({path, lastmod}) => url(base, path, lastmod)),
    ...collections.map((c) => url(base, `/collections/${c.handle}`, c.updatedAt)),
    ...products.map((p) => url(base, `/products/${p.handle}`, p.updatedAt)),
    ...articles.map((a) => url(base, `/journal/${a.handle}`, a.publishedAt)),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
