import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';

type LookbookImage = {
  id: string;
  image: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  };
  product?: {
    handle: string;
    title: string;
    price: {amount: string; currencyCode: string};
    image?: {
      url: string;
      altText?: string | null;
    };
  } | null;
  hotspotX?: number;
  hotspotY?: number;
  spanCols?: number;
  spanRows?: number;
};

interface LookbookProps {
  eyebrow?: string;
  heading: string;
  linkLabel?: string;
  linkUrl?: string;
  items: LookbookImage[];
  gridStyle?: 'editorial' | 'simple';
}

/**
 * HANSSEN — Lookbook Section
 * Editorial asymmetric grid with product hotspots.
 * Clean dots, refined hover cards, serif section header.
 */
export default function Lookbook({
  eyebrow = 'The Collection',
  heading,
  linkLabel = 'Shop the look',
  linkUrl = '/collections/all-products',
  items,
  gridStyle = 'editorial',
}: LookbookProps) {
  const validItems = items.filter((item) => item.image && item.image.url);

  return (
    <section className="h-section bg-[#FAF9F6] h-reveal">
      <div className="h-container">
        <div className="h-section-header">
          <div>
            <p className="h-eyebrow mb-3">{eyebrow}</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] font-serif font-normal">
              {heading}
            </h2>
          </div>
          {linkLabel && linkUrl && (
            <Link to={linkUrl} className="h-link">
              {linkLabel}
            </Link>
          )}
        </div>

        <div
          className={`grid gap-4 ${
            gridStyle === 'editorial'
              ? 'grid-cols-12 auto-rows-[minmax(160px,auto)]'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {validItems.map((item) => {
            const spanCols = item.spanCols ?? 4;
            const spanRows = item.spanRows ?? 2;
            const colClass =
              gridStyle === 'editorial'
                ? `col-span-12 sm:col-span-6 lg:col-span-${spanCols}`
                : '';
            const rowStyle =
              gridStyle === 'editorial'
                ? {gridRow: `span ${spanRows}`}
                : {};

            return (
              <div
                key={item.id}
                className={`relative overflow-hidden ${colClass}`}
                style={rowStyle}
              >
                <Image
                  data={item.image}
                  aspectRatio="4/3"
                  sizes="(max-width: 749px) 100vw, 33vw"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03]"
                />

                {/* Hotspot */}
                {item.product && (
                  <div
                    className="absolute"
                    style={{
                      left: `${item.hotspotX ?? 50}%`,
                      top: `${item.hotspotY ?? 50}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <Link
                      to={`/products/${item.product.handle}`}
                      className="group relative block"
                    >
                      {/* Hotspot dot */}
                      <div className="w-10 h-10 rounded-full bg-[#FF3B30] flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 z-10 shadow-lg">
                        <span className="text-white text-base font-light leading-none">+</span>
                      </div>

                      {/* Product popup card */}
                      <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 translate-y-2 w-64 bg-white p-4 opacity-0 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto flex gap-4 shadow-lg border border-[#E8E6E1]">
                        {item.product.image && (
                          <img
                            src={item.product.image.url}
                            alt={item.product.title}
                            className="w-16 h-20 object-cover"
                          />
                        )}
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <div className="text-sm font-serif leading-tight truncate">
                            {item.product.title}
                          </div>
                          <Money
                            data={item.product.price as any}
                            className="text-xs text-[#6B6B6B]"
                          />
                        </div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
