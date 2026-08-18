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
    <section className="h-section bg-[var(--color-background)]">
      <div className="h-container">
        <div className="flex items-end justify-between mb-10">
          <div>
            {eyebrow && <p className="h-eyebrow mb-3">{eyebrow}</p>}
            {heading && (
              <h2 className="font-serif font-normal text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] text-[var(--color-foreground)]">
                {heading}
              </h2>
            )}
          </div>
          <Link to="/collections" className="h-link hidden sm:inline-flex">
            View all
          </Link>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-stagger">
          {visible.map((item) => (
            <Link
              key={item.id}
              to={`/collections/${item.handle}`}
              className="h-reveal group relative aspect-[3/4] overflow-hidden rounded-lg bg-[var(--color-surface)]"
            >
              {item.image?.url ? (
                <Image
                  data={item.image}
                  aspectRatio="3/4"
                  width={600}
                  height={800}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 bg-[var(--color-foreground)]/5" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-foreground)]/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="h-eyebrow text-[var(--color-text-inverse)]/70 mb-1">{eyebrow}</p>
                <p className="font-serif text-[1.35rem] text-[var(--color-text-inverse)] leading-tight">{item.title}</p>
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
