import {
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
  useNavigate,
  useSearchParams,
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
  productFilters: {
    id: string;
    label: string;
    type: string;
    values: {label: string; input: string; count: number}[];
  }[];
}

const PAGE_SIZE = 24;

export const meta: MetaFunction<typeof loader> = ({data}) => [
  {title: `Search: ${data?.query ?? ''} | LEGENDARY BRANDING`},
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

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M2 4h12M4 8h8M6 12h4" />
    </svg>
  );
}

const FILTER_PARAM_KEYS = ['in_stock', 'type', 'vendor', 'min_price', 'max_price'];

export default function SearchPage() {
  const {query, search, sortKey, reverse} = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortValue, setSortValue] = useState(`${sortKey}-${String(reverse)}`);
  const [filterOpen, setFilterOpen] = useState(false);

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
              className="w-full bg-transparent border-b border-[var(--color-border-medium)] py-3 text-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-[var(--color-text-tertiary)]"
              autoFocus
            />
          </Form>
        </div>
      </Container>
    );
  }

  const products = search?.products.map(p => p.node) ?? [];
  const total = search?.totalCount ?? 0;
  const productFilters = search?.productFilters ?? [];
  const typeFilter = productFilters.find(
    (f) => f.id === 'productType' || f.label.toLowerCase().includes('type'),
  );
  const vendorFilter = productFilters.find(
    (f) => f.id === 'productVendor' || f.label.toLowerCase().includes('brand') || f.label.toLowerCase().includes('vendor'),
  );

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

  function handleFilterChange(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams);
    if (value === null || value === '') params.delete(key);
    else params.set(key, value);
    params.delete('after');
    params.delete('before');
    setSearchParams(params, {replace: true});
  }

  function clearAllFilters() {
    const params = new URLSearchParams(searchParams);
    FILTER_PARAM_KEYS.forEach((k) => params.delete(k));
    params.delete('after');
    params.delete('before');
    setSearchParams(params, {replace: true});
  }

  const hasActiveFilters = FILTER_PARAM_KEYS.some((k) => searchParams.has(k));

  return (
    <Container className="py-12">
      <header className="mb-10">
        <p className="h-eyebrow mb-3">SEARCH RESULTS</p>
        <h1 className="font-serif text-3xl md:text-4xl font-normal mb-2">
          &ldquo;{query}&rdquo;
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {total} {total === 1 ? 'result' : 'results'} found
        </p>
      </header>

      {total === 0 && !hasActiveFilters ? (
        <div className="py-16 text-center">
          <p className="text-lg text-[var(--color-text-secondary)] mb-6">
            No products match your search.
          </p>
          <p className="text-sm text-[var(--color-text-tertiary)] mb-8">
            Try a different keyword or browse our collections.
          </p>
          <Button as="link" to="/collections/all-products" variant="primary">
            Browse All Products
          </Button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar — desktop */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-7">
                <p className="h-eyebrow">Filters</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-[0.7rem] text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] underline underline-offset-2 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="mb-7 border-b border-[var(--color-border-subtle)] pb-7">
                <p className="h-eyebrow mb-4 text-[var(--color-foreground)]">Availability</p>
                <label className="flex items-center gap-2.5 text-[0.85rem] cursor-pointer hover:text-[var(--color-text-secondary)] transition-colors">
                  <input
                    type="checkbox"
                    checked={searchParams.get('in_stock') === '1'}
                    onChange={(e) => handleFilterChange('in_stock', e.target.checked ? '1' : null)}
                    className="w-4 h-4 accent-[var(--color-foreground)] rounded-sm"
                  />
                  In stock only
                </label>
              </div>

              {typeFilter && typeFilter.values.length > 0 && (
                <div className="mb-7 border-b border-[var(--color-border-subtle)] pb-7">
                  <p className="h-eyebrow mb-4 text-[var(--color-foreground)]">{typeFilter.label}</p>
                  <div className="space-y-2.5">
                    {typeFilter.values.slice(0, 15).map((v) => {
                      const isActive = searchParams.get('type') === v.label;
                      return (
                        <label key={v.label} className="flex items-center justify-between text-[0.85rem] cursor-pointer hover:text-[var(--color-text-secondary)] transition-colors">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => handleFilterChange('type', isActive ? null : v.label)}
                              className="w-4 h-4 accent-[var(--color-foreground)]"
                            />
                            {v.label}
                          </div>
                          <span className="text-[0.7rem] text-[var(--color-text-tertiary)]">{v.count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {vendorFilter && vendorFilter.values.length > 0 && (
                <div className="mb-7">
                  <p className="h-eyebrow mb-4 text-[var(--color-foreground)]">{vendorFilter.label}</p>
                  <div className="space-y-2.5">
                    {vendorFilter.values.slice(0, 15).map((v) => {
                      const isActive = searchParams.get('vendor') === v.label;
                      return (
                        <label key={v.label} className="flex items-center justify-between text-[0.85rem] cursor-pointer hover:text-[var(--color-text-secondary)] transition-colors">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => handleFilterChange('vendor', isActive ? null : v.label)}
                              className="w-4 h-4 accent-[var(--color-foreground)]"
                            />
                            {v.label}
                          </div>
                          <span className="text-[0.7rem] text-[var(--color-text-tertiary)]">{v.count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 h-eyebrow text-[var(--color-foreground)] hover:text-[var(--color-text-secondary)] transition-colors min-h-11 py-2 -my-2"
                >
                  <FilterIcon />
                  Filters
                  {hasActiveFilters && (
                    <span className="bg-[var(--color-foreground)] text-[var(--color-text-inverse)] text-[9px] font-bold rounded-full px-1.5 py-0.5">
                      ON
                    </span>
                  )}
                </button>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  Showing {Math.min(products.length, total)} of {total}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="sort" className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider hidden sm:block">
                  Sort
                </label>
                <select
                  id="sort"
                  value={sortValue}
                  onChange={handleSortChange}
                  className="text-sm bg-transparent border border-[var(--color-border-medium)] text-[var(--color-text-primary)] px-3 py-1.5 rounded-md focus:outline-none focus:border-[var(--color-accent)]"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={`${opt.key}-${String(opt.reverse)}`} value={`${opt.key}-${String(opt.reverse)}`}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-6">
                {searchParams.get('in_stock') === '1' && (
                  <button
                    onClick={() => handleFilterChange('in_stock', null)}
                    className="flex items-center gap-1.5 h-eyebrow px-3 py-1.5 border border-[var(--color-foreground)] rounded-full text-[var(--color-foreground)] hover:bg-[var(--color-foreground)] hover:text-[var(--color-text-inverse)] transition-all"
                  >
                    In stock <CloseIcon />
                  </button>
                )}
                {searchParams.get('type') && (
                  <button
                    onClick={() => handleFilterChange('type', null)}
                    className="flex items-center gap-1.5 h-eyebrow px-3 py-1.5 border border-[var(--color-foreground)] rounded-full text-[var(--color-foreground)] hover:bg-[var(--color-foreground)] hover:text-[var(--color-text-inverse)] transition-all"
                  >
                    {searchParams.get('type')} <CloseIcon />
                  </button>
                )}
                {searchParams.get('vendor') && (
                  <button
                    onClick={() => handleFilterChange('vendor', null)}
                    className="flex items-center gap-1.5 h-eyebrow px-3 py-1.5 border border-[var(--color-foreground)] rounded-full text-[var(--color-foreground)] hover:bg-[var(--color-foreground)] hover:text-[var(--color-text-inverse)] transition-all"
                  >
                    {searchParams.get('vendor')} <CloseIcon />
                  </button>
                )}
              </div>
            )}

            {total === 0 ? (
              <div className="py-28 text-center">
                <p className="h-eyebrow mb-4">No products</p>
                <p className="text-[var(--color-text-secondary)] text-sm mb-7">No products match your current filters.</p>
                <button onClick={clearAllFilters} className="h-btn-outline">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
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
            )}

            {/* Pagination */}
            {search && (search.pageInfo.hasNextPage || search.pageInfo.hasPreviousPage) && (
              <div className="flex justify-between items-center mt-12 pt-8 border-t border-[var(--color-border-muted)]">
                {search.pageInfo.hasPreviousPage ? (
                  <Link
                    to={(() => {
                      const p = new URLSearchParams(searchParams);
                      p.set('q', query);
                      p.set('before', search.pageInfo.startCursor);
                      p.delete('after');
                      return `/search?${p.toString()}`;
                    })()}
                    className="text-xs font-medium tracking-widest uppercase hover:opacity-70 transition-opacity"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span className="text-xs text-[var(--color-text-tertiary)]">← Previous</span>
                )}

                {search.pageInfo.hasNextPage ? (
                  <Link
                    to={(() => {
                      const p = new URLSearchParams(searchParams);
                      p.set('q', query);
                      p.set('after', search.pageInfo.endCursor);
                      p.delete('before');
                      return `/search?${p.toString()}`;
                    })()}
                    className="text-xs font-medium tracking-widest uppercase hover:opacity-70 transition-opacity"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="text-xs text-[var(--color-text-tertiary)]">Next →</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-[500] lg:hidden">
          <div className="absolute inset-0 bg-[var(--color-foreground)]/40" onClick={() => setFilterOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-background)] rounded-t-2xl overflow-hidden max-h-[80dvh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border-subtle)]">
              <p className="h-eyebrow text-[var(--color-foreground)]">Filters</p>
              <button onClick={() => setFilterOpen(false)} aria-label="Close filters" className="p-1 text-[var(--color-foreground)]">
                <CloseIcon />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-6 space-y-7">
              <div>
                <p className="h-eyebrow mb-4 text-[var(--color-foreground)]">Availability</p>
                <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={searchParams.get('in_stock') === '1'}
                    onChange={(e) => handleFilterChange('in_stock', e.target.checked ? '1' : null)}
                    className="w-4 h-4 accent-[var(--color-foreground)]"
                  />
                  In stock only
                </label>
              </div>
              {typeFilter && typeFilter.values.length > 0 && (
                <div>
                  <p className="h-eyebrow mb-4 text-[var(--color-foreground)]">{typeFilter.label}</p>
                  <div className="space-y-3">
                    {typeFilter.values.slice(0, 20).map((v) => {
                      const isActive = searchParams.get('type') === v.label;
                      return (
                        <label key={v.label} className="flex items-center justify-between text-sm cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => handleFilterChange('type', isActive ? null : v.label)}
                              className="w-4 h-4 accent-[var(--color-foreground)]"
                            />
                            {v.label}
                          </div>
                          <span className="text-[0.7rem] text-[var(--color-text-tertiary)]">{v.count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              {vendorFilter && vendorFilter.values.length > 0 && (
                <div>
                  <p className="h-eyebrow mb-4 text-[var(--color-foreground)]">{vendorFilter.label}</p>
                  <div className="space-y-3">
                    {vendorFilter.values.slice(0, 20).map((v) => {
                      const isActive = searchParams.get('vendor') === v.label;
                      return (
                        <label key={v.label} className="flex items-center justify-between text-sm cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => handleFilterChange('vendor', isActive ? null : v.label)}
                              className="w-4 h-4 accent-[var(--color-foreground)]"
                            />
                            {v.label}
                          </div>
                          <span className="text-[0.7rem] text-[var(--color-text-tertiary)]">{v.count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-5 border-t border-[var(--color-border-subtle)] flex gap-3">
              <button onClick={clearAllFilters} className="flex-1 h-btn-outline text-[0.7rem] px-4 py-3">
                Clear
              </button>
              <button onClick={() => setFilterOpen(false)} className="flex-1 h-btn-primary text-[0.7rem] px-4 py-3">
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
