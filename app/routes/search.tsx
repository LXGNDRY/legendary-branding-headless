import {
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
  useNavigate,
  Link,
  Form,
} from 'react-router';
import {useState} from 'react';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
import Container from '~/components/ui/Container';
import Button from '~/components/ui/Button';
import ProductCard from '~/components/ui/ProductCard';
import {CacheShort} from '~/lib/cache';

const SEARCH_QUERY = `#graphql
  query Search(
    $query: String!
    $first: Int
    $last: Int
    $after: String
    $before: String
    $sortKey: SearchSortKeys
    $reverse: Boolean
    $availableV2: Boolean
    $productType: String
    $productVendor: String
    $minPrice: Float
    $maxPrice: Float
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    search(
      query: $query
      first: $first
      last: $last
      after: $after
      before: $before
      sortKey: $sortKey
      reverse: $reverse
      productFilters: [
        {productVendor: $productVendor}
        {productType: $productType}
        {available: $availableV2}
        {price: {min: $minPrice, max: $maxPrice}}
      ]
    ) {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      products: edges {
        cursor
        node {
          ... on Product {
            id
            title
            handle
            vendor
            productType
            availableForSale
            tags
            description
            featuredImage {
              id
              url
              altText
              width
              height
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
              maxVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
      productFilters {
        id
        label
        type
        values {
          label
          input
          count
        }
      }
    }
  }
` as const;

const SORT_OPTIONS = [
  {key: 'RELEVANCE', label: 'Relevance', reverse: false},
  {key: 'PRICE', label: 'Price: Low to High', reverse: false},
  {key: 'PRICE', label: 'Price: High to Low', reverse: true},
  {key: 'TITLE', label: 'Alphabetical: A-Z', reverse: false},
  {key: 'TITLE', label: 'Alphabetical: Z-A', reverse: true},
  {key: 'CREATED_AT', label: 'Newest First', reverse: true},
  {key: 'BEST_SELLING', label: 'Best Selling', reverse: false},
];

interface SearchProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  productType: string;
  availableForSale: boolean;
  tags: string[];
  featuredImage: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
  priceRange: {
    minVariantPrice: {amount: string; currencyCode: CurrencyCode};
    maxVariantPrice: {amount: string; currencyCode: CurrencyCode};
  };
}

interface SearchResult {
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  };
  products: {cursor: string; node: SearchProduct}[];
  filters: {
    id: string;
    label: string;
    type: string;
    values: {label: string; value: string; input: string; count: number}[];
  }[];
}

const PAGE_SIZE = 24;

export const meta: MetaFunction<typeof loader> = ({data}) => [
  {title: `Search: ${data?.query ?? ''} — LEGENDARY BRANDING`},
  {name: 'description', content: `Search results for "${data?.query ?? ''}" at Legendary Branding.`},
  {robots: 'noindex, follow'},
];

