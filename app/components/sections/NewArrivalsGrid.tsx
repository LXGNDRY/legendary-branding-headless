import {Link} from 'react-router';
import ProductCard, {type ProductCardFragment} from '~/components/ui/ProductCard';
import {useRevealChildren} from '~/hooks/useReveal';

interface NewArrivalsGridProps {
  eyebrow?: string;
  heading?: string;
  products: ProductCardFragment[];
  viewAllHref?: string;
}

export default function NewArrivalsGrid({
  eyebrow = 'Just Dropped',
  heading = 'New Arrivals',
  products,
  viewAllHref = '/collections/all-products',
}: NewArrivalsGridProps) {
  const ref = useRevealChildren<HTMLDivElement>();
  if (!products.length) return null;

  return (
    <section className="h-section bg-[var(--color-bg-level-0)]">
      <div className="h-container">
        <div className="flex items-end justify-between mb-10">
          <div>
            {eyebrow && <p className="h-eyebrow mb-3">{eyebrow}</p>}
            <h2 className="font-serif font-normal text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] text-[var(--color-text-primary)]">
              {heading}
            </h2>
          </div>
          <Link to={viewAllHref} className="h-link hidden sm:inline-flex">
            View all
          </Link>
        </div>

        {/* Product grid */}
        <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 h-stagger">
          {products.slice(0, 8).map((product, i) => (
            <div key={product.id} className="h-reveal">
              <ProductCard
                product={product}
                loading={i < 4 ? 'eager' : 'lazy'}
                showQuickAdd
                hoverFlip
              />
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to={viewAllHref}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-[var(--color-border-medium)] text-[var(--color-text-primary)] text-[0.75rem] font-semibold tracking-[0.14em] uppercase rounded-full hover:bg-[var(--color-bg-level-2)] hover:border-[var(--color-border-strong)] transition-all"
          >
            Shop all new arrivals
          </Link>
        </div>
      </div>
    </section>
  );
}
