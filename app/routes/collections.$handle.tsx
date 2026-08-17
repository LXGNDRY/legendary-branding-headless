import {
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from 'react-router';
import {useState} from 'react';
import {getPaginationVariables, Pagination, Image} from '@shopify/hydrogen';
import Container from '~/components/ui/Container';
import ProductCard, {
  PRODUCT_CARD_FRAGMENT,
  type ProductCardFragment,
} from '~/components/ui/ProductCard';
import Button from '~/components/ui/Button';
import Badge from '~/components/ui/Badge';
import HeroPlaceholder from '~/components/ui/HeroPlaceholder';
import {CacheShort} from '~/lib/cache';

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $filters: [ProductFilter!]
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      title
      description
      handle
      image {
        url
        altText
        width
        height
      }
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        sortKey: $sortKey
        reverse: $reverse
        filters: $filters
      ) {
        nodes {
          ...ProductCard
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
        filters {
          id
          label
          type
          values {
            count
            id
            label
            input
          }
        }
      }
    }
  }
` as const;

const SORT_OPTIONS = [
  {label: 'Featured', value: 'featured', sortKey: 'COLLECTION_DEFAULT', reverse: false},
  {label: 'Best Selling', value: 'best-selling', sortKey: 'BEST_SELLING', reverse: false},
  {label: 'Newest', value: 'newest', sortKey: 'CREATED', reverse: true},
  {label: 'Price: Low → High', value: 'price-asc', sortKey: 'PRICE', reverse: false},
  {label: 'Price: High → Low', value: 'price-desc', sortKey: 'PRICE', reverse: true},
] as const;

type SortKey = 'COLLECTION_DEFAULT' | 'BEST_SELLING' | 'CREATED' | 'PRICE';

interface FilterValue {
  count: number;
  id: string;
  label: string;
  input: string;
}

interface FilterData {
  id: string;
  label: string;
  type: 'PRICE_RANGE' | 'SINGLE' | 'LIST' | 'MULTI';
  values: FilterValue[];
}

interface CollectionData {
  id: string;
  title: string;
  description: string;
  handle: string;
  image?: {url: string; altText?: string | null} | null;
  products: {
    nodes: ProductCardFragment[];
    pageInfo: {
      hasPreviousPage: boolean;
      hasNextPage: boolean;
      startCursor: string;
      endCursor: string;
    };
    filters: FilterData[];
  };
}

export const meta: MetaFunction<typeof loader> = ({data}) => [
  {title: `${data?.collection?.title ?? 'Collection'} — LEGENDARY BRANDING`},
  {
    name: 'description',
    content:
      data?.collection?.description ??
      `Shop ${data?.collection?.title ?? 'this collection'}.`,
  },
];

/**
 * Parse URL search params into Storefront API product filter array.
 * Supports: price_min, price_max, available, product_type, etc.
 */
function buildFilters(searchParams: URLSearchParams): Array<Record<string, unknown>> {
  const filters: Array<Record<string, unknown>> = [];

  // Price range
  const priceMin = searchParams.get('price_min');
  const priceMax = searchParams.get('price_max');
  if (priceMin || priceMax) {
    const priceFilter: Record<string, number> = {};
    if (priceMin) priceFilter.min = parseFloat(priceMin);
    if (priceMax) priceFilter.max = parseFloat(priceMax);
    if (Object.keys(priceFilter).length > 0) {
      filters.push({price: priceFilter});
    }
  }

  // Availability
  if (searchParams.get('in_stock') === '1') {
    filters.push({available: true});
  }

  // Product type
  const productType = searchParams.get('type');
  if (productType) {
    filters.push({productType: productType});
  }

  // Product tag
  const tags = searchParams.getAll('tag');
  tags.forEach((tag) => {
    filters.push({tag});
  });

  // Vendor
  const vendor = searchParams.get('vendor');
  if (vendor) {
    filters.push({vendor});
  }

  return filters;
}

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Not Found', {status: 404});

  const url = new URL(request.url);
  const sort = url.searchParams.get('sort') ?? 'featured';
  const sortOption =
    SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];

  const paginationVariables = getPaginationVariables(request, {pageBy: 12});
  const filters = buildFilters(new URL(request.url).searchParams);

  const {collection} = await context.storefront.query(COLLECTION_QUERY, {
    variables: {
      handle,
      ...paginationVariables,
      sortKey: sortOption.sortKey as SortKey,
      reverse: sortOption.reverse,
      filters: filters.length > 0 ? filters : undefined,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
    cache: CacheShort(),
  });

  if (!collection) throw new Response('Collection not found', {status: 404});

  return {
    collection: collection as CollectionData,
    sort,
    activeFilters: filters.length > 0 ? filters : null,
  };
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M3 3h12l-4 6v5l-4 2V9L3 3z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="2" y="2" width="6" height="6" />
      <rect x="10" y="2" width="6" height="6" />
      <rect x="2" y="10" width="6" height="6" />
      <rect x="10" y="10" width="6" height="6" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <line x1="4" y1="4" x2="14" y2="4" />
      <line x1="4" y1="9" x2="14" y2="9" />
      <line x1="4" y1="14" x2="14" y2="14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <line x1="5" y1="5" x2="15" y2="15" />
      <line x1="15" y1="5" x2="5" y2="15" />
    </svg>
  );
}

export default function CollectionPage() {
  const {collection, sort} = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  function handleSort(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === 'featured') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    params.delete('cursor');
    navigate(`?${params.toString()}`, {replace: true});
  }

  function handleFilterChange(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams);
    if (value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete('cursor');
    setSearchParams(params, {replace: true});
  }

  function clearAllFilters() {
    const params = new URLSearchParams(searchParams);
    ['price_min', 'price_max', 'in_stock', 'type', 'tag', 'vendor'].forEach((key) =>
      params.delete(key),
    );
    params.delete('cursor');
    setSearchParams(params, {replace: true});
  }

  function toggleFilterTag(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    const existing = params.getAll(key);
    if (existing.includes(value)) {
      params.delete(key);
      existing
        .filter((v) => v !== value)
        .forEach((v) => params.append(key, v));
    } else {
      params.append(key, value);
    }
    params.delete('cursor');
    setSearchParams(params, {replace: true});
  }

  const hasActiveFilters = Array.from(searchParams.keys()).some((key) =>
    ['price_min', 'price_max', 'in_stock', 'type', 'tag', 'vendor'].includes(key),
  );

  const productCount = collection.products.nodes.length;
  const priceFilter = collection.products.filters.find((f) => f.type === 'PRICE_RANGE');
  const typeFilter = collection.products.filters.find(
    (f) => f.id === 'productType' || f.label.toLowerCase().includes('type'),
  );

  return (
    <div>
      {/* Collection hero */}
      <div className="relative h-[280px] md:h-[420px] bg-[#E8E6E1] overflow-hidden">
        {collection.image?.url ? (
          <Image
            data={collection.image}
            sizes="100vw"
            loading="eager"
            className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full">
            <HeroPlaceholder variant="dark" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/60 to-transparent" />
        <div className="absolute inset-0 max-w-[1280px] mx-auto px-[clamp(1.25rem,4vw,2.5rem)] flex items-end pb-12 md:pb-16">
          <div className="text-white max-w-2xl">
            <nav className="text-[11px] tracking-widest uppercase text-white/70 mb-4" aria-label="Breadcrumb">
              <a href="/collections" className="hover:text-white transition-colors">
                All
              </a>
              <span className="mx-2">/</span>
              <span>{collection.title}</span>
            </nav>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
              {collection.title}
            </h1>
            {collection.description && (
              <p className="mt-4 text-sm text-white/80 max-w-lg">{collection.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-[clamp(1.25rem,4vw,2.5rem)] py-16 md:py-20">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar filters — desktop */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-28">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-caps text-[#1A1A1A]">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] underline transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Price range filter */}
              {priceFilter && priceFilter.values.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-semibold tracking-wider uppercase mb-4">Price</h3>
                  <div className="space-y-2">
                    {priceFilter.values.map((v, i) => {
                      const isActive = false; // simplified for now
                      return (
                        <label key={v.id} className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-70 transition-opacity">
                          <input
                            type="radio"
                            name="price_range"
                            checked={isActive}
                            onChange={() => {
                              const [minStr, maxStr] = v.label.replace(/[^0-9.]/g, '').split('.').filter(Boolean);
                              if (i === 0 && v.label.toLowerCase().includes('under')) {
                                const max = parseFloat(v.label.replace(/[^0-9]/g, ''));
                                handleFilterChange('price_max', String(max));
                              } else if (i === priceFilter.values.length - 1 && v.label.toLowerCase().includes('over')) {
                                const min = parseFloat(v.label.replace(/[^0-9]/g, ''));
                                handleFilterChange('price_min', String(min));
                              }
                            }}
                            className="w-4 h-4 accent-black"
                          />
                          <span>{v.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Availability filter */}
              <div className="mb-8">
                <h3 className="text-xs font-semibold tracking-wider uppercase mb-4">Availability</h3>
                <label className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-70 transition-opacity">
                  <input
                    type="checkbox"
                    checked={searchParams.get('in_stock') === '1'}
                    onChange={(e) =>
                      handleFilterChange('in_stock', e.target.checked ? '1' : null)
                    }
                    className="w-4 h-4 accent-black"
                  />
                  <span>In stock only</span>
                </label>
              </div>

              {/* Product type filter */}
              {typeFilter && typeFilter.values.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-semibold tracking-wider uppercase mb-4">
                    {typeFilter.label}
                  </h3>
                  <div className="space-y-2">
                    {typeFilter.values.slice(0, 15).map((v) => {
                      const isActive = searchParams.get('type') === v.label;
                      return (
                        <label
                          key={v.id}
                          className="flex items-center justify-between text-sm cursor-pointer hover:opacity-70 transition-opacity"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => {
                                const params = new URLSearchParams(searchParams);
                                if (isActive) {
                                  params.delete('type');
                                } else {
                                  params.set('type', v.label);
                                }
                                params.delete('cursor');
                                setSearchParams(params, {replace: true});
                              }}
                              className="w-4 h-4 accent-black"
                            />
                            <span>{v.label}</span>
                          </div>
                          <span className="text-xs text-black/40">{v.count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-y border-black/10 py-4 mb-8">
              <div className="flex items-center gap-3">
                {/* Mobile filter button */}
                <button
                  onClick={() => setFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 text-xs tracking-wider uppercase"
                >
                  <FilterIcon />
                  <span>Filters</span>
                  {hasActiveFilters && <Badge variant="new">Filtered</Badge>}
                </button>

                <span className="text-xs text-black/60 tracking-wide">
                  {productCount} product{productCount !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* View toggle (desktop only) */}
                <div className="hidden md:flex items-center gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 transition-colors ${
                      viewMode === 'grid' ? 'text-black' : 'text-black/30 hover:text-black/60'
                    }`}
                    aria-label="Grid view"
                  >
                    <GridIcon />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 transition-colors ${
                      viewMode === 'list' ? 'text-black' : 'text-black/30 hover:text-black/60'
                    }`}
                    aria-label="List view"
                  >
                    <ListIcon />
                  </button>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] tracking-widest uppercase text-black/60 hidden sm:block">
                    Sort:
                  </span>
                  <select
                    value={sort}
                    onChange={(e) => handleSort(e.target.value)}
                    className="text-xs border border-black/10 py-1.5 px-3 bg-white focus:outline-none focus:border-black cursor-pointer"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {searchParams.get('in_stock') === '1' && (
                  <button
                    onClick={() => handleFilterChange('in_stock', null)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-black bg-black text-white"
                  >
                    In stock only <CloseIcon />
                  </button>
                )}
                {searchParams.get('type') && (
                  <button
                    onClick={() => handleFilterChange('type', null)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-black"
                  >
                    {searchParams.get('type')} <CloseIcon />
                  </button>
                )}
                {searchParams.get('price_min') && (
                  <button
                    onClick={() => handleFilterChange('price_min', null)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-black"
                  >
                    Min ${searchParams.get('price_min')} <CloseIcon />
                  </button>
                )}
                {searchParams.get('price_max') && (
                  <button
                    onClick={() => handleFilterChange('price_max', null)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-black"
                  >
                    Max ${searchParams.get('price_max')} <CloseIcon />
                  </button>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-black/50 hover:text-black underline"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Product grid with pagination */}
            <Pagination connection={collection.products}>
              {({nodes, PreviousLink, NextLink, isLoading}) => (
                <>
                  <div className="flex justify-center mb-8">
                    <PreviousLink>
                      <Button as="button" variant="outline" size="sm">
                        {isLoading ? 'Loading...' : 'Load Previous'}
                      </Button>
                    </PreviousLink>
                  </div>

                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                      {(nodes as ProductCardFragment[]).map((product, i) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          loading={i < 4 ? 'eager' : 'lazy'}
                          hoverFlip
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(nodes as ProductCardFragment[]).map((product, i) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          loading={i < 4 ? 'eager' : 'lazy'}
                          layout="list"
                        />
                      ))}
                    </div>
                  )}

                  {nodes.length === 0 && (
                    <div className="py-24 text-center border border-black/10">
                      <p className="lb-eyebrow mb-4 text-black/40">No products</p>
                      <p className="text-sm text-black/60 mb-6">
                        No products match your filters. Try adjusting your search.
                      </p>
                      <Button variant="outline" onClick={clearAllFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  )}

                  <div className="flex justify-center mt-12">
                    <NextLink>
                      <Button as="button" variant="outline">
                        {isLoading ? 'Loading...' : 'Load More'}
                      </Button>
                    </NextLink>
                  </div>
                </>
              )}
            </Pagination>
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setFilterOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-black/10">
              <h2 className="text-sm font-semibold tracking-widest uppercase">Filters</h2>
              <button onClick={() => setFilterOpen(false)} aria-label="Close filters">
                <CloseIcon />
              </button>
            </div>
            <div className="p-5 space-y-8">
              {/* In stock */}
              <div>
                <h3 className="text-xs font-semibold tracking-wider uppercase mb-4">Availability</h3>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={searchParams.get('in_stock') === '1'}
                    onChange={(e) => {
                      handleFilterChange('in_stock', e.target.checked ? '1' : null);
                    }}
                    className="w-4 h-4 accent-black"
                  />
                  <span>In stock only</span>
                </label>
              </div>

              {/* Product type */}
              {typeFilter && typeFilter.values.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold tracking-wider uppercase mb-4">
                    {typeFilter.label}
                  </h3>
                  <div className="space-y-2">
                    {typeFilter.values.slice(0, 20).map((v) => {
                      const isActive = searchParams.get('type') === v.label;
                      return (
                        <label
                          key={v.id}
                          className="flex items-center justify-between text-sm cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => {
                                const params = new URLSearchParams(searchParams);
                                if (isActive) {
                                  params.delete('type');
                                } else {
                                  params.set('type', v.label);
                                }
                                params.delete('cursor');
                                setSearchParams(params, {replace: true});
                              }}
                              className="w-4 h-4 accent-black"
                            />
                            <span>{v.label}</span>
                          </div>
                          <span className="text-xs text-black/40">{v.count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom actions */}
            <div className="sticky bottom-0 bg-white p-5 border-t border-black/10 flex gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 text-xs tracking-widest uppercase border border-black py-3 hover:bg-black hover:text-white transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-1 text-xs tracking-widest uppercase bg-black text-white py-3 hover:opacity-90 transition-opacity"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
