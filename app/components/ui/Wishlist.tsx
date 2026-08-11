import {createContext, useContext, useEffect, useState, useCallback} from 'react';
import type {ReactNode} from 'react';

/**
 * Wishlist context — client-side, localStorage-persisted.
 *
 * Stores product handles + minimal info locally for 30 days.
 * For logged-in customers, could be synced to Shopify customer metafields.
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

interface WishlistProviderProps {
  children: ReactNode;
}

export function WishlistProvider({children}: WishlistProviderProps) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setItems(loadWishlist());
    setLoaded(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (loaded) {
      saveWishlist(items);
    }
  }, [items, loaded]);

  const isInWishlist = useCallback(
    (handle: string) => items.some(item => item.handle === handle),
    [items],
  );

  const add = useCallback((item: Omit<WishlistItem, 'addedAt'>) => {
    setItems(prev => {
      if (prev.some(i => i.handle === item.handle)) return prev;
      return [...prev, {...item, addedAt: Date.now()}];
    });
  }, []);

  const remove = useCallback((handle: string) => {
    setItems(prev => prev.filter(item => item.handle !== handle));
  }, []);

  const toggle = useCallback((item: Omit<WishlistItem, 'addedAt'>) => {
    setItems(prev => {
      const exists = prev.some(i => i.handle === item.handle);
      if (exists) {
        return prev.filter(i => i.handle !== item.handle);
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
