import {type LoaderFunctionArgs, type MetaFunction} from 'react-router';
import {useLoaderData, Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import Container from '~/components/ui/Container';
import Placeholder from '~/components/ui/Placeholder';
import {CacheLong} from '~/lib/cache';

type CollectionNode = {
  id: string;
  title: string;
  handle: string;
  description: string;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  products: {nodes: {id: string}[]};
};

const COLLECTIONS_QUERY = `#graphql
  query Collections($country: CountryCode, $language: LanguageCode, $first: Int!)
    @inContext(country: $country, language: $language) {
    collections(first: $first, sortKey: UPDATED_AT) {
      nodes {
        id
        title
        handle
        description
        image {
          url
          altText
          width
          height
        }
        products(first: 1) {
          nodes {
            id
          }
        }
      }
    }
  }
` as const;

export const meta: MetaFunction = () => [
  {title: 'Collections — LEGENDARY BRANDING'},
  {name: 'description', content: 'Shop all Legendary Branding collections.'},
];

export async function loader({context}: LoaderFunctionArgs) {
  const {storefront} = context;
  const {collections} = await storefront.query(COLLECTIONS_QUERY, {
    variables: {
      first: 20,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
    cache: CacheLong(),
  });
  return {collections};
}

export default function CollectionsIndex() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <Container className="py-16">
      <div className="mb-12">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#6b6b6b] mb-2">
          Shop
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          All Collections
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(collections.nodes as CollectionNode[]).map((collection) => (
          <Link
            key={collection.id}
            to={`/collections/${collection.handle}`}
            prefetch="intent"
            className="group block"
          >
            <div className="relative overflow-hidden mb-4">
              {collection.image ? (
                <Image
                  data={collection.image}
                  aspectRatio="4/3"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <Placeholder aspect="aspect-[4/3]" label={collection.title} />
              )}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium tracking-[0.12em] uppercase group-hover:text-[#6b6b6b] transition-colors">
                {collection.title}
              </span>
              <span className="text-xs text-[#6b6b6b]">
                {collection.products.nodes.length > 0 ? 'Shop Now' : 'Coming Soon'}
              </span>
            </div>
            {collection.description && (
              <p className="mt-1 text-xs text-[#6b6b6b] line-clamp-1">
                {collection.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </Container>
  );
}
