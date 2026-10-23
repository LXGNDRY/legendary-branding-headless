import {type MetaFunction, type LoaderFunctionArgs, Link, redirect} from 'react-router';
import {canonicalUrl, ROUTES} from '~/lib/site';
import {loader as loadArticle} from './journal.$articleHandle';
import Container from '~/components/ui/Container';

export const meta: MetaFunction = () => [
  {title: '404 - Page Not Found | LEGENDARY BRANDING'},
  {name: 'description', content: 'The page you are looking for does not exist.'},
  {name: 'robots', content: 'noindex, follow'},
];

export async function loader(args: LoaderFunctionArgs) {
  const url = new URL(args.request.url);
  const match = /^\/blogs\/legendary_blogging(?:\/([^/]+))?\/?$/.exec(url.pathname);
  if (match) {
    let destination: string = ROUTES.journal;
    if (match[1]) {
      let articleHandle: string;
      try {
        articleHandle = decodeURIComponent(match[1]);
      } catch {
        throw new Response('Not Found', {status: 404});
      }
      // NOTE: only the known blog maps into the flattened journal, and only if its article exists.
      const {article} = await loadArticle({...args, params: {articleHandle}});
      destination = ROUTES.article(encodeURIComponent(article.handle));
    }
    const target = new URL(canonicalUrl(destination));
    for (const [key, value] of url.searchParams) {
      if ((/^utm_[a-z_]+$/.test(key) || ['gclid', 'fbclid', 'msclkid'].includes(key)) && value.length <= 500) {
        target.searchParams.append(key, value);
      }
    }
    return redirect(target.toString(), {status: 301});
  }
  throw new Response('Not Found', {status: 404});
}

export function ErrorBoundary() {
  return (
    <Container className="py-24 md:py-32">
      <div className="max-w-2xl mx-auto text-center">
        <p className="h-eyebrow mb-6">404 - Not Found</p>
        <h1 className="font-serif text-[clamp(3rem,8vw,6rem)] leading-[0.95] mb-8 text-[var(--color-foreground)]">
          Lost in the
          <br />
          drop.
        </h1>
        <p className="text-[var(--color-text-secondary)] text-lg leading-relaxed mb-12 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist, or it sold out.
          Let&apos;s get you back to the good stuff.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="h-btn-primary">
            Back to Home
          </Link>
          <Link
            to="/collections/all-products"
            className="px-6 py-3 border border-[var(--color-foreground)] text-sm tracking-wide uppercase hover:bg-[var(--color-foreground)] hover:text-white transition-colors"
          >
            Shop All
          </Link>
        </div>
      </div>
    </Container>
  );
}

export default function CatchAll() {
  return null;
}
