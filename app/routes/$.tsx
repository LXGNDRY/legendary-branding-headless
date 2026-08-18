import {type MetaFunction, Link} from 'react-router';
import Container from '~/components/ui/Container';

export const meta: MetaFunction = () => [
  {title: '404 — Page Not Found — LEGENDARY BRANDING'},
  {name: 'description', content: 'The page you are looking for does not exist.'},
  {tagName: 'link', rel: 'canonical', href: 'https://legendary-branding.com/404'},
  {name: 'robots', content: 'noindex, follow'},
];

export async function loader() {
  throw new Response('Not Found', {status: 404});
}

export function ErrorBoundary() {
  return (
    <Container className="py-24 md:py-32">
      <div className="max-w-2xl mx-auto text-center">
        <p className="h-eyebrow mb-6">404 — Not Found</p>
        <h1 className="font-serif text-[clamp(3rem,8vw,6rem)] leading-[0.95] mb-8 text-[#1A1A1A]">
          Lost in the
          <br />
          drop.
        </h1>
        <p className="text-[#6B6B6B] text-lg leading-relaxed mb-12 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist — or it sold out.
          Let&apos;s get you back to the good stuff.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="h-btn-primary">
            Back to Home
          </Link>
          <Link
            to="/collections/all-products"
            className="px-6 py-3 border border-[#1A1A1A] text-sm tracking-wide uppercase hover:bg-[#1A1A1A] hover:text-white transition-colors"
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
