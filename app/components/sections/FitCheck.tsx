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

export default function FitCheck({eyebrow, heading, image, hotspots}: FitCheckProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="lb-section bg-white">
      {(eyebrow || heading) && (
        <div className="lb-container mb-8">
          {eyebrow && <div className="lb-eyebrow mb-2">{eyebrow}</div>}
          {heading && <h2>{heading}</h2>}
        </div>
      )}

      <div className="relative w-full">
        <Image
          data={image}
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
              className={`relative w-8 h-8 rounded-full border-2 border-white bg-black/60 flex items-center justify-center transition-all duration-200 ${activeIndex === i ? 'scale-110' : 'hover:scale-105'}`}
              onClick={() => setActiveIndex(activeIndex === i ? null : i)}
              aria-expanded={activeIndex === i}
              aria-label={`View ${spot.product.title}`}
            >
              <span className="absolute inset-0 rounded-full border border-white/40 animate-ping opacity-40" />
              <svg width="10" height="10" viewBox="0 0 10 10" fill="white" aria-hidden="true">
                <circle cx="5" cy="5" r="4" />
              </svg>
            </button>

            {activeIndex === i && (
              <div className="absolute z-20 bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 bg-white shadow-xl">
                <Link
                  to={`/products/${spot.product.handle}`}
                  className="flex items-center gap-3 p-3 hover:bg-[#f5f5f5] transition-colors"
                  onClick={() => setActiveIndex(null)}
                >
                  {spot.product.image ? (
                    <Image
                      data={spot.product.image}
                      className="w-14 h-14 object-cover shrink-0"
                      sizes="56px"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-[#f0ede8] shrink-0" />
                  )}
                  <div className="min-w-0">
                    {spot.label && (
                      <p className="text-[9px] tracking-widest uppercase text-[#6b6b6b] mb-0.5">
                        {spot.label}
                      </p>
                    )}
                    <p className="text-xs font-medium text-[#0a0a0a] truncate leading-snug">
                      {spot.product.title}
                    </p>
                    <p className="text-xs text-[#6b6b6b] mt-0.5">
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
    </section>
  );
}
