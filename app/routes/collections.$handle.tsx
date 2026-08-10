import type {MetaFunction, LoaderFunctionArgs} from 'react-router';
import {useParams} from 'react-router';
import Container from '~/components/ui/Container';
import Placeholder from '~/components/ui/Placeholder';

export const meta: MetaFunction<typeof loader> = ({data}) => [
  {title: `${data?.title ?? 'Collection'} — LEGENDARY BRANDING`},
  {name: 'description', content: `Shop ${data?.title ?? 'this collection'}.`},
];

export async function loader({params}: LoaderFunctionArgs) {
  const handle = params.handle ?? '';
  // Storefront API call wired up in Milestone 2
  return {
    handle,
    title: handle
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

export default function CollectionPage() {
  const {handle} = useParams();

  return (
    <Container className="py-16">
      {/* Breadcrumb */}
      <nav className="mb-8 text-[11px] tracking-widest uppercase text-[#6b6b6b]" aria-label="Breadcrumb">
        <a href="/collections" className="hover:text-[#0a0a0a] transition-colors">
          Collections
        </a>
        <span className="mx-2">/</span>
        <span className="text-[#0a0a0a]">
          {handle?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      </nav>

      {/* Collection header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight capitalize">
          {handle?.replace(/-/g, ' ')}
        </h1>
      </div>

      {/* Filter / sort bar placeholder */}
      <div className="flex items-center justify-between border-y border-[#e5e5e5] py-3 mb-8">
        <span className="text-xs text-[#6b6b6b] tracking-wide">
          Filter &amp; Sort — coming in Milestone 2
        </span>
      </div>

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({length: 12}).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="group">
            <div className="relative overflow-hidden mb-3">
              <Placeholder aspect="aspect-[3/4]" label="Product" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-3/4 bg-[#e5e5e5] rounded-sm animate-pulse" />
              <div className="h-3 w-1/4 bg-[#e5e5e5] rounded-sm animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-12 text-center text-xs text-[#6b6b6b] tracking-wide">
        Products load from Storefront API in Milestone 2.
      </p>
    </Container>
  );
}
