import {useState, useEffect, useRef} from 'react';
import {Link, useNavigate} from 'react-router';
import {Image} from '@shopify/hydrogen';

interface PredictiveProduct {
  id: string;
  title: string;
  handle: string;
  vendor?: string | null;
  featuredImage?: {url: string; altText?: string | null} | null;
  priceRange: {
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
 * Predictive search typeahead component (dark theme).
 *
 * Fetches real-time suggestions from Shopify's Predictive Search API
 * as the user types. Shows products, collections, and query suggestions.
 */
const LISTBOX_ID = 'search-typeahead-listbox';

export default function SearchTypeahead({
  placeholder = 'Search products...',
  onClose,
}: SearchTypeaheadProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PredictiveResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
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
    setActiveIndex(-1);
    onClose?.();
  }

  const hasResults = results && (results.products.length > 0 || results.collections.length > 0 || results.queries.length > 0);
  const itemCount = hasResults
    ? results!.queries.slice(0, 4).length +
      results!.products.slice(0, 6).length +
      results!.collections.slice(0, 4).length +
      1 // "View all results" link
    : 0;

  // Reset the active option whenever the result set changes so a stale
  // index from a previous query doesn't point at the wrong item.
  useEffect(() => {
    setActiveIndex(-1);
    itemRefs.current = [];
  }, [results]);

  useEffect(() => {
    if (activeIndex >= 0) {
      itemRefs.current[activeIndex]?.scrollIntoView({block: 'nearest'});
    }
  }, [activeIndex]);

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || itemCount === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % itemCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? itemCount - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      itemRefs.current[activeIndex]?.click();
    }
  }

  let itemIndex = -1;
  function registerItem() {
    itemIndex += 1;
    const i = itemIndex;
    return {
      id: `search-typeahead-item-${i}`,
      ref: (el: HTMLElement | null) => {
        itemRefs.current[i] = el;
      },
      'aria-selected': activeIndex === i,
      'data-active': activeIndex === i || undefined,
    };
  }

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-[var(--color-border-medium)] py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors placeholder:text-[var(--color-text-tertiary)]"
          autoComplete="off"
          autoFocus
          aria-label="Search"
          role="combobox"
          aria-expanded={open && (query.length >= 2)}
          aria-controls={LISTBOX_ID}
          aria-activedescendant={activeIndex >= 0 ? `search-typeahead-item-${activeIndex}` : undefined}
        />
        {loading && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[var(--color-border-medium)] border-t-[var(--color-accent)] rounded-full animate-spin" />
          </div>
        )}
      </form>

      {/* Dropdown */}
      {open && (query.length >= 2) && (
        <div
          id={LISTBOX_ID}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full mt-2 bg-[var(--color-bg-level-1)] border border-[var(--color-border-muted)] shadow-xl z-50 max-h-[420px] overflow-y-auto rounded-md"
        >
          {hasResults ? (
            <div className="p-4 space-y-5">
              {/* Query suggestions */}
              {results!.queries.length > 0 && (
                <div>
                  <p className="h-eyebrow text-[var(--color-text-tertiary)] mb-3">
                    Suggested Searches
                  </p>
                  <div className="space-y-2">
                    {results!.queries.slice(0, 4).map((q, i) => {
                      const item = registerItem();
                      return (
                      <button
                        key={i}
                        {...item}
                        role="option"
                        onClick={() => {
                          setQuery(q.text);
                          navigate('/search?q=' + encodeURIComponent(q.text));
                          handleSelect();
                        }}
                        className={`block w-full text-left text-sm text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors rounded-sm px-1 -mx-1 ${item['aria-selected'] ? 'bg-[var(--color-bg-level-2)] text-[var(--color-accent)]' : ''}`}
                      >
                        {q.text}
                      </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product suggestions */}
              {results!.products.length > 0 && (
                <div>
                  <p className="h-eyebrow text-[var(--color-text-tertiary)] mb-3">
                    Products
                  </p>
                  <div className="space-y-3">
                    {results!.products.slice(0, 6).map((product) => {
                      const item = registerItem();
                      return (
                      <Link
                        key={product.id}
                        to={`/products/${product.handle}`}
                        onClick={handleSelect}
                        {...item}
                        role="option"
                        className={`flex gap-3 hover:bg-[var(--color-bg-level-2)] -mx-2 px-2 py-1.5 transition-colors rounded-sm ${item['aria-selected'] ? 'bg-[var(--color-bg-level-2)]' : ''}`}
                      >
                        {product.featuredImage?.url ? (
                          <div className="w-12 h-14 bg-[var(--color-bg-level-2)] shrink-0 overflow-hidden rounded-sm">
                            <img
                              src={product.featuredImage.url}
                              alt={product.featuredImage.altText || product.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-14 bg-[var(--color-bg-level-2)] shrink-0 rounded-sm" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--color-text-primary)] leading-tight h-truncate-2">
                            {product.title}
                          </p>
                          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                            ${product.priceRange.minVariantPrice.amount}
                          </p>
                        </div>
                      </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Collection suggestions */}
              {results!.collections.length > 0 && (
                <div>
                  <p className="h-eyebrow text-[var(--color-text-tertiary)] mb-3">
                    Collections
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {results!.collections.slice(0, 4).map((col) => {
                      const item = registerItem();
                      return (
                      <Link
                        key={col.id}
                        to={`/collections/${col.handle}`}
                        onClick={handleSelect}
                        {...item}
                        role="option"
                        className={`text-xs border border-[var(--color-border-medium)] px-3 py-1.5 text-[var(--color-text-secondary)] hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] transition-colors rounded-md ${item['aria-selected'] ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)] bg-[var(--color-bg-level-2)]' : ''}`}
                      >
                        {col.title}
                      </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View all results */}
              <div className="pt-2 border-t border-[var(--color-border-muted)]">
                {(() => {
                  const item = registerItem();
                  return (
                    <Link
                      to={`/search?q=${encodeURIComponent(query)}`}
                      onClick={handleSelect}
                      {...item}
                      role="option"
                      className={`text-xs font-semibold tracking-[0.12em] uppercase text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors ${item['aria-selected'] ? 'text-[var(--color-accent)]' : ''}`}
                    >
                      View all results →
                    </Link>
                  );
                })()}
              </div>
            </div>
          ) : (
            !loading && (
              <div className="p-6 text-center">
                <p className="text-sm text-[var(--color-text-tertiary)]">
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
