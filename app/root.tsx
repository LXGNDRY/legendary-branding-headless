import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from 'react-router';
import {useState} from 'react';
import {type LinksFunction, type MetaFunction, type LoaderFunctionArgs} from 'react-router';
import styles from '~/styles/app.css?url';
import {CacheShort} from '~/lib/cache';
import {initSentry, useWebVitals} from '~/lib/monitoring';
import {WishlistProvider} from '~/components/ui/Wishlist';
import Header from '~/components/layout/Header';
import Footer from '~/components/layout/Footer';
import CartDrawer from '~/components/layout/CartDrawer';
import AnnouncementBar from '~/components/layout/AnnouncementBar';
import {DefaultSeoSchema} from '~/components/seo/SeoSchema';
import Analytics from '~/components/seo/Analytics';
import type {CartData} from '~/lib/cart';

export const links: LinksFunction = () => [
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

  // Sentry init + web vitals (guard: only on client)
  if (typeof window !== 'undefined') {
    initSentry(import.meta.env.PUBLIC_SENTRY_DSN);
  }
  useWebVitals(import.meta.env.PUBLIC_GA4_MEASUREMENT_ID);

  const cartCount = cart?.totalQuantity ?? 0;

  return (
    <WishlistProvider>
      <div className="flex flex-col min-h-dvh">
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
  if (typeof window === 'undefined' && error instanceof Error) {
    console.error(error.stack);
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
