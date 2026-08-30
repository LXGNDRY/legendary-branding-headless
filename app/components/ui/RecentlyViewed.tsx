import {useEffect, useState} from 'react';
import {Link} from 'react-router';

const COOKIE_NAME = 'recently_viewed';
const MAX_PRODUCTS = 8;

interface RecentProduct {
  id: string;
  handle: string;
  title: string;
  image?: string;
}

interface RecentlyViewedProps {
  currentProductId: string;
  currentProductHandle: string;
  currentProductTitle: string;
  currentProductImage?: string;
}

/**
 * Recently viewed products — cookie-based, client-side only.
 *
 * Stores lightweight product info in a cookie. Shown at the bottom
 * of PDPs to encourage continued browsing.
 */
export default function RecentlyViewed({
  currentProductId,
  currentProductHandle,
  currentProductTitle,
  currentProductImage,
}: RecentlyViewedProps) {
  const [products, setProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : '';
    };

    const setCookie = (name: string, value: string, days = 30) => {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie =
        name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
    };

    // Parse existing
    let viewed: RecentProduct[] = [];
    try {
      viewed = JSON.parse(getCookie(COOKIE_NAME) || '[]');
    } catch {
      viewed = [];
    }

    // Add current product to the front
    viewed = [
      {
        id: currentProductId,
        handle: currentProductHandle,
        title: currentProductTitle,
        image: currentProductImage,
      },
      ...viewed.filter((p) => p.id !== currentProductId),
    ].slice(0, MAX_PRODUCTS);

    // Save updated
    setCookie(COOKIE_NAME, JSON.stringify(viewed));

    // Show previously viewed (exclude current)
    setProducts(viewed.slice(1, 5));
  }, [currentProductId, currentProductHandle, currentProductTitle, currentProductImage]);

  if (products.length < 2) return null;

  return (
    <section className="border-t border-[var(--color-border-muted)]">
      <div className="h-container py-12 lg:py-16">
        <h2 className="text-[0.78rem] font-medium tracking-[0.15em] uppercase mb-6 lg:mb-10">
          Recently Viewed
        </h2>

        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {products.map((p) => (
            <Link
              key={p.id}
              to={`/products/${p.handle}`}
              className="group w-[56vw] max-w-[14rem] shrink-0 snap-start lg:w-auto lg:max-w-none"
            >
              <div className="aspect-[3/4] bg-[var(--color-surface)] mb-3 overflow-hidden">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
                      View
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs font-medium leading-tight line-clamp-2">
                {p.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