export async function loader({request, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim() ?? '';
  const sortKey = url.searchParams.get('sort') ?? 'RELEVANCE';
  const reverse = url.searchParams.get('reverse') === 'true';
  const after = url.searchParams.get('after') ?? undefined;
  const before = url.searchParams.get('before') ?? undefined;
  const minPrice = url.searchParams.get('min_price') ?? undefined;
  const maxPrice = url.searchParams.get('max_price') ?? undefined;
  const inStock = url.searchParams.get('in_stock') === '1';
  const productType = url.searchParams.get('type') ?? undefined;
  const vendor = url.searchParams.get('vendor') ?? undefined;

  if (!query) {
    return {
      query: '',
      search: null,
      sortKey,
      reverse,
    };
  }

  const {search} = await context.storefront.query(SEARCH_QUERY, {
    variables: {
      query,
      first: !before ? PAGE_SIZE : undefined,
      last: before ? PAGE_SIZE : undefined,
      after,
      before,
      sortKey,
      reverse,
      availableV2: inStock || undefined,
      productType,
      productVendor: vendor,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
    cache: CacheShort(),
  });

  return {
    query,
    search: search as SearchResult,
    sortKey,
    reverse,
  };
}

export default function SearchPage() {
  const {query, search, sortKey, reverse} = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [sortValue, setSortValue] = useState(`${sortKey}-${String(reverse)}`);

  // No query — show search form
  if (!query) {
    return (
      <Container className="py-20">
        <div className="max-w-xl mx-auto text-center">
          <p className="h-eyebrow mb-4">SEARCH</p>
          <h1 className="text-4xl font-normal tracking-tight mb-8">
            Find what you're looking for
          </h1>
          <Form method="get" action="/search">
            <input
              type="search"
              name="q"
              placeholder="Search products, collections, and more..."
              className="w-full bg-transparent border-b border-black/20 py-3 text-lg focus:outline-none focus:border-black transition-colors placeholder:text-black/40"
              autoFocus
            />
          </Form>
        </div>
      </Container>
    );
  }

  const products = search?.products.map(p => p.node) ?? [];
  const total = search?.totalCount ?? 0;

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const [newSortKey, newReverse] = e.target.value.split('-');
    setSortValue(e.target.value);
    const params = new URLSearchParams(window.location.search);
    params.set('sort', newSortKey);
    params.set('reverse', newReverse);
    params.delete('after');
    params.delete('before');
    navigate(`/search?${params.toString()}`);
  }

  return (
    <Container className="py-12">
      <header className="mb-10">
        <p className="h-eyebrow mb-3">SEARCH RESULTS</p>
        <h1 className="font-serif text-3xl md:text-4xl font-normal mb-2">
          &ldquo;{query}&rdquo;
        </h1>
        <p className="text-sm text-black/50">
          {total} {total === 1 ? 'result' : 'results'} found
        </p>
      </header>

      {total === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-black/60 mb-6">
            No products match your search.
          </p>
          <p className="text-sm text-black/40 mb-8">
            Try a different keyword or browse our collections.
          </p>
          <Button as="link" to="/collections/all-products" variant="solid">
            Browse All Products
          </Button>
        </div>
      ) : (
        <>
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-black/50">
              Showing {Math.min(products.length, total)} of {total}
            </p>
            <div className="flex items-center gap-3">
              <label htmlFor="sort" className="text-xs text-black/50 uppercase tracking-wider">
                Sort
              </label>
              <select
                id="sort"
                value={sortValue}
                onChange={handleSortChange}
                className="text-sm bg-transparent border border-black/20 px-3 py-1.5 focus:outline-none focus:border-black"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={`${opt.key}-${String(opt.reverse)}`} value={`${opt.key}-${String(opt.reverse)}`}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
{products.map(product => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    compareAtPriceRange: product.priceRange,
                  }}
                />
              ))}
          </div>

          {/* Pagination */}
          {search && (search.pageInfo.hasNextPage || search.pageInfo.hasPreviousPage) && (
            <div className="flex justify-between items-center mt-12 pt-8 border-t border-black/10">
              {search.pageInfo.hasPreviousPage ? (
                <Link
                  to={`/search?q=${encodeURIComponent(query)}&before=${search.pageInfo.startCursor}&sort=${sortKey}&reverse=${reverse}`}
                  className="text-xs font-medium tracking-widest uppercase hover:opacity-70 transition-opacity"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="text-xs text-black/30">← Previous</span>
              )}

              {search.pageInfo.hasNextPage ? (
                <Link
                  to={`/search?q=${encodeURIComponent(query)}&after=${search.pageInfo.endCursor}&sort=${sortKey}&reverse=${reverse}`}
                  className="text-xs font-medium tracking-widest uppercase hover:opacity-70 transition-opacity"
                >
                  Next →
                </Link>
              ) : (
                <span className="text-xs text-black/30">Next →</span>
              )}
            </div>
          )}
        </>
      )}
    </Container>
  );
}
