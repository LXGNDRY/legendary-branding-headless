import type {MetaFunction, LoaderFunctionArgs} from 'react-router';
import {useLoaderData, Form, useNavigation} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import Container from '~/components/ui/Container';
import type {ProductCardFragment} from '~/components/ui/ProductCard';
import {PRODUCT_CARD_FRAGMENT} from '~/components/ui/ProductCard';
import ProductCard from '~/components/ui/ProductCard';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';

type ArticleResult = {
  id: string;
  title: string;
  handle: string;
  publishedAt: string;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  blog: {handle: string};
};

type CollectionResult = {
  id: string;
  title: string;
  handle: string;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
};

type SearchResults = {
  products: {nodes: ProductCardFragment[]};
  articles: {nodes: ArticleResult[]};
  collections: {nodes: CollectionResult[]};
} | null;

const SEARCH_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query Search(
    $query: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products: search(query: $query, types: [PRODUCT], first: 12) {
      nodes {
        ... on Product {
          ...ProductCard
        }
      }
    }
    collections: search(query: $query, types: [COLLECTION], first: 4) {
      nodes {
        ... on Collection {
          id
          title
          handle
          image { url altText width height }
        }
      }
    }
    articles: search(query: $query, types: [ARTICLE], first: 6) {
      nodes {
        ... on Article {
          id
          title
          handle
          publishedAt
          image { url altText width height }
          blog { handle }
        }
      }
    }
  }
` as const;

export const meta: MetaFunction<typeof loader> = ({data}) => {
  const q = data?.query;
  return [
    {title: q ? `"${q}" — Search — LEGENDARY BRANDING` : 'Search — LEGENDARY BRANDING'},
    {name: 'description', content: 'Search Legendary Branding products and articles.'},
  ];
};

export async function loader({request, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim() ?? '';

  if (!query) {
    return {query: '', results: null as SearchResults, totalCount: 0};
  }

  const {products, collections, articles} = await context.storefront.query(SEARCH_QUERY, {
    variables: {
      query,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
  });

  const totalCount =
    (products?.nodes?.length ?? 0) +
    (collections?.nodes?.length ?? 0) +
    (articles?.nodes?.length ?? 0);

  return {
    query,
    results: {
      products: products ?? {nodes: []},
      collections: collections ?? {nodes: []},
      articles: articles ?? {nodes: []},
    } as SearchResults,
    totalCount,
  };
}

export default function SearchPage() {
  const {query, results, totalCount} = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSearching = navigation.state === 'loading';

  const productNodes = (results?.products?.nodes ?? []) as ProductCardFragment[];
  const collectionNodes = (results?.collections?.nodes ?? []) as CollectionResult[];
  const articleNodes = (results?.articles?.nodes ?? []) as ArticleResult[];

  return (
    <Container className="py-16">
      <div className="max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Search</h1>

        <Form method="get" action="/search">
          <div className="flex gap-0 border border-[#0a0a0a]">
            <label htmlFor="search-q" className="sr-only">Search</label>
            <input
              id="search-q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search products, collections, articles…"
              autoFocus
              className="flex-1 px-5 py-4 text-sm outline-none tracking-wide placeholder:text-[#999999] bg-transparent"
            />
            <button
              type="submit"
              className="px-6 py-4 bg-[#0a0a0a] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#333333] transition-colors"
            >
              Search
            </button>
          </div>
        </Form>
      </div>

      {isSearching && (
        <div className="text-center py-12 text-sm text-[#6b6b6b] tracking-wide">
          Searching…
        </div>
      )}

      {!isSearching && query && results && (
        <>
          <p className="text-xs text-[#6b6b6b] tracking-wide mb-10">
            {totalCount > 0
              ? `${totalCount} result${totalCount !== 1 ? 's' : ''} for "${query}"`
              : `No results for "${query}"`}
          </p>

          {/* Products */}
          {productNodes.length > 0 && (
            <section className="mb-14">
              <h2 className="text-[10px] font-semibold tracking-widest uppercase mb-6 pb-3 border-b border-[#e5e5e5]">
                Products ({productNodes.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {productNodes.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    loading={i < 4 ? 'eager' : 'lazy'}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Collections */}
          {collectionNodes.length > 0 && (
            <section className="mb-14">
              <h2 className="text-[10px] font-semibold tracking-widest uppercase mb-6 pb-3 border-b border-[#e5e5e5]">
                Collections ({collectionNodes.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {collectionNodes.map((col) => (
                  <Link
                    key={col.id}
                    to={`/collections/${col.handle}`}
                    prefetch="intent"
                    className="group block"
                  >
                    <div className="overflow-hidden bg-[#f7f7f7] mb-3">
                      {col.image ? (
                        <Image
                          data={col.image}
                          aspectRatio="4/3"
                          sizes="(min-width: 768px) 25vw, 50vw"
                          className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="aspect-[4/3] bg-[#e5e5e5]" />
                      )}
                    </div>
                    <p className="text-xs font-medium tracking-[0.12em] uppercase group-hover:text-[#6b6b6b] transition-colors">
                      {col.title}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Articles */}
          {articleNodes.length > 0 && (
            <section className="mb-14">
              <h2 className="text-[10px] font-semibold tracking-widest uppercase mb-6 pb-3 border-b border-[#e5e5e5]">
                Journal ({articleNodes.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {articleNodes.map((article) => (
                  <Link
                    key={article.id}
                    to={`/journal/${article.handle}`}
                    prefetch="intent"
                    className="group block"
                  >
                    <div className="overflow-hidden bg-[#f7f7f7] mb-3">
                      {article.image ? (
                        <Image
                          data={article.image}
                          aspectRatio="3/2"
                          sizes="(min-width: 768px) 33vw, 100vw"
                          className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="aspect-[3/2] bg-[#e5e5e5]" />
                      )}
                    </div>
                    <p className="text-xs text-[#999999] tracking-wide mb-1">
                      {new Date(article.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm font-medium leading-snug group-hover:text-[#6b6b6b] transition-colors">
                      {article.title}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {totalCount === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-[#6b6b6b] tracking-wide mb-6">
                Try a different term, or browse our collections.
              </p>
              <Link
                to="/collections/all-products"
                className="text-xs font-semibold tracking-widest uppercase underline underline-offset-2 text-[#0a0a0a] hover:text-[#6b6b6b] transition-colors"
              >
                Shop All Products
              </Link>
            </div>
          )}
        </>
      )}

      {!query && !isSearching && (
        <div className="text-center py-10">
          <p className="text-xs text-[#6b6b6b] tracking-wide">
            Enter a term above to search products, collections, and articles.
          </p>
        </div>
      )}
    </Container>
  );
}
