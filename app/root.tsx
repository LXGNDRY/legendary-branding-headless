import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
  useFetchers,
  useLocation,
  isRouteErrorResponse,
  Await,
} from 'react-router';
import {useState, useEffect, Suspense} from 'react';
import {type LinksFunction, type MetaFunction, type LoaderFunctionArgs} from 'react-router';
import styles from '~/styles/app.css?url';
import {CacheShort} from '~/lib/cache';
import {fetchActiveDiscounts, type ActiveDiscount} from '~/lib/discounts';
import {initSentry, useWebVitals, captureError} from '~/lib/monitoring';
import {WishlistProvider} from '~/components/ui/Wishlist';
import {LocaleProvider} from '~/lib/i18n';
import Header from '~/components/layout/Header';
import Footer from '~/components/layout/Footer';
import CartDrawer from '~/components/layout/CartDrawer';
import AnnouncementBar from '~/components/layout/AnnouncementBar';
import DiscountsPopup from '~/components/ui/DiscountsPopup';
import ChatWidget from '~/components/chat/ChatWidget';
import {DefaultSeoSchema} from '~/components/seo/SeoSchema';
import {STORE_TRUST_QUERY, toStoreTrust, withBudget} from '~/lib/trust';
import Analytics from '~/components/seo/Analytics';
import type {CartData} from '~/lib/cart';
import {CacheLong} from '~/lib/cache';
import {LOCALIZATION_QUERY, type LocalizationData} from '~/lib/market';
import {fetchAllPages} from '~/lib/pagination';
import {
  MAIN_MENU_QUERY,
  NAV_ALL_COLLECTIONS_QUERY,
  NAV_COLLECTIONS_QUERY,
  mergeNavCollections,
  resolveMenuCollections,
  type PublishedCollectionNode,
  type MenuItemNode,
  type NavCollectionItem,
} from '~/lib/nav';
import {Analytics as HydrogenAnalytics, getShopAnalytics, CartForm, createWithCache} from '@shopify/hydrogen';

