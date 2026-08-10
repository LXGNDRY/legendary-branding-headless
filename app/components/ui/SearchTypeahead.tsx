import {useState, useEffect, useRef} from 'react';
import {Link, useNavigate} from 'react-router';
import {Image} from '@shopify/hydrogen';
import type {ProductCardFragment} from './ProductCard';

const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch($query: String!, $limit: Int = 6, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    predictiveSearch(query: $query, limit: $limit, options: {
      unavailableProducts: HIDE,
    }) {
      products {
        id
        title
        handle
        vendor
        image { url altText width height }
        price {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
      collections {
        id
        title
        handle
        image { url altText width height }
      }
      queries {
        text
      }
    }
  }
` as const;

interface PredictiveProduct {
  id: string;
  title: string;
  handle: string;
  vendor?: string | null;
  image?: {url: string; altText?: string | null} | null;
  price: {
    minVariantPrice: {amount: string; currencyCode: string};
  };
}

interface PredictiveCollection {
  id: string;
  title: string;
  handle: string;
  image?: {url: string; altText?: string | null} | null;
}

interface PredictiveResult {
  products: PredictiveProduct[];
  collections: PredictiveCollection[];
  queries: {text: string}[];
}

interface SearchTypeaheadProps {
  placeholder?: string;
  onClose?: () => void;
}

/**
 * Predictive search typeahead component.
 *
 * Fetches real-time suggestions from Shopify's Predictive Search API
 * as the user types. Shows product suggestions, collection suggestions,
 * and query suggestions (related search terms).
 */
export default function SearchTypeahead({
  placeholder = 'Search products...',
  onClose,
}: SearchTypeaheadProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PredictiveResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/search?q=' + encodeURIComponent(query));
        if (res.ok) {
          const data = (await res.json()) as PredictiveResult;
          setResults(data);
          setOpen(true);
        }
      } catch {
        // Fail silently — user can still submit the full search
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate('/search?q=' + encodeURIComponent(query.trim()));
      setOpen(false);
      onClose?.();
    }
  }

  function handleSelect() {
    setOpen(false);
    onClose?.();
  }

  const hasResults = results && (results.products.length > 0 || results.collections.length > 0 || results.queries.length > 0);

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-black/20 py-3 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-black/40"
          autoComplete="off"
          autoFocus
        />
        {loading && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          </div>
        )}
      </form>

      {/* Dropdown */}
      {open && (query.length >= 2) && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-black/10 shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {hasResults ? (
            <div className="p-4 space-y-6">
              {/* Query suggestions */}
              {results!.queries.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-black/50 mb-3">
                    Suggested Searches
                  </p>
                  <div className="space-y-2">
                    {results!.queries.slice(0, 4).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(q.text);
                          navigate('/search?q=' + encodeURIComponent(q.text));
                          handleSelect();
                        }}
                        className="block w-full text-left text-sm hover:text-black/60 transition-colors"
                      >
                        {q.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product suggestions */}
              {results!.products.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-black/50 mb-3">
                    Products
                  </p>
                  <div className="space-y-3">
                    {results!.products.slice(0, 6).map((product) => (
                      <Link
                        key={product.id}
                        to={`/products/${product.handle}`}
                        onClick={handleSelect}
                        className="flex gap-3 hover:bg-[#fafafa] -mx-2 px-2 py-1.5 transition-colors"
                      >
                        {product.image?.url ? (
                          <div className="w-12 h-14 bg-[#f5f5f5] shrink-0 overflow-hidden">
                            <img
                              src={product.image.url}
                              alt={product.image.altText || product.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-14 bg-[#f5f5f5] shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight line-clamp-2">
                            {product.title}
                          </p>
                          <p className="text-xs text-black/50 mt-0.5">
                            ${product.price.minVariantPrice.amount}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Collection suggestions */}
              {results!.collections.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-black/50 mb-3">
                    Collections
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {results!.collections.slice(0, 4).map((col) => (
                      <Link
                        key={col.id}
                        to={`/collections/${col.handle}`}
                        onClick={handleSelect}
                        className="text-xs border border-black/10 px-3 py-1.5 hover:border-black transition-colors"
                      >
                        {col.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* View all results */}
              <div className="pt-2 border-t border-black/5">
                <Link
                  to={`/search?q=${encodeURIComponent(query)}`}
                  onClick={handleSelect}
                  className="text-xs font-medium tracking-widest uppercase hover:opacity-70 transition-opacity"
                >
                  View all results →
                </Link>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="p-6 text-center">
                <p className="text-sm text-black/50">
                  No results for &ldquo;{query}&rdquo;
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
