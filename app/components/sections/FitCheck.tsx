import {useState} from 'react';
import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';

interface HotspotProduct {
  handle: string;
  title: string;
  price: {amount: string; currencyCode: string};
  image?: {url: string; altText?: string | null; width?: number | null; height?: number | null} | null;
}

interface Hotspot {
  x: number;
  y: number;
  label?: string;
  product: HotspotProduct;
}

interface FitCheckImage {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
}

interface FitCheckProps {
  eyebrow?: string;
  heading?: string;
  image: FitCheckImage;
  hotspots: Hotspot[];
}

/**
 * HANSSEN — Fit Check / Hotspot Image Section
 * Full-width image with clickable hotspots showing product info.
 */
export default function FitCheck({eyebrow, heading, image, hotspots}: FitCheckProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="h-section bg-[var(--color-background)] h-reveal">
      <div className="h-container">
        {(eyebrow || heading) && (
          <div className="mb-10">
            {eyebrow && <p className="h-eyebrow mb-3">{eyebrow}</p>}
            {heading && (
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] font-serif font-normal">
                {heading}
              </h2>
            )}
          </div>
        )}

        <div className="relative w-full">
          <Image
            data={image}
            aspectRatio="3/4"
            width={800}
            height={1067}
            className="w-full max-h-[80vh] object-cover"
            sizes="100vw"
          />

          {hotspots.map((spot, i) => (
            <div
              key={i}
              className="absolute"
              style={{left: `${spot.x}%`, top: `${spot.y}%`}}
            >
              <button
                className={`relative w-9 h-9 rounded-full border-2 border-[var(--color-text-inverse)] bg-[var(--color-accent)] flex items-center justify-center transition-all duration-200 ${activeIndex === i ? 'scale-110' : 'hover:scale-105'}`}
                onClick={() => setActiveIndex(activeIndex === i ? null : i)}
                aria-expanded={activeIndex === i}
                aria-label={`View ${spot.product.title}`}
              >
                <span className="absolute inset-0 rounded-full border-2 border-[var(--color-accent)]/40 animate-ping" />
                <span className="relative w-2 h-2 rounded-full bg-[var(--color-background)]" />
              </button>

              {activeIndex === i && (
                <div className="absolute z-20 bottom-full mb-3 left-1/2 -translate-x-1/2 w-60 bg-[var(--color-bg-level-1)] shadow-lg border border-[var(--color-border-medium)]">
                  <Link
                    to={`/products/${spot.product.handle}`}
                    className="flex items-center gap-4 p-4 hover:bg-[var(--color-surface)] transition-colors"
                    onClick={() => setActiveIndex(null)}
                  >
                    {spot.product.image ? (
                      <Image
                        data={spot.product.image}
                        className="w-14 h-16 object-cover rounded-lg shrink-0"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-14 h-16 rounded-lg bg-[var(--color-surface)] shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      {spot.label && (
                        <p className="h-eyebrow mb-1">
                          {spot.label}
                        </p>
                      )}
                      <p className="text-sm font-serif text-[var(--color-foreground)] truncate leading-snug">
                        {spot.product.title}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: spot.product.price.currencyCode,
                        }).format(parseFloat(spot.product.price.amount))}
                      </p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
