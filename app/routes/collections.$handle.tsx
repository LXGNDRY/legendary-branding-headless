import {
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from 'react-router';
import {getPaginationVariables, Pagination} from '@shopify/hydrogen';
import Container from '~/components/ui/Container';
import ProductCard, {
  PRODUCT_CARD_FRAGMENT,
  type ProductCardFragment,
} from '~/components/ui/ProductCard';
import Button from '~/components/ui/Button';
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

export const meta: MetaFunction<typeof loader> = ({data}) => [
  {title: `${data?.collection?.title ?? 'Collection'} — LEGENDARY BRANDING`},
  {
    name: 'description',
    content:
      data?.collection?.description ??
      `Shop ${data?.collection?.title ?? 'this collection'}.`,
  },
];

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Not Found', {status: 404});

  const url = new URL(request.url);
  const sort = url.searchParams.get('sort') ?? 'featured';
  const sortOption =
    SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];

  const paginationVariables = getPaginationVariables(request, {pageBy: 12});

  const {collection} = await context.storefront.query(COLLECTION_QUERY, {
    variables: {
      handle,
      ...paginationVariables,
      sortKey: sortOption.sortKey as SortKey,
      reverse: sortOption.reverse,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
    cache: CacheShort(),
  });

  if (!collection) throw new Response('Collection not found', {status: 404});

  return {collection, sort};
}

export default function CollectionPage() {
  const {collection, sort} = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  function handleSort(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === 'featured') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    // Reset pagination when sort changes
    params.delete('cursor');
    navigate(`?${params.toString()}`, {replace: true});
  }

  return (
    <Container className="py-16">
      {/* Breadcrumb */}
      <nav
        className="mb-8 text-[11px] tracking-widest uppercase text-[#6b6b6b]"
        aria-label="Breadcrumb"
      >
        <a href="/collections" className="hover:text-[#0a0a0a] transition-colors">
          Collections
        </a>
        <span className="mx-2">/</span>
        <span className="text-[#0a0a0a]">{collection.title}</span>
      </nav>

      {/* Collection header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          {collection.title}
        </h1>
        {collection.description && (
          <p className="text-sm text-[#6b6b6b] max-w-xl">{collection.description}</p>
        )}
      </div>

      {/* Sort bar */}
      <div className="flex items-center justify-between border-y border-[#e5e5e5] py-3 mb-8">
        <span className="text-xs text-[#6b6b6b] tracking-wide">
          {collection.products.nodes.length > 0
            ? `${collection.products.nodes.length} products`
            : 'No products'}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] tracking-widest uppercase text-[#6b6b6b] hidden sm:block">
            Sort:
          </span>
          <select
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            className="text-xs border border-[#e5e5e5] py-1.5 px-3 bg-white focus:outline-none focus:border-[#0a0a0a] cursor-pointer"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product grid with pagination */}
      <Pagination connection={collection.products}>
        {({nodes, PreviousLink, NextLink, isLoading}) => (
          <>
            <div className="flex justify-center mb-8">
              <PreviousLink>
                <Button as="button" variant="outline">
                  {isLoading ? 'Loading...' : 'Load Previous'}
                </Button>
              </PreviousLink>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(nodes as ProductCardFragment[]).map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  loading={i < 4 ? 'eager' : 'lazy'}
                />
              ))}
            </div>

            {nodes.length === 0 && (
              <div className="py-24 text-center">
                <p className="text-sm text-[#6b6b6b]">No products found.</p>
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
    </Container>
  );
}
