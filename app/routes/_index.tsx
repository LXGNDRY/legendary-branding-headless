import {type LoaderFunctionArgs, type MetaFunction} from 'react-router';
import {useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import ProductCard, {
  PRODUCT_CARD_FRAGMENT,
  type ProductCardFragment,
} from '~/components/ui/ProductCard';
import HeroSplit from '~/components/sections/HeroSplit';
import StatStrip from '~/components/sections/StatStrip';
import CategoryGrid from '~/components/sections/CategoryGrid';
import NewArrivalsGrid from '~/components/sections/NewArrivalsGrid';
import EditorialBand from '~/components/sections/EditorialBand';
import Testimonials from '~/components/sections/Testimonials';
import NewsletterBand from '~/components/sections/NewsletterBand';
import BrandMarquee from '~/components/sections/BrandMarquee';
import {CacheLong} from '~/lib/cache';

type CollectionNode = {
  id: string;
  title: string;
  handle: string;
  description?: string | null;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
};

const HOMEPAGE_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query Homepage($country: CountryCode, $language: LanguageCode, $first: Int!)
    @inContext(country: $country, language: $language) {
    featuredCollections: collections(first: 6, sortKey: UPDATED_AT) {
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
      }
    }
    newDrops: collection(handle: "all-products") {
      products(first: 8, sortKey: CREATED) {
        nodes {
          ...ProductCard
        }
      }
    }
    bestSellers: collection(handle: "all-products") {
      products(first: 4, sortKey: BEST_SELLING) {
        nodes {
          ...ProductCard
        }
      }
    }
  }
` as const;

export const meta: MetaFunction = () => {
  const description = 'Premium editorial streetwear. Bold, minimal, fast.';
  return [
    {title: 'LEGENDARY BRANDING — Premium Editorial Streetwear'},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: 'https://legendary-branding.com/'},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'LEGENDARY BRANDING'},
    {property: 'og:description', content: description},
    {property: 'og:url', content: 'https://legendary-branding.com/'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: 'LEGENDARY BRANDING'},
    {name: 'twitter:description', content: description},
  ];
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {pageBy: 8});

  const {featuredCollections, newDrops, bestSellers} = await storefront.query(
    HOMEPAGE_QUERY,
    {
      variables: {
        ...paginationVariables,
        first: 8,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
      cache: CacheLong(),
    },
  );

  return {featuredCollections, newDrops, bestSellers};
}

const MARQUEE_ITEMS = [
  '235GSM+ HEAVYWEIGHT TEES',
  'MADE TO ORDER',
  'FREE SHIPPING OVER $150',
  'WORLDWIDE SHIPPING',
  'AUTHENTICITY GUARANTEED',
  'NEW DROPS EVERY FRIDAY',
  'DTG PRINTS',
];

const TESTIMONIALS = [
  {
    quote:
      "This is the heaviest tee I've ever owned. The quality is unreal — you can feel the difference the second you put it on.",
    name: 'Marcus T.',
    location: 'Atlanta, GA',
    stars: 5,
  },
  {
    quote:
      'Made to order means I actually had to wait — but it was worth every day. Fits perfectly, no shrinkage after washing.',
    name: 'Jordan L.',
    location: 'London, UK',
    stars: 5,
  },
  {
    quote:
      "The DTG print quality blew me away. Sharp edges, no cracking. Other brands can't touch this.",
    name: 'Aaliyah M.',
    location: 'Toronto, CA',
    stars: 5,
  },
];

export default function Homepage() {
  const {featuredCollections, newDrops, bestSellers} =
    useLoaderData<typeof loader>();

  const newDropProducts = (newDrops?.products?.nodes ?? []) as ProductCardFragment[];
  const bestSellerProducts = (bestSellers?.products?.nodes ?? []) as ProductCardFragment[];

  return (
    <div>
      {/* 1 — Split hero */}
      <HeroSplit
        eyebrow="235GSM+ · Made To Order · DTG Prints"
        heading={`Premium\nStreet\nwear.`}
        subtext="Heavyweight essentials built to last. No restocks. No shortcuts."
        primaryLabel="Shop Now"
        primaryHref="/collections/all-products"
        secondaryLabel="Lookbook"
        secondaryHref="/journal"
        leftProduct={newDropProducts[0] ?? null}
        rightProduct={newDropProducts[1] ?? null}
      />

      {/* 2 — Marquee */}
      <BrandMarquee items={MARQUEE_ITEMS} style="bold" speed={30} />

      {/* 3 — Stats */}
      <StatStrip />

      {/* 4 — Featured categories */}
      <CategoryGrid
        eyebrow="Explore"
        heading="Shop by Category"
        items={(featuredCollections?.nodes as CollectionNode[]).slice(0, 3)}
      />

      {/* 5 — New arrivals asymmetric grid */}
      <NewArrivalsGrid
        eyebrow="Just Dropped"
        heading="New Arrivals"
        products={newDropProducts}
        viewAllHref="/collections/all-products"
      />

      {/* 6 — Editorial dark band */}
      <EditorialBand
        theme="dark"
        eyebrow="Our Craft"
        heading="Built different. Made to last."
        body="Every piece starts with fabric weight most brands won't touch — 235GSM+ cotton, structured for the streets. Made to order. No shortcuts, no restocks."
        primaryLabel="Shop the collection"
        primaryHref="/collections/all-products"
        secondaryLabel="Our story"
        secondaryHref="/policies/about"
      />

      {/* 7 — Best sellers */}
      {bestSellerProducts.length > 0 && (
        <section className="h-section bg-[#FAF9F6]">
          <div className="h-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="h-eyebrow mb-3">Most Wanted</p>
                <h2 className="font-serif font-normal text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] text-[#1A1A1A]">
                  Best Sellers
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {bestSellerProducts.slice(0, 4).map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  loading={i < 2 ? 'eager' : 'lazy'}
                  hoverFlip
                  showQuickAdd
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8 — Testimonials */}
      <Testimonials
        eyebrow="Customer Reviews"
        heading="The Culture Speaks"
        items={TESTIMONIALS}
      />

      {/* 9 — Newsletter */}
      <NewsletterBand
        eyebrow="Stay in the loop"
        heading="Get early access to drops."
        subtext="New arrivals, restocks, and editorial content — straight to your inbox."
      />
    </div>
  );
}
