import type {MetaFunction, LoaderFunctionArgs} from 'react-router';
import {useParams} from 'react-router';
import Container from '~/components/ui/Container';

const PAGE_TITLES: Record<string, string> = {
  'refund-policy': 'Refund & Return Policy',
  'terms-of-service': 'Terms of Service',
  'privacy-with-legendary-branding': 'Privacy Policy',
  'shipping-policy': 'Shipping Policy',
  'size-guide': 'Size Guide',
  about: 'About Us',
  contact: 'Contact',
  legendary_branding_faqs: 'FAQ',
  'data-sharing-opt-out': 'Your Privacy Choices',
};

export const meta: MetaFunction<typeof loader> = ({data}) => [
  {title: `${data?.title ?? 'Policy'} — LEGENDARY BRANDING`},
];

export async function loader({params}: LoaderFunctionArgs) {
  const handle = params.handle ?? '';
  const title = PAGE_TITLES[handle] ?? handle.replace(/-_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  // Storefront API / Admin API page body wired up in Milestone 7
  return {handle, title};
}

export default function PolicyPage() {
  const {handle} = useParams();
  const title = PAGE_TITLES[handle ?? ''] ?? (handle?.replace(/[-_]/g, ' ') ?? 'Policy');

  return (
    <Container className="py-16">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-8 text-[11px] tracking-widest uppercase text-[#6b6b6b]" aria-label="Breadcrumb">
          <a href="/" className="hover:text-[#0a0a0a] transition-colors">
            Home
          </a>
          <span className="mx-2">/</span>
          <span className="text-[#0a0a0a]">{title}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-10">
          {title}
        </h1>

        {/* Page body skeleton */}
        <div className="space-y-3 prose prose-sm max-w-none">
          {Array.from({length: 12}).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div
              key={i}
              className={`h-3 bg-[#e5e5e5] rounded-sm animate-pulse ${
                i % 5 === 4 ? 'w-1/2 mb-4' : i % 7 === 6 ? 'w-3/4' : 'w-full'
              }`}
            />
          ))}
        </div>

        <p className="mt-12 text-xs text-[#6b6b6b] tracking-wide text-center">
          Page content loads from Shopify in Milestone 7.
        </p>
      </div>
    </Container>
  );
}
