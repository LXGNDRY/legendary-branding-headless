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
} from 'react-router';
import {useState, useEffect} from 'react';
import {type LinksFunction, type MetaFunction, type LoaderFunctionArgs} from 'react-router';
import styles from '~/styles/app.css?url';
import {CacheShort} from '~/lib/cache';
import {initSentry, useWebVitals, captureError} from '~/lib/monitoring';
import {WishlistProvider} from '~/components/ui/Wishlist';
import Header from '~/components/layout/Header';
import Footer from '~/components/layout/Footer';
import CartDrawer from '~/components/layout/CartDrawer';
import AnnouncementBar from '~/components/layout/AnnouncementBar';
import {DefaultSeoSchema} from '~/components/seo/SeoSchema';
import Analytics from '~/components/seo/Analytics';
import type {CartData} from '~/lib/cart';
import {CacheLong} from '~/lib/cache';
import {LOCALIZATION_QUERY, type LocalizationData} from '~/lib/market';
import {Analytics as HydrogenAnalytics, getShopAnalytics} from '@shopify/hydrogen';

export const links: LinksFunction = () => [
  {rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml'},
  {rel: 'icon', href: '/favicon-32.png', sizes: '32x32', type: 'image/png'},
  {rel: 'icon', href: '/favicon-16.png', sizes: '16x16', type: 'image/png'},
  {rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180'},
  {rel: 'manifest', href: '/site.webmanifest'},
  {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preconnect',
    href: 'https://cdn.shopify.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'dns-prefetch',
    href: 'https://shop.app',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap',
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
    content: 'Legendary Branding — premium streetwear built to last. 235GSM+ heavyweight tees, made to order. Shop the collection.',
  },
  {property: 'og:type', content: 'website'},
  {property: 'og:site_name', content: 'Legendary Branding'},
  {property: 'og:url', content: 'https://legendary-branding.com'},
  {property: 'og:title', content: 'Legendary Branding | Premium Streetwear'},
  {property: 'og:description', content: 'Premium streetwear built to last. 235GSM+ heavyweight tees, made to order. Shop the collection.'},
  {name: 'twitter:card', content: 'summary_large_image'},
  {name: 'twitter:title', content: 'Legendary Branding | Premium Streetwear'},
  {name: 'twitter:description', content: 'Premium streetwear built to last.'},
];

export async function loader({context}: LoaderFunctionArgs) {
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

  const [cartData, localizationResult, shop] = await Promise.all([
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
  ]);

  return {
    cart: cartData as CartData,
    analyticsCart: cartData,
    isLoggedIn,
    accountsEnabled: Boolean(
      context.env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID &&
      context.env.PUBLIC_CUSTOMER_ACCOUNT_API_URL,
    ),
    localization: localizationResult.localization as LocalizationData,
    shop,
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
  const {cart, analyticsCart, isLoggedIn, accountsEnabled, localization, shop, consent} = useLoaderData<typeof loader>();
  const [cartOpen, setCartOpen] = useState(false);
  const navigation = useNavigation();
  const location = useLocation();
  const fetchers = useFetchers();

  // Close cart drawer on route change (e.g. clicking a product or "Start Shopping")
  useEffect(() => {
    setCartOpen(false);
  }, [location.pathname, location.search]);

  // Auto-open cart drawer when an add-to-cart action completes
  useEffect(() => {
    const addingFetcher = fetchers.find(
      (f) =>
        f.state === 'loading' &&
        f.formData?.get('cartAction') === 'LinesAdd',
    );
    if (addingFetcher) setCartOpen(true);
  }, [fetchers]);

  // Sentry init + web vitals (guard: only on client). Fire-and-forget --
  // initSentry dynamically imports @sentry/react only when a DSN is
  // configured, so most deployments never pay for that bundle at all.
  if (typeof window !== 'undefined') {
    void initSentry(import.meta.env.PUBLIC_SENTRY_DSN);
  }
  useWebVitals(import.meta.env.PUBLIC_GA4_MEASUREMENT_ID);

  // Judge.me's widget script is loaded only on product pages that actually
  // have badge/widget metafield HTML to render -- see products.$handle.tsx.
  // It used to load unconditionally here on every route (home, cart,
  // journal, etc.), which meant every visitor paid for an unnecessary
  // third-party request and script parse/exec on pages with no review
  // content at all.

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
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:bg-[var(--color-accent)] focus:text-white focus:px-4 focus:py-2 focus:text-xs focus:tracking-widest focus:uppercase focus:rounded-full"
      >
        Skip to content
      </a>

      {/* Site-wide SEO schema */}
      <DefaultSeoSchema />

      <AnnouncementBar />
      <Header
        cartCount={cartCount}
        isLoggedIn={isLoggedIn}
        accountsEnabled={accountsEnabled}
        onOpenCart={() => setCartOpen(true)}
      />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer localization={localization} />

      {/* Consent-gated analytics (GA4, Meta, TikTok, Klaviyo on-site embed) */}
      <Analytics
        ga4Id={import.meta.env.PUBLIC_GA4_MEASUREMENT_ID}
        metaPixelId={import.meta.env.PUBLIC_META_PIXEL_ID}
        tiktokPixelId={import.meta.env.PUBLIC_TIKTOK_PIXEL_ID}
        klaviyoCompanyId={import.meta.env.PUBLIC_KLAVIYO_COMPANY_ID}
      />

      <CartDrawer
        cart={cart}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
      </div>
    </WishlistProvider>
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

  // Distinguish 404 from other errors
  const is404 =
    error instanceof Response && error.status === 404;

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
