import type {MetaFunction} from 'react-router';
import Container from '~/components/ui/Container';
import Placeholder from '~/components/ui/Placeholder';
import Button from '~/components/ui/Button';

export const meta: MetaFunction = () => [
  {title: 'LEGENDARY BRANDING — Premium Editorial Streetwear'},
  {
    name: 'description',
    content: 'Premium editorial streetwear. Bold, minimal, fast.',
  },
];

export async function loader() {
  return {};
}

export default function Homepage() {
  return (
    <div>
      {/* Hero — full-bleed campaign image placeholder */}
      <section className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-[#f7f7f7] overflow-hidden">
        <Placeholder
          aspect="aspect-auto"
          label="Hero Campaign Image"
          className="absolute inset-0 w-full h-full"
        />
        <div className="absolute inset-0 flex flex-col items-start justify-end p-[clamp(1.5rem,5vw,4rem)] pb-[clamp(2rem,6vw,5rem)]">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-white/70 mb-3">
            New Drop
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-none mb-6">
            Stay
            <br />
            Legendary.
          </h1>
          <Button as="link" to="/collections/all-products" variant="primary">
            Shop New Drops
          </Button>
        </div>
      </section>

      {/* Collections grid */}
      <Container className="py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="text-xs font-semibold tracking-widest uppercase">
            Shop by Category
          </h2>
          <Button as="link" to="/collections" variant="ghost">
            All Collections
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {label: 'T-Shirts', href: '/collections/shirts-tops'},
            {label: 'Outerwear', href: '/collections/hoodies-jackets'},
            {label: 'Accessories', href: '/collections/accessories-more'},
            {label: 'Marque Légendaire', href: '/collections/marque-legendaire-luxury-streetwear'},
          ].map(({label, href}) => (
            <a
              key={href}
              href={href}
              className="group block relative overflow-hidden"
            >
              <Placeholder aspect="aspect-[3/4]" label={label} />
              <div className="mt-3">
                <span className="text-xs font-medium tracking-[0.15em] uppercase text-[#0a0a0a] group-hover:text-[#6b6b6b] transition-colors">
                  {label}
                </span>
              </div>
            </a>
          ))}
        </div>
      </Container>

      {/* Featured products placeholder */}
      <section className="bg-[#f7f7f7]">
        <Container className="py-20">
          <div className="flex items-baseline justify-between mb-10">
            <h2 className="text-xs font-semibold tracking-widest uppercase">
              New Drops
            </h2>
            <Button as="link" to="/collections/all-products" variant="ghost">
              View All
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({length: 4}).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={i} className="group">
                <div className="relative overflow-hidden mb-3">
                  <Placeholder aspect="aspect-[3/4]" label="Product" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 w-3/4 bg-[#e5e5e5] rounded-sm" />
                  <div className="h-3 w-1/4 bg-[#e5e5e5] rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Editorial CTA band */}
      <Container className="py-24 text-center">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#6b6b6b] mb-4">
          The Journal
        </p>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
          Culture. Craft. Community.
        </h2>
        <Button as="link" to="/journal" variant="outline">
          Read the Journal
        </Button>
      </Container>
    </div>
  );
}