export const links: LinksFunction = () => [
  // The raw Shopify Files upload (Timeless_Style_-_Artboard_22_4.png) is a
  // 1467x768 canvas where the actual goat mark occupies a small, off-center
  // region -- referencing it directly at favicon scale (16-32px) rendered
  // as an unrecognizable, near-invisible speck, the same problem the
  // on-site logo had. favicon.svg/{16,32,180,192,512} are built from the
  // owner's exact vector paths for this mark (same geometry, just rendered
  // tight to its real bounding box, with an off-white background plate so
  // the black mark stays visible against both light and dark browser tab
  // chrome) rather than a copy or edit of that PNG file itself.
  {rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml'},
  {rel: 'icon', href: '/favicon-32.png', sizes: '32x32', type: 'image/png'},
  {rel: 'icon', href: '/favicon-16.png', sizes: '16x16', type: 'image/png'},
  {rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180'},
  {rel: 'manifest', href: '/site.webmanifest'},
  {
    rel: 'preconnect',
    href: 'https://cdn.shopify.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'dns-prefetch',
    href: 'https://shop.app',
  },
  // Self-hosted fonts (see app.css's @font-face rules) -- preload the two
  // most likely to be needed for first paint (Inter body text, Instrument
  // Serif headings), both immediately above the fold on every page.
  {
    rel: 'preload',
    href: '/fonts/inter-latin.woff2',
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preload',
    href: '/fonts/instrument-serif-normal-latin.woff2',
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  },
  {rel: 'stylesheet', href: styles},
];

export const meta: MetaFunction = () => [
  // charSet, viewport, color-scheme, and theme-color are hardcoded directly
  // in the Layout component's <head> below instead of here -- React Router
  // v7 doesn't merge a leaf route's `meta` array with its parents', so any
  // route with its own `meta` export (most of them) would otherwise drop
  // these silently.
  {title: 'Legendary Branding | Premium Streetwear'},
  {
    name: 'description',
    content: 'Legendary Branding — premium streetwear built to last. 220GSM+ premium-weight tees, made to order. Shop the collection.',
  },
  {property: 'og:type', content: 'website'},
  {property: 'og:site_name', content: 'Legendary Branding'},
  {property: 'og:url', content: 'https://www.legendary-branding.com'},
  {property: 'og:title', content: 'Legendary Branding | Premium Streetwear'},
  {property: 'og:description', content: 'Premium streetwear built to last. 220GSM+ premium-weight tees, made to order. Shop the collection.'},
  {name: 'twitter:card', content: 'summary_large_image'},
  {name: 'twitter:title', content: 'Legendary Branding | Premium Streetwear'},
  {name: 'twitter:description', content: 'Premium streetwear built to last.'},
];

/** How long a page waits for the optional store trust lookup before rendering without it. */
const STORE_TRUST_BUDGET_MS = 700;

export async function loader({context, request}: LoaderFunctionArgs) {
  const {cart, customerAccount} = context;

  // Check if customer is logged in and associate cart with buyer identity
  let isLoggedIn = false;

  if (customerAccount) {
    isLoggedIn = await customerAccount.isLoggedIn();

    if (isLoggedIn) {
      // Associate the cart with the logged-in customer's buyer identity
      const accessToken = await customerAccount.getAccessToken();
      if (accessToken) {
        // Update cart buyer identity for logged-in customers
        try {
          const cartId = await cart.getCartId();
          if (cartId) {
            // Cart will be associated via the Storefront API buyer identity
            // on subsequent queries — Hydrogen's cart helper handles this
            // when customerAccount is configured
          }
        } catch {
          // Cart association failure is non-critical — cart still works
          // as guest until explicitly merged
        }
      }
    }
  }

  // Opening a named Cache API instance is required to cache the Admin API
  // discount fetch (a POST request -- Cloudflare's Cache API only caches
  // GET by default, so this goes through Hydrogen's createWithCache
  // wrapper instead, same mechanism context.ts uses for the storefront
  // client's own cache). Hoisted above Promise.all so this doesn't delay
  // kicking off the requests that don't need it.
  const discountsWithCache = context.env.PRIVATE_SHOPIFY_ADMIN_API_TOKEN
    ? createWithCache({
        cache: await caches.open('hydrogen'),
        waitUntil: context.waitUntil ?? (() => {}),
        request,
      })
    : null;

  // Deliberately NOT awaited/included in the Promise.all below: an Admin
  // API outage or slow edge would otherwise block every single storefront
  // page's initial response on this one optional, non-critical fetch
  // (Codex-caught). Streamed in after the initial response via
  // Suspense/Await below, same pattern as the homepage's Judge.me quotes --
  // AnnouncementBar/the PDP callout fall back to their non-discount default
  // state until this resolves.
  const activeDiscounts: Promise<ActiveDiscount[]> = discountsWithCache
    ? fetchActiveDiscounts({
        accessToken: context.env.PRIVATE_SHOPIFY_ADMIN_API_TOKEN,
        shopDomain: context.env.PUBLIC_STORE_DOMAIN,
        withCache: discountsWithCache,
      })
    : Promise.resolve([]);

  // Optional trust facts: started now but only waited on for a short budget,
  // so a slow lookup on a cold cache can't delay every route's response.
  // waitUntil lets it finish and fill the cache for the next request.
  const storeTrustLookup = context.storefront.query(STORE_TRUST_QUERY, {
    // NOTE: always the English source policy -- the return-window parser
    // reads English text, and a translation must not hide it.
    variables: {country: context.storefront.i18n.country, language: 'EN'},
    cache: CacheLong(),
  });
  (context.waitUntil ?? (() => {}))(storeTrustLookup.then(() => undefined, () => undefined));

  const [cartData, localizationResult, shop, menuResult, storeTrustResult] = await Promise.all([
    cart.get(),
    context.storefront.query(LOCALIZATION_QUERY, {
      variables: {
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
      cache: CacheLong(),
    }),
    getShopAnalytics({
      storefront: context.storefront,
      publicStorefrontId: context.env.PUBLIC_STOREFRONT_ID,
    }),
    // NOTE: CacheShort, not CacheLong -- a collection the merchant adds or publishes should reach the header within minutes, not up to a day.
    context.storefront.query(MAIN_MENU_QUERY, {
      variables: {
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
      cache: CacheShort(),
    }),
    withBudget(storeTrustLookup, STORE_TRUST_BUDGET_MS),
  ]);

  const menuItems = (menuResult.menu?.items ?? []) as MenuItemNode[];
  const collectionIds = menuItems
    .filter((item) => item.type === 'COLLECTION' && item.resourceId)
    .map((item) => item.resourceId!);

  // Optional: if this lookup fails the header falls back to the Main Menu alone.
  const publishedCollectionsLookup = fetchAllPages<NonNullable<PublishedCollectionNode>>(async (after) => {
    const result = await context.storefront.query(NAV_ALL_COLLECTIONS_QUERY, {
      variables: {
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
        first: 50,
        after,
      },
      cache: CacheShort(),
    });
    return result.collections as {nodes: NonNullable<PublishedCollectionNode>[]; pageInfo: {hasNextPage: boolean; endCursor?: string | null}};
  }).catch(() => [] as PublishedCollectionNode[]);

  const menuCollections: NavCollectionItem[] = collectionIds.length
    ? resolveMenuCollections(
        menuItems,
        (
          await context.storefront.query(NAV_COLLECTIONS_QUERY, {
            variables: {
              ids: collectionIds,
              country: context.storefront.i18n.country,
              language: context.storefront.i18n.language,
            },
            cache: CacheShort(),
          })
        ).nodes,
      )
    : [];
  const navCollections = mergeNavCollections(menuCollections, await publishedCollectionsLookup);

  return {
    cart: cartData as CartData,
    analyticsCart: cartData,
    isLoggedIn,
    accountsEnabled: Boolean(
      context.env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID &&
      context.env.PUBLIC_CUSTOMER_ACCOUNT_API_URL,
    ),
    localization: localizationResult.localization as LocalizationData,
    navCollections,
    shop,
    storeTrust: toStoreTrust(
      storeTrustResult,
      (localizationResult.localization as LocalizationData).availableCountries.map((c) => c.isoCode),
    ),
    activeDiscounts,
    // Read from context.env (the Oxygen worker's runtime environment),
    // not import.meta.env -- these are runtime-configured secrets/IDs on
    // Oxygen, not values baked in at Vite build time, so import.meta.env
    // reads of PUBLIC_* client analytics vars are always undefined in the
    // deployed build regardless of Vite's envPrefix config.
    analyticsConfig: {
      ga4Id: context.env.PUBLIC_GA4_MEASUREMENT_ID || undefined,
      metaPixelId: context.env.PUBLIC_META_PIXEL_ID || undefined,
      tiktokPixelId: context.env.PUBLIC_TIKTOK_PIXEL_ID || undefined,
      klaviyoCompanyId: context.env.PUBLIC_KLAVIYO_COMPANY_ID || undefined,
      sentryDsn: context.env.PUBLIC_SENTRY_DSN || undefined,
    },
    consent: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: context.env.PUBLIC_STOREFRONT_API_TOKEN,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
      withPrivacyBanner: false,
    },
  };
}

export function Layout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        {/* Hardcoded here rather than in the `meta` export below: React
            Router v7 does not merge a leaf route's `meta` array with its
            parents' by default -- any route defining its own `meta` export
            (most of them do, for page titles/descriptions) silently drops
            root's viewport tag, leaving mobile browsers to fall back to a
            ~980px desktop-width layout viewport. Same reasoning as the
            hardcoded charSet above it. */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#0A0A0A" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const {cart, analyticsCart, isLoggedIn, accountsEnabled, localization, navCollections, shop, analyticsConfig, consent, activeDiscounts} = useLoaderData<typeof loader>();
  const [cartOpen, setCartOpen] = useState(false);
  const navigation = useNavigation();
  const location = useLocation();
  const fetchers = useFetchers();

  // Close cart drawer on route change (e.g. clicking a product or "Start Shopping")
  useEffect(() => {
    setCartOpen(false);
  }, [location.pathname, location.search]);

  // Auto-open cart drawer when an add-to-cart action completes.
  // The submitted action lives inside the JSON value under
  // CartForm.INPUT_NAME (see QuickAddModal.handleAdd and CartForm's own
  // submissions), not a plain "cartAction" field -- reading the wrong key
  // meant this never actually fired.
  useEffect(() => {
    const addingFetcher = fetchers.find((f) => {
      if (f.state !== 'loading') return false;
      const raw = f.formData?.get(CartForm.INPUT_NAME);
      if (typeof raw !== 'string') return false;
      try {
        return JSON.parse(raw)?.action === CartForm.ACTIONS.LinesAdd;
      } catch {
        return false;
      }
    });
    if (addingFetcher) setCartOpen(true);
  }, [fetchers]);

  // Sentry init + web vitals (guard: only on client). Fire-and-forget --
  // initSentry dynamically imports @sentry/react only when a DSN is
  // configured, so most deployments never pay for that bundle at all.
  if (typeof window !== 'undefined') {
    void initSentry(analyticsConfig.sentryDsn);
  }
  useWebVitals(analyticsConfig.ga4Id);

  const cartCount = cart?.totalQuantity ?? 0;
  const isNavigating = navigation.state !== 'idle';

  return (
    <HydrogenAnalytics.Provider
      cart={analyticsCart ?? null}
      shop={shop}
      consent={consent}
      customData={{
        country: localization.country.isoCode,
        currency: localization.country.currency.isoCode,
      }}
    >
    <LocaleProvider language={localization.language.isoCode}>
    <WishlistProvider isLoggedIn={isLoggedIn}>
      <div className="flex flex-col min-h-dvh">
      {/* Page-transition progress bar */}
      <div
        aria-hidden="true"
        className={`fixed top-0 left-0 z-[100] h-[2px] bg-[var(--color-accent)] transition-all duration-300 ease-out ${
          isNavigating ? 'w-2/3 opacity-100' : 'w-full opacity-0'
        }`}
      />
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:bg-[var(--color-accent)] focus:text-[var(--color-text-inverse)] focus:px-4 focus:py-2 focus:text-xs focus:tracking-widest focus:uppercase focus:rounded-full"
      >
        Skip to content
      </a>

      {/* Site-wide SEO schema */}
      <DefaultSeoSchema />

      <Suspense fallback={<AnnouncementBar />}>
        <Await resolve={activeDiscounts} errorElement={<AnnouncementBar />}>
          {(discounts) => (
            <>
              <AnnouncementBar discounts={discounts} />
              <DiscountsPopup discounts={discounts} />
            </>
          )}
        </Await>
      </Suspense>
      <Header
        cartCount={cartCount}
        isLoggedIn={isLoggedIn}
        accountsEnabled={accountsEnabled}
        onOpenCart={() => setCartOpen(true)}
        localization={localization}
        navCollections={navCollections}
      />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer localization={localization} navCollections={navCollections} />

      {/* Consent-gated analytics (GA4, Meta, TikTok, Klaviyo on-site embed) */}
      <Analytics
        ga4Id={analyticsConfig.ga4Id}
        metaPixelId={analyticsConfig.metaPixelId}
        tiktokPixelId={analyticsConfig.tiktokPixelId}
        klaviyoCompanyId={analyticsConfig.klaviyoCompanyId}
      />

      <CartDrawer
        cart={cart}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />

      <ChatWidget />
      </div>
    </WishlistProvider>
    </LocaleProvider>
    </HydrogenAnalytics.Provider>
  );
}

export function ErrorBoundary({error}: {error: unknown}) {
  // Report to Sentry on both server and client
  if (typeof window === 'undefined') {
    // Server-side — stack is logged by server.ts already
  } else {
    // Client-side — send to Sentry
    captureError(error, {route: window.location.pathname});
  }

  // Distinguish 404 from other errors. React Router converts a thrown
  // Response from a loader into its own route-error-response object before
  // it reaches an ErrorBoundary -- it is not `instanceof Response` by the
  // time it gets here, so that check never matched a real 404 (missing
  // collection/product/journal article all fell through to the generic
  // "Something went wrong" message instead).
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="min-h-dvh flex items-center justify-center p-8 bg-[#FAF9F6]">
      <div className="max-w-xl text-center">
        <p className="h-eyebrow mb-6">
          {is404 ? '404 — Not Found' : 'Something went wrong'}
        </p>
        <h1 className="font-serif text-[clamp(3.5rem,8vw,7rem)] leading-[0.95] mb-8 text-[#1A1A1A]">
          {is404 ? 'Lost.' : 'Oops.'}
        </h1>
        <p className="text-[#6B6B6B] text-lg mb-12">
          {is404
            ? 'The page you\'re looking for doesn\'t exist or has been moved.'
            : 'An unexpected error occurred. Please try again in a few moments.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/" className="h-btn-primary">
            Back to Home
          </a>
          <a
            href="/collections/all-products"
            className="px-6 py-3 border border-[#1A1A1A] text-sm tracking-wide uppercase hover:bg-[#1A1A1A] hover:text-white transition-colors"
          >
            Shop All
          </a>
        </div>
      </div>
    </div>
  );
}
