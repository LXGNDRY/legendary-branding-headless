import {
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from 'react-router';
import {useState} from 'react';
import {getPaginationVariables, Pagination, Image} from '@shopify/hydrogen';
import ProductCard, {
  PRODUCT_CARD_FRAGMENT,
  type ProductCardFragment,
} from '~/components/ui/ProductCard';
import {CacheShort} from '~/lib/cache';
import JsonLd from '~/components/ui/JsonLd';
import {collectionPageSchema, breadcrumbSchema} from '~/components/seo/SeoSchema';

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
  image?: {url: string; altText?: string | null; width?: number | null; height?: number | null} | null;
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

export const meta: MetaFunction<typeof loader> = ({data}) => {
  const collection = data?.collection;
  const title = `${collection?.title ?? 'Collection'} — LEGENDARY BRANDING`;
  const description = collection?.description ?? `Shop ${collection?.title ?? 'this collection'}.`;
  const canonical = `https://legendary-branding.com/collections/${collection?.handle ?? 'all'}`;
  const ogImage = collection?.image?.url
    ? `${collection.image.url}&width=1200&height=630`
    : undefined;

  return [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:type', content: 'product.group'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:url', content: canonical},
    ...(ogImage ? [{property: 'og:image', content: ogImage}] : []),
  ];
};

function buildFilters(searchParams: URLSearchParams): Array<Record<string, unknown>> {
  const filters: Array<Record<string, unknown>> = [];
  const priceMin = searchParams.get('price_min');
  const priceMax = searchParams.get('price_max');
  if (priceMin || priceMax) {
    const priceFilter: Record<string, number> = {};
    if (priceMin) priceFilter.min = parseFloat(priceMin);
    if (priceMax) priceFilter.max = parseFloat(priceMax);
    if (Object.keys(priceFilter).length > 0) filters.push({price: priceFilter});
  }
  if (searchParams.get('in_stock') === '1') filters.push({available: true});
  const productType = searchParams.get('type');
  if (productType) filters.push({productType});
  searchParams.getAll('tag').forEach((tag) => filters.push({tag}));
  const vendor = searchParams.get('vendor');
  if (vendor) filters.push({vendor});
  return filters;
}

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Not Found', {status: 404});

  const url = new URL(request.url);
  const sort = url.searchParams.get('sort') ?? 'featured';
  const sortOption = SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];
  const paginationVariables = getPaginationVariables(request, {pageBy: 12});
  const filters = buildFilters(url.searchParams);

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

  return {collection: collection as CollectionData, sort, activeFilters: filters.length > 0 ? filters : null};
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

