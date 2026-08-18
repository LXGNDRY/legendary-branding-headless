import {createContext, useContext, useEffect, useState, useCallback, useRef} from 'react';
import type {ReactNode} from 'react';

/**
 * Wishlist context — localStorage for guests, synced to Customer Account
 * metafield (custom.wishlist) when logged in.
 *
 * Behavior:
 * - Guest users: localStorage only (30-day TTL)
 * - Logged-in users: server sync via /api/wishlist on mount and on change
 * - On login: merges local wishlist items into the server wishlist
 * - Logout clears in-memory state; localStorage stays as fallback
 *
 * Usage:
 *   const {items, isInWishlist, add, remove, toggle, count} = useWishlist();
 */

interface WishlistItem {
  id: string;
  handle: string;
  title: string;
  price: string;
  image?: string;
  addedAt: number;
}

interface WishlistContextValue {
  items: WishlistItem[];
  count: number;
  isInWishlist: (handle: string) => boolean;
  add: (item: Omit<WishlistItem, 'addedAt'>) => void;
  remove: (handle: string) => void;
  toggle: (item: Omit<WishlistItem, 'addedAt'>) => void;
  clear: () => void;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

const STORAGE_KEY = 'lb_wishlist';
const STORAGE_TTL_DAYS = 30;

function loadWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as {items: WishlistItem[]; savedAt: number};
    // Expire after 30 days
    if (data.savedAt && Date.now() - data.savedAt > STORAGE_TTL_DAYS * 864e5) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return data.items || [];
  } catch {
    return [];
  }
}

function saveWishlist(items: WishlistItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({items, savedAt: Date.now()}),
    );
  } catch {
    // Storage full or disabled — fail silently
  }
}

/**
 * Merge two wishlists by handle, keeping the older addedAt for duplicates.
 */
function mergeWishlists(a: WishlistItem[], b: WishlistItem[]): WishlistItem[] {
  const map = new Map<string, WishlistItem>();
  for (const item of [...a, ...b]) {
    const existing = map.get(item.handle);
    if (!existing || item.addedAt < existing.addedAt) {
      map.set(item.handle, item);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.addedAt - b.addedAt);
}

interface WishlistProviderProps {
  children: ReactNode;
  /** Whether the current user is logged in (from root loader) */
  isLoggedIn?: boolean;
}

export function WishlistProvider({children, isLoggedIn = false}: WishlistProviderProps) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoggedInRef = useRef(isLoggedIn);
  const didInitialFetchRef = useRef(false);

  // Track isLoggedIn in a ref so the debounced sync can check it
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  // Phase 1: load from localStorage immediately on mount (always)
  useEffect(() => {
    setItems(loadWishlist());
    setIsLoading(false);
  }, []);

  // Phase 2: when user logs in, fetch server wishlist and merge with local
  useEffect(() => {
    if (!isLoggedIn || didInitialFetchRef.current) return;

    let cancelled = false;
    didInitialFetchRef.current = true;

    async function fetchServerWishlist() {
      try {
        const res = await fetch('/api/wishlist', {
          credentials: 'same-origin',
        });
        if (!res.ok) return; // guest or error — keep local
        const data = (await res.json()) as {items?: WishlistItem[]};
        if (!data.items) return;

        setItems((prevLocal) => mergeWishlists(prevLocal, data.items!));
      } catch {
        // Network error — keep localStorage as source of truth
      }
    }

    fetchServerWishlist();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  // Phase 3: always persist to localStorage
  useEffect(() => {
    if (isLoading) return;
    saveWishlist(items);
  }, [items, isLoading]);

  // Phase 4: debounced server sync when logged in and items change
  useEffect(() => {
    if (isLoading || !isLoggedInRef.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/wishlist', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({items}),
        });
      } catch {
        // Sync failure is non-critical — localStorage has the truth
      }
    }, 500);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [items, isLoading]);

  const isInWishlist = useCallback(
    (handle: string) => items.some((item) => item.handle === handle),
    [items],
  );

  const add = useCallback((item: Omit<WishlistItem, 'addedAt'>) => {
    setItems((prev) => {
      if (prev.some((i) => i.handle === item.handle)) return prev;
      return [...prev, {...item, addedAt: Date.now()}];
    });
  }, []);

  const remove = useCallback((handle: string) => {
    setItems((prev) => prev.filter((item) => item.handle !== handle));
  }, []);

  const toggle = useCallback((item: Omit<WishlistItem, 'addedAt'>) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.handle === item.handle);
      if (exists) {
        return prev.filter((i) => i.handle !== item.handle);
      }
      return [...prev, {...item, addedAt: Date.now()}];
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <WishlistContext.Provider
      value={{
        items,
        count: items.length,
        isInWishlist,
        add,
        remove,
        toggle,
        clear,
        isLoading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return ctx;
}
