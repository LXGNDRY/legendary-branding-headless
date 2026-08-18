import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {useRevealChildren} from '~/hooks/useReveal';

interface CategoryItem {
  id: string;
  title: string;
  handle: string;
  image?: {url: string; altText?: string | null; width?: number | null; height?: number | null} | null;
}

interface CategoryGridProps {
  eyebrow?: string;
  heading?: string;
  items: CategoryItem[];
}

export default function CategoryGrid({eyebrow = 'Shop', heading = 'Collections', items}: CategoryGridProps) {
  const ref = useRevealChildren<HTMLDivElement>();
  const visible = items.slice(0, 3);

  return (
    <section className="h-section bg-[var(--color-bg-level-0)]">
      <div className="h-container">
        <div className="flex items-end justify-between mb-10">
          <div>
            {eyebrow && <p className="h-eyebrow mb-3">{eyebrow}</p>}
            {heading && (
              <h2 className="font-serif font-normal text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] text-[var(--color-text-primary)]">
                {heading}
              </h2>
            )}
          </div>
          <Link to="/collections" className="h-link hidden sm:inline-flex">
            View all
          </Link>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 h-stagger">
          {visible.map((item) => (
            <Link
              key={item.id}
              to={`/collections/${item.handle}`}
              className="h-reveal group relative aspect-[3/4] overflow-hidden rounded-md bg-[var(--color-bg-level-2)]"
            >
              {item.image?.url ? (
                <Image
                  data={item.image}
                  aspectRatio="3/4"
                  width={600}
                  height={800}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-600 ease-[var(--ease-expo)] group-hover:scale-[1.05]"
                  sizes="(max-width: 640px) 100vw, 33vw"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 bg-[var(--color-bg-level-3)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="h-eyebrow text-white/60 mb-2">{eyebrow}</p>
                <p className="font-serif text-xl md:text-2xl text-white leading-tight">{item.title}</p>
                <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold tracking-[0.1em] uppercase text-white/80 group-hover:text-white transition-colors">
                  Shop Now
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2.5 6h7M7 2.5l3 3.5-3 3.5" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="sm:hidden mt-8 text-center">
          <Link to="/collections" className="h-link">View all collections</Link>
        </div>
      </div>
    </section>
  );
}