export default function CollectionPage() {
  const {collection, sort} = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);

  function handleSort(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === 'featured') params.delete('sort');
    else params.set('sort', value);
    params.delete('cursor');
    navigate(`?${params.toString()}`, {replace: true});
  }

  function handleFilterChange(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams);
    if (value === null || value === '') params.delete(key);
    else params.set(key, value);
    params.delete('cursor');
    setSearchParams(params, {replace: true});
  }

  function clearAllFilters() {
    const params = new URLSearchParams(searchParams);
    ['price_min', 'price_max', 'in_stock', 'type', 'tag', 'vendor'].forEach((k) => params.delete(k));
    params.delete('cursor');
    setSearchParams(params, {replace: true});
  }

  const hasActiveFilters = Array.from(searchParams.keys()).some((k) =>
    ['price_min', 'price_max', 'in_stock', 'type', 'tag', 'vendor'].includes(k),
  );

  const productCount = collection.products.nodes.length;
  const priceFilter = collection.products.filters.find((f) => f.type === 'PRICE_RANGE');
  const typeFilter = collection.products.filters.find(
    (f) => f.id === 'productType' || f.label.toLowerCase().includes('type'),
  );

  const collectionJsonLd = collectionPageSchema({
    title: collection.title,
    handle: collection.handle,
    description: collection.description,
    products: collection.products.nodes.map((p) => ({
      name: p.title,
      url: `/products/${p.handle}`,
      image: p.featuredImage?.url ?? '',
    })),
  });

  const breadcrumbJsonLd = breadcrumbSchema([
    {name: 'Collections', url: '/collections'},
    {name: collection.title},
  ]);

  return (
    <div className="bg-[#FAF9F6]">
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {/* Collection hero */}
      <div className="relative h-[280px] md:h-[420px] bg-[#1A1A1A] overflow-hidden">
        {collection.image?.url ? (
          <Image
            data={collection.image}
            sizes="100vw"
            width={1600}
            height={800}
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/70 via-[#1A1A1A]/20 to-transparent" />
        <div className="h-container absolute inset-0 flex flex-col justify-end pb-10">
          <nav className="h-eyebrow text-[#FAF9F6]/50 mb-4" aria-label="Breadcrumb">
            <a href="/collections" className="hover:text-[#FAF9F6]/80 transition-colors">
              Collections
            </a>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-[#FAF9F6]/70">{collection.title}</span>
          </nav>
          <h1 className="font-serif font-normal text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] tracking-[-0.01em] text-[#FAF9F6]">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="mt-3 text-[0.9rem] text-[#FAF9F6]/60 max-w-lg leading-relaxed">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="h-container py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar — desktop */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-7">
                <p className="h-eyebrow">Filters</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-[0.7rem] text-[#6B6B6B] hover:text-[#1A1A1A] underline underline-offset-2 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Availability */}
              <div className="mb-7 border-b border-[#E8E6E1] pb-7">
                <p className="h-eyebrow mb-4 text-[#1A1A1A]">Availability</p>
                <label className="flex items-center gap-2.5 text-[0.85rem] cursor-pointer hover:text-[#6B6B6B] transition-colors">
                  <input
                    type="checkbox"
                    checked={searchParams.get('in_stock') === '1'}
                    onChange={(e) => handleFilterChange('in_stock', e.target.checked ? '1' : null)}
                    className="w-4 h-4 accent-[#1A1A1A] rounded-sm"
                  />
                  In stock only
                </label>
              </div>

              {/* Product type */}
              {typeFilter && typeFilter.values.length > 0 && (
                <div className="mb-7">
                  <p className="h-eyebrow mb-4 text-[#1A1A1A]">{typeFilter.label}</p>
                  <div className="space-y-2.5">
                    {typeFilter.values.slice(0, 15).map((v) => {
                      const isActive = searchParams.get('type') === v.label;
                      return (
                        <label key={v.id} className="flex items-center justify-between text-[0.85rem] cursor-pointer hover:text-[#6B6B6B] transition-colors">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => {
                                const p = new URLSearchParams(searchParams);
                                if (isActive) p.delete('type');
                                else p.set('type', v.label);
                                p.delete('cursor');
                                setSearchParams(p, {replace: true});
                              }}
                              className="w-4 h-4 accent-[#1A1A1A]"
                            />
                            {v.label}
                          </div>
                          <span className="text-[0.7rem] text-[#9E9C97]">{v.count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-[#E8E6E1] pb-4 mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 h-eyebrow text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors"
                >
                  <FilterIcon />
                  Filters
                  {hasActiveFilters && (
                    <span className="bg-[#1A1A1A] text-[#FAF9F6] text-[9px] font-bold rounded-full px-1.5 py-0.5">
                      ON
                    </span>
                  )}
                </button>
                <span className="h-eyebrow text-[#9E9C97]">
                  {productCount} {productCount === 1 ? 'product' : 'products'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-eyebrow text-[#9E9C97] hidden sm:block">Sort</span>
                <select
                  value={sort}
                  onChange={(e) => handleSort(e.target.value)}
                  className="h-eyebrow text-[#1A1A1A] bg-transparent border-b border-[#E8E6E1] focus:border-[#1A1A1A] focus:outline-none cursor-pointer pb-0.5 transition-colors"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
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
                    className="flex items-center gap-1.5 h-eyebrow px-3 py-1.5 border border-[#1A1A1A] rounded-full text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FAF9F6] transition-all"
                  >
                    In stock <CloseIcon />
                  </button>
                )}
                {searchParams.get('type') && (
                  <button
                    onClick={() => handleFilterChange('type', null)}
                    className="flex items-center gap-1.5 h-eyebrow px-3 py-1.5 border border-[#1A1A1A] rounded-full text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FAF9F6] transition-all"
                  >
                    {searchParams.get('type')} <CloseIcon />
                  </button>
                )}
              </div>
            )}

            <Pagination connection={collection.products}>
              {({nodes, PreviousLink, NextLink, isLoading}) => (
                <>
                  <div className="flex justify-center mb-8">
                    <PreviousLink>
                      <button className="h-btn-outline text-[0.7rem] px-5 py-2.5">
                        {isLoading ? 'Loading…' : 'Load previous'}
                      </button>
                    </PreviousLink>
                  </div>

                  {nodes.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
                      {(nodes as ProductCardFragment[]).map((product, i) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          loading={i < 4 ? 'eager' : 'lazy'}
                          hoverFlip
                          showQuickAdd
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-28 text-center">
                      <p className="h-eyebrow mb-4">No products</p>
                      <p className="text-[#6B6B6B] text-sm mb-7">No products match your current filters.</p>
                      <button onClick={clearAllFilters} className="h-btn-outline">
                        Clear filters
                      </button>
                    </div>
                  )}

                  <div className="flex justify-center mt-12">
                    <NextLink>
                      <button className="h-btn-outline">
                        {isLoading ? 'Loading…' : 'Load more'}
                      </button>
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
        <div className="fixed inset-0 z-[500] lg:hidden">
          <div className="absolute inset-0 bg-[#1A1A1A]/40" onClick={() => setFilterOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-[#FAF9F6] rounded-t-2xl overflow-hidden max-h-[80dvh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8E6E1]">
              <p className="h-eyebrow text-[#1A1A1A]">Filters</p>
              <button onClick={() => setFilterOpen(false)} aria-label="Close filters" className="p-1 text-[#1A1A1A]">
                <CloseIcon />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-6 space-y-7">
              <div>
                <p className="h-eyebrow mb-4 text-[#1A1A1A]">Availability</p>
                <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={searchParams.get('in_stock') === '1'}
                    onChange={(e) => handleFilterChange('in_stock', e.target.checked ? '1' : null)}
                    className="w-4 h-4 accent-[#1A1A1A]"
                  />
                  In stock only
                </label>
              </div>
              {typeFilter && typeFilter.values.length > 0 && (
                <div>
                  <p className="h-eyebrow mb-4 text-[#1A1A1A]">{typeFilter.label}</p>
                  <div className="space-y-3">
                    {typeFilter.values.slice(0, 20).map((v) => {
                      const isActive = searchParams.get('type') === v.label;
                      return (
                        <label key={v.id} className="flex items-center justify-between text-sm cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => {
                                const p = new URLSearchParams(searchParams);
                                if (isActive) p.delete('type');
                                else p.set('type', v.label);
                                p.delete('cursor');
                                setSearchParams(p, {replace: true});
                              }}
                              className="w-4 h-4 accent-[#1A1A1A]"
                            />
                            {v.label}
                          </div>
                          <span className="text-[0.7rem] text-[#9E9C97]">{v.count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-5 border-t border-[#E8E6E1] flex gap-3">
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
    </div>
  );
}
