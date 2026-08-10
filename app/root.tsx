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
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
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
  const stack = error instanceof Error ? error.stack : undefined;

  return (
    <div className="min-h-dvh flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-2xl font-bold tracking-tight mb-4">
          Something went wrong
        </h1>
        <p className="text-[#6b6b6b] text-sm mb-4">{message}</p>
        {stack && (
          <pre className="text-left text-xs bg-[#f7f7f7] p-4 rounded overflow-auto mb-8 text-red-700">
            {stack}
          </pre>
        )}
        <a
          href="/"
          className="inline-block text-xs font-medium tracking-widest uppercase border border-[#0a0a0a] px-6 py-3 hover:bg-[#0a0a0a] hover:text-white transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
