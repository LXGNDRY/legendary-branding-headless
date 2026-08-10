import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from 'react-router';
import {useState} from 'react';
import type {LinksFunction, MetaFunction, LoaderFunctionArgs} from 'react-router';
import styles from '~/styles/app.css?url';
import Header from '~/components/layout/Header';
import Footer from '~/components/layout/Footer';
import CartDrawer from '~/components/layout/CartDrawer';
import {DefaultSeoSchema} from '~/components/seo/SeoSchema';
import type {CartData} from '~/lib/cart';

export const links: LinksFunction = () => [
  {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
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
  const cart = await context.cart.get();
  return {cart: cart as CartData};
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
  const {cart} = useLoaderData<typeof loader>();
  const [cartOpen, setCartOpen] = useState(false);

  const cartCount = cart?.totalQuantity ?? 0;

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Site-wide SEO schema */}
      <DefaultSeoSchema />

      <Header
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer
        cart={cart}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </div>
  );
}

export function ErrorBoundary({error}: {error: unknown}) {
  const message = error instanceof Error ? error.message : 'Unknown error';

  // Never expose stack traces to end users — log server-side only
  if (typeof window === 'undefined' && error instanceof Error) {
    console.error(error.stack);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <p className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-black/50 mb-4">
          ERROR
        </p>
        <h1 className="mb-6">Something went wrong</h1>
        <p className="text-black/60 text-sm mb-10">
          We&apos;ve been notified and are looking into it. Please try again in
          a few moments.
        </p>
        <a
          href="/"
          className="inline-block text-[0.78rem] font-medium tracking-[0.08em] uppercase border border-black px-7 py-3 hover:bg-black hover:text-white transition-all duration-300"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
