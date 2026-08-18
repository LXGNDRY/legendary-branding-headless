import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
  useFetchers,
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
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap',
  },
  {rel: 'stylesheet', href: styles},
];

export const meta: MetaFunction = () => [
  {charSet: 'utf-8'},
  {name: 'viewport', content: 'width=device-width, initial-scale=1'},
  {title: 'LEGENDARY BRANDING'},
  {
    name: 'description',
    content: 'Premium editorial streetwear. Bold, minimal, fast.',
  },
  {property: 'og:type', content: 'website'},
  {property: 'og:site_name', content: 'Legendary Branding'},
  {property: 'og:url', content: 'https://legendary-branding.com'},
  {name: 'twitter:card', content: 'summary_large_image'},
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

  const cartData = await cart.get();

  return {
    cart: cartData as CartData,
    isLoggedIn,
  };
}

export function Layout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
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
  const {cart, isLoggedIn} = useLoaderData<typeof loader>();
  const [cartOpen, setCartOpen] = useState(false);
  const navigation = useNavigation();
  const fetchers = useFetchers();

  // Auto-open cart drawer when an add-to-cart action completes
  useEffect(() => {
    const addingFetcher = fetchers.find(
      (f) =>
        f.state === 'loading' &&
        f.formData?.get('cartAction') === 'LinesAdd',
    );
    if (addingFetcher) setCartOpen(true);
  }, [fetchers]);

  // Sentry init + web vitals (guard: only on client)
  if (typeof window !== 'undefined') {
    initSentry(import.meta.env.PUBLIC_SENTRY_DSN);
  }
  useWebVitals(import.meta.env.PUBLIC_GA4_MEASUREMENT_ID);

  const cartCount = cart?.totalQuantity ?? 0;
  const isNavigating = navigation.state !== 'idle';

  return (
    <WishlistProvider>
      <div className="flex flex-col min-h-dvh">
      {/* Page-transition progress bar */}
      <div
        aria-hidden="true"
        className={`fixed top-0 left-0 z-[100] h-[2px] bg-[#0a0a0a] transition-all duration-300 ease-out ${
          isNavigating ? 'w-2/3 opacity-100' : 'w-full opacity-0'
        }`}
      />
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:bg-[#FF3B30] focus:text-[#FAF9F6] focus:px-4 focus:py-2 focus:text-xs focus:tracking-widest focus:uppercase focus:rounded-full"
      >
        Skip to content
      </a>

      {/* Site-wide SEO schema */}
      <DefaultSeoSchema />

      <AnnouncementBar />
      <Header
        cartCount={cartCount}
        isLoggedIn={isLoggedIn}
        onOpenCart={() => setCartOpen(true)}
      />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {/* Consent-gated analytics (GA4, Meta, TikTok) */}
      <Analytics
        ga4Id={import.meta.env.PUBLIC_GA4_MEASUREMENT_ID}
        metaPixelId={import.meta.env.PUBLIC_META_PIXEL_ID}
        tiktokPixelId={import.meta.env.PUBLIC_TIKTOK_PIXEL_ID}
      />

      <CartDrawer
        cart={cart}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
      </div>
    </WishlistProvider>
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

  return (
    <div className="min-h-dvh flex items-center justify-center p-8 bg-[#FAF9F6]">
      <div className="max-w-xl text-center">
        <p className="h-eyebrow mb-6">Something went wrong</p>
        <h1 className="font-serif text-[clamp(3.5rem,8vw,7rem)] leading-[0.95] mb-8 text-[#1A1A1A]">
          Oops.
        </h1>
        <p className="text-[#6B6B6B] text-lg mb-12">
          An unexpected error occurred. Please try again in a few moments.
        </p>
        <a href="/" className="h-btn-primary">
          Back to Home
        </a>
      </div>
    </div>
  );
}
