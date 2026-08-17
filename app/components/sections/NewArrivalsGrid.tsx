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
    <section className="h-section bg-[#FAF9F6]">
      <div className="h-container">
        <div className="flex items-end justify-between mb-10">
          <div>
            {eyebrow && <p className="h-eyebrow mb-3">{eyebrow}</p>}
            <h2 className="font-serif font-normal text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] text-[#1A1A1A]">
              {heading}
            </h2>
          </div>
          <Link to={viewAllHref} className="h-link hidden sm:inline-flex">
            View all
          </Link>
        </div>

        {/* Asymmetric grid — first card spans 2 cols on md+ */}
        <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-4 h-stagger">
          {products.slice(0, 5).map((product, i) => (
            <div
              key={product.id}
              className={`h-reveal ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
            >
              <ProductCard
                product={product}
                loading={i === 0 ? 'eager' : 'lazy'}
                showQuickAdd
                hoverFlip
              />
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to={viewAllHref} className="h-btn-outline">
            Shop all new arrivals
          </Link>
        </div>
      </div>
    </section>
  );
}
