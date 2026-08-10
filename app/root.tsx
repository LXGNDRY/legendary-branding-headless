import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import type {LinksFunction, MetaFunction} from 'react-router';
import styles from '~/styles/app.css?url';
import Header from '~/components/layout/Header';
import Footer from '~/components/layout/Footer';

export const links: LinksFunction = () => [
  // Preconnect to Google Fonts
  {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  // Inter typeface
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
  // Global styles + Tailwind
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
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function ErrorBoundary({error}: {error: unknown}) {
  const message = error instanceof Error ? error.message : 'Unknown error';

  return (
    <div className="min-h-dvh flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold tracking-tight mb-4">
          Something went wrong
        </h1>
        <p className="text-[#6b6b6b] text-sm mb-8">{message}</p>
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
