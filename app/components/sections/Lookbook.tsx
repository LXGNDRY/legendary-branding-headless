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
  hotspotX?: number; // 0-100
  hotspotY?: number; // 0-100
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
 * LEGENDARY STREETWEAR — Lookbook Section
 * Editorial lookbook grid with product hotspots linking to shop items.
 * Ported from sections/lb-lookbook.liquid
 */
export default function Lookbook({
  eyebrow = 'THE COLLECTION',
  heading,
  linkLabel = 'View all products',
  linkUrl = '/collections/all-products',
  items,
  gridStyle = 'editorial',
}: LookbookProps) {
  // Filter items without real images
  const validItems = items.filter((item) => item.image && item.image.url);

  return (
    <section className="lb-section lb-lookbook">
      <div className="lb-container">
        <div className="lb-section-header">
          <div>
            <div className="lb-eyebrow mb-2">{eyebrow}</div>
            <h2>{heading}</h2>
          </div>
          {linkLabel && linkUrl && (
            <Link to={linkUrl} className="lb-section-header__link">
              {linkLabel}
            </Link>
          )}
        </div>

        <div
          className={`grid gap-4 ${
            gridStyle === 'editorial'
              ? 'grid-cols-12 auto-rows-[minmax(200px,auto)]'
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
                  className="w-full h-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
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
                      <div className="w-9 h-9 rounded-full bg-white border border-black/10 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)] z-10">
                        <span className="text-lg font-light leading-none">+</span>
                      </div>

                      {/* Product popup card */}
                      <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 translate-y-2 w-60 bg-white p-3 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.12)] opacity-0 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto flex gap-3">
                        {item.product.image && (
                          <img
                            src={item.product.image.url}
                            alt={item.product.title}
                            className="w-16 h-20 object-cover rounded-sm"
                          />
                        )}
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <div className="text-xs font-medium leading-tight truncate">
                            {item.product.title}
                          </div>
                          <Money
                            data={item.product.price as any}
                            className="text-xs font-medium"
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
