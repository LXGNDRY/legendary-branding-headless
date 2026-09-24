import {type LoaderFunctionArgs, type MetaFunction} from 'react-router';
import {Suspense} from 'react';
import {useLoaderData, Await} from 'react-router';
import ProductCard, {
  PRODUCT_CARD_FRAGMENT,
  type ProductCardFragment,
} from '~/components/ui/ProductCard';
import Button from '~/components/ui/Button';
import HeroSplit from '~/components/sections/HeroSplit';
import StatStrip from '~/components/sections/StatStrip';
import CategoryGrid from '~/components/sections/CategoryGrid';
import NewArrivalsGrid from '~/components/sections/NewArrivalsGrid';
import EditorialBand from '~/components/sections/EditorialBand';
import VerifiedReviews from '~/components/sections/VerifiedReviews';
import ReviewQuotes from '~/components/sections/ReviewQuotes';
import NewsletterBand from '~/components/sections/NewsletterBand';
import BrandMarquee from '~/components/sections/BrandMarquee';
import {CacheLong} from '~/lib/cache';
import {fetchJudgemeQuotes, parseJudgemeBadge} from '~/lib/judgeme';
import {
  MAIN_MENU_QUERY,
  NAV_COLLECTIONS_QUERY,
  resolveMenuCollections,
  type MenuItemNode,
} from '~/lib/nav';

const HOMEPAGE_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query Homepage($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
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
    marqueLegendaire: collection(handle: "marque-legendaire-luxury-streetwear") {
      title
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
    {title: 'LEGENDARY BRANDING | Premium Editorial Streetwear'},
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

export async function loader({context}: LoaderFunctionArgs) {
  const {storefront} = context;
  const variables = {
    country: storefront.i18n.country,
    language: storefront.i18n.language,
  };

  const [{newDrops, bestSellers, marqueLegendaire}, menuResult] = await Promise.all([
    storefront.query(HOMEPAGE_QUERY, {variables, cache: CacheLong()}),
    storefront.query(MAIN_MENU_QUERY, {variables, cache: CacheLong()}),
  ]);

  // "Shop by Category" tiles: sourced from Shopify's own main-menu collection
  // order (see ~/lib/nav) rather than an arbitrary sortKey, so this section
  // always matches the merchant's actual navigation -- New Drops and Marque
  // Légendaire already get their own dedicated homepage sections above/below,
  // so they're excluded here to avoid repeating the same collection twice.
  const menuItems = (menuResult.menu?.items ?? []) as MenuItemNode[];
  const collectionIds = menuItems
    .filter((item) => item.type === 'COLLECTION' && item.resourceId)
    .map((item) => item.resourceId!);

  const menuCollections = collectionIds.length
    ? resolveMenuCollections(
        menuItems,
        (
          await storefront.query(NAV_COLLECTIONS_QUERY, {
            variables: {ids: collectionIds, ...variables},
            cache: CacheLong(),
          })
        ).nodes,
      )
    : [];

  const categoryItems = menuCollections.filter(
    (c) => c.handle !== 'all-products' && c.handle !== 'marque-legendaire-luxury-streetwear',
  );

  const ratedProducts = ((bestSellers?.products?.nodes ?? []) as ProductCardFragment[])
    .map((product) => {
      const parsed = parseJudgemeBadge(product.reviewBadge?.value);
      return parsed
        ? {
            id: product.id,
            handle: product.handle,
            title: product.title,
            image: product.featuredImage,
            rating: parsed.rating,
            reviewCount: parsed.count,
          }
        : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const aggregateCount = ratedProducts.reduce((sum, p) => sum + p.reviewCount, 0);
  const aggregateRating =
    aggregateCount > 0
      ? ratedProducts.reduce((sum, p) => sum + p.rating * p.reviewCount, 0) / aggregateCount
      : 0;

  // Real review quote cards -- optional, server-only, and NOT awaited here:
  // this is a third-party fetch (up to a 5s timeout) for a non-critical
  // section, so it streams in after the initial response instead of
  // blocking the whole homepage on Judge.me's availability. Degrades to an
  // empty list (no section rendered) rather than failing the page when the
  // token is unset or the API call fails.
  const quotes = context.env.PRIVATE_JUDGEME_API_TOKEN
    ? fetchJudgemeQuotes({
        apiToken: context.env.PRIVATE_JUDGEME_API_TOKEN,
        shopDomain: context.env.PUBLIC_STORE_DOMAIN,
      })
    : Promise.resolve([]);

  return {
    categoryItems,
    newDrops,
    bestSellers,
    marqueLegendaire,
    ratedProducts,
    aggregateRating,
    aggregateCount,
    quotes,
  };
}

const MARQUEE_ITEMS = [
  '235GSM+ HEAVYWEIGHT TEES',
  'MADE TO ORDER',
  'FREE SHIPPING OVER $100',
  'WORLDWIDE SHIPPING',
  'AUTHENTICITY GUARANTEED',
  'NEW DROPS EVERY FRIDAY',
  'DTG PRINTS',
];

export default function Homepage() {
  const {
    categoryItems,
    newDrops,
    marqueLegendaire,
    ratedProducts,
    aggregateRating,
    aggregateCount,
    quotes,
  } = useLoaderData<typeof loader>();

  const newDropProducts = (newDrops?.products?.nodes ?? []) as ProductCardFragment[];
  const marqueLegendaireProducts = (marqueLegendaire?.products?.nodes ?? []) as ProductCardFragment[];

  return (
    <div>
      {/* 1 — Split hero */}
      <HeroSplit
        eyebrow="235GSM+ · Made To Order · DTG Prints"
        heading={`Legendary\nBranding.`}
        subtext="Premium Streetwear. Heavyweight essentials built to last."
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
        items={categoryItems}
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
        body="Every piece starts with fabric weight most brands won't touch: 235GSM+ cotton, structured for the streets. Made to order. No shortcuts, no restocks."
        primaryLabel="Shop the collection"
        primaryHref="/collections/all-products"
        secondaryLabel="Our story"
        secondaryHref="/policies/about"
      />

      {/* 7 — Marque Légendaire collection */}
      {marqueLegendaireProducts.length > 0 && (
        <section className="h-section bg-[var(--color-background)]">
          <div className="h-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="h-eyebrow mb-3">Luxury Streetwear</p>
                <h2 className="font-serif font-normal text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] text-[var(--color-foreground)]">
                  Marque Légendaire
                </h2>
              </div>
              <Button as="link" to="/collections/marque-legendaire-luxury-streetwear" variant="ghost">
                View All
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {marqueLegendaireProducts.slice(0, 4).map((product, i) => (
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

      {/* 8 — Verified reviews (real Judge.me aggregate, no invented quotes) */}
      <VerifiedReviews
        eyebrow="Customer Reviews"
        heading="Rated by the Culture"
        aggregateRating={aggregateRating}
        aggregateCount={aggregateCount}
        products={ratedProducts}
      />

      {/* 9 — Real review quote cards (Judge.me API, optional) */}
      <Suspense fallback={null}>
        <Await resolve={quotes}>
          {(resolvedQuotes) => (
            <ReviewQuotes eyebrow="In Their Words" heading="The Culture Speaks" quotes={resolvedQuotes} />
          )}
        </Await>
      </Suspense>

      {/* 10 — Newsletter */}
      <NewsletterBand
        eyebrow="Stay in the loop"
        heading="Get early access to drops."
        subtext="New arrivals, restocks, and editorial content, straight to your inbox."
      />
    </div>
  );
}
