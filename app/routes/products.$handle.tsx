import type {MetaFunction, LoaderFunctionArgs} from 'react-router';
import {useParams} from 'react-router';
import Container from '~/components/ui/Container';
import Placeholder from '~/components/ui/Placeholder';
import Button from '~/components/ui/Button';
import Badge from '~/components/ui/Badge';

export const meta: MetaFunction<typeof loader> = ({data}) => [
  {title: `${data?.title ?? 'Product'} — LEGENDARY BRANDING`},
];

export async function loader({params}: LoaderFunctionArgs) {
  const handle = params.handle ?? '';
  // Storefront API call wired up in Milestone 3
  return {
    handle,
    title: handle
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

export default function ProductPage() {
  const {handle} = useParams();
  const title = handle?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '';

  return (
    <Container className="py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-[11px] tracking-widest uppercase text-[#6b6b6b]" aria-label="Breadcrumb">
        <a href="/collections/all-products" className="hover:text-[#0a0a0a] transition-colors">
          Shop
        </a>
        <span className="mx-2">/</span>
        <span className="text-[#0a0a0a]">{title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Gallery */}
        <div className="space-y-2">
          <Placeholder aspect="aspect-[3/4]" label="Product Image" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({length: 4}).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <Placeholder key={i} aspect="aspect-square" label="" />
            ))}
          </div>
        </div>

        {/* Product info */}
        <div className="space-y-6">
          <div>
            <Badge variant="new" className="mb-3">New</Badge>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              {title}
            </h1>
            <p className="mt-3 text-xl font-medium">$65.00</p>
          </div>

          {/* Variant selector placeholder */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-3">
              Size
            </p>
            <div className="flex gap-2 flex-wrap">
              {['XS', 'S', 'M', 'L', 'XL', '2XL'].map((size) => (
                <button
                  key={size}
                  type="button"
                  className="w-12 h-12 border border-[#e5e5e5] text-xs font-medium hover:border-[#0a0a0a] transition-colors"
                  aria-label={`Size ${size}`}
                >
                  {size}
                </button>
              ))}
            </div>
            <a
              href="/policies/size-guide"
              className="inline-block mt-2 text-[11px] tracking-wide underline underline-offset-2 text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors"
            >
              Size Guide
            </a>
          </div>

          {/* Add to cart — wired in Milestone 4 */}
          <Button variant="primary" type="button" className="w-full py-4 text-sm">
            Add to Cart
          </Button>

          {/* Description placeholder */}
          <div className="border-t border-[#e5e5e5] pt-6 space-y-2">
            <div className="h-3 bg-[#e5e5e5] rounded-sm w-full animate-pulse" />
            <div className="h-3 bg-[#e5e5e5] rounded-sm w-5/6 animate-pulse" />
            <div className="h-3 bg-[#e5e5e5] rounded-sm w-4/6 animate-pulse" />
          </div>

          <p className="text-xs text-[#6b6b6b] tracking-wide">
            Full product data and add-to-cart wired in Milestone 3.
          </p>
        </div>
      </div>
    </Container>
  );
}
