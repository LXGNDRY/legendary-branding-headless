import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {
  mergeWishlists,
  parseStoredWishlist,
  parseWishlistEntries,
  sameWishlist,
  serializeWishlist,
  type WishlistEntry,
} from '~/lib/wishlist';

/**
 * Wishlist context.
 *
 * - Guests: identity-only list in localStorage (30-day TTL, schema-validated).
 * - Logged-in shoppers: the Customer Account metafield (custom.wishlist) is the
 *   source of truth. The list is READ and merged with any guest items before
 *   anything is written, so a slow or failed read can never overwrite it.
 * - Account items are never written to browser storage, so logging out or
 *   switching accounts cannot copy one account's list into another.
 * - Write failures are retried and surfaced (`syncStatus: 'error'`); local
 *   edits are kept either way.
 */

export type WishlistSyncStatus = 'guest' | 'loading' | 'ready' | 'error';

type WishlistInput = Pick<WishlistEntry, 'id' | 'handle'>;

interface WishlistContextValue {
  items: WishlistEntry[];
  count: number;
  isInWishlist: (handle: string) => boolean;
  add: (item: WishlistInput) => void;
  remove: (handle: string) => void;
  toggle: (item: WishlistInput) => void;
  clear: () => void;
  isLoading: boolean;
  syncStatus: WishlistSyncStatus;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

const STORAGE_KEY = 'lb_wishlist';
const SYNC_DEBOUNCE_MS = 500;
const MAX_ATTEMPTS = 5;

function retryDelay(attempt: number) {
  return Math.min(30_000, 2_000 * 2 ** attempt);
}

function readGuestWishlist(): WishlistEntry[] {
  try {
    return parseStoredWishlist(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function writeGuestWishlist(items: WishlistEntry[]) {
  try {
    if (items.length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, serializeWishlist(items));
  } catch {
    // Storage full, disabled or denied — the in-memory list still works.
  }
}

function clearGuestWishlist() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface WishlistProviderProps {
  children: ReactNode;
  /** Whether the current user is logged in (from root loader) */
  isLoggedIn?: boolean;
}

export function WishlistProvider({children, isLoggedIn = false}: WishlistProviderProps) {
  const [items, setItems] = useState<WishlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serverReady, setServerReady] = useState(false);
  const [syncError, setSyncError] = useState(false);
  // Counts local edits (and merges) that still need to be written to the account.
  const [revision, setRevision] = useState(0);

  const itemsRef = useRef(items);
  const dirtyRef = useRef(false);
  const revisionRef = useRef(0);
  const serverReadyRef = useRef(false);
  const removedWhileLoadingRef = useRef(new Set<string>());
  const clearedWhileLoadingRef = useRef(false);
  const wasLoggedInRef = useRef(isLoggedIn);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    serverReadyRef.current = serverReady;
  }, [serverReady]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    revisionRef.current += 1;
    setRevision(revisionRef.current);
  }, []);

  // Load the browser list on mount (guest items, or guest items made before login).
  useEffect(() => {
    setItems(readGuestWishlist());
    setIsLoading(false);
  }, []);

  // Guests: persist locally and follow edits made in other tabs.
  useEffect(() => {
    // NOTE: skipped on the logout render, where `items` is still the account list.
    if (isLoading || isLoggedIn || wasLoggedInRef.current) return;
    writeGuestWishlist(items);
  }, [items, isLoading, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) return;
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY || event.key === null) setItems(readGuestWishlist());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [isLoggedIn]);

  // Logging out drops the account list from memory; only guest data remains.
  useEffect(() => {
    if (wasLoggedInRef.current && !isLoggedIn) {
      dirtyRef.current = false;
      removedWhileLoadingRef.current.clear();
      clearedWhileLoadingRef.current = false;
      setItems(readGuestWishlist());
    }
    wasLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  // Logged in: READ the account list, merge, and only then allow writes.
  useEffect(() => {
    if (isLoading || !isLoggedIn) {
      setServerReady(false);
      setSyncError(false);
      return;
    }
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    async function load() {
      try {
        const res = await fetch('/api/wishlist', {credentials: 'same-origin', signal: controller.signal});
        if (!res.ok) throw new Error(`wishlist read ${res.status}`);
        const data = (await res.json()) as {items?: unknown};
        if (controller.signal.aborted) return;

        let server = parseWishlistEntries(data.items);
        if (clearedWhileLoadingRef.current) server = [];
        server = server.filter((item) => !removedWhileLoadingRef.current.has(item.handle.toLowerCase()));
        const merged = clearedWhileLoadingRef.current ? itemsRef.current : mergeWishlists(itemsRef.current, server);

        removedWhileLoadingRef.current.clear();
        clearedWhileLoadingRef.current = false;
        setItems(merged);
        setSyncError(false);
        setServerReady(true);
        if (!sameWishlist(merged, server)) markDirty();
      } catch {
        if (controller.signal.aborted) return;
        setSyncError(true);
        if (attempt < MAX_ATTEMPTS) {
          timer = setTimeout(load, retryDelay(attempt));
          attempt += 1;
        }
      }
    }

    load();
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
      setServerReady(false);
    };
  }, [isLoggedIn, isLoading, markDirty]);

  // Logged in: adopt changes made in another tab when nothing is unsynced here.
  useEffect(() => {
    if (!isLoggedIn || !serverReady) return;
    const controller = new AbortController();
    async function refresh() {
      if (document.visibilityState !== 'visible' || dirtyRef.current) return;
      try {
        const res = await fetch('/api/wishlist', {credentials: 'same-origin', signal: controller.signal});
        if (!res.ok) return;
        const data = (await res.json()) as {items?: unknown};
        if (controller.signal.aborted || dirtyRef.current) return;
        setItems(parseWishlistEntries(data.items));
      } catch {
        // Keep the current list; the next focus will try again.
      }
    }
    document.addEventListener('visibilitychange', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      controller.abort();
    };
  }, [isLoggedIn, serverReady]);

  // Logged in: debounced write, only after the read finished.
  useEffect(() => {
    if (!isLoggedIn || !serverReady || revision === 0 || !dirtyRef.current) return;
    const controller = new AbortController();
    const thisRevision = revision;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    async function push() {
      try {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({items: itemsRef.current}),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`wishlist write ${res.status}`);
        if (controller.signal.aborted) return;
        setSyncError(false);
        if (revisionRef.current === thisRevision) dirtyRef.current = false;
        // Guest items made before login now live on the account.
        clearGuestWishlist();
      } catch {
        if (controller.signal.aborted) return;
        setSyncError(true);
        if (attempt < MAX_ATTEMPTS) {
          timer = setTimeout(push, retryDelay(attempt));
          attempt += 1;
        }
      }
    }

    timer = setTimeout(push, SYNC_DEBOUNCE_MS);
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [revision, serverReady, isLoggedIn]);

  const isInWishlist = useCallback(
    (handle: string) => items.some((item) => item.handle.toLowerCase() === handle.toLowerCase()),
    [items],
  );

  const forget = useCallback(
    (handle: string) => {
      const key = handle.toLowerCase();
      if (!serverReadyRef.current) removedWhileLoadingRef.current.add(key);
      setItems((prev) => prev.filter((item) => item.handle.toLowerCase() !== key));
      markDirty();
    },
    [markDirty],
  );

  const add = useCallback(
    (item: WishlistInput) => {
      const [entry] = parseWishlistEntries([{id: item.id, handle: item.handle, addedAt: Date.now()}]);
      if (!entry) return;
      removedWhileLoadingRef.current.delete(entry.handle.toLowerCase());
      setItems((prev) => (prev.some((i) => i.handle.toLowerCase() === entry.handle.toLowerCase()) ? prev : [...prev, entry]));
      markDirty();
    },
    [markDirty],
  );

  const remove = forget;

  const toggle = useCallback(
    (item: WishlistInput) => {
      if (itemsRef.current.some((i) => i.handle.toLowerCase() === item.handle.toLowerCase())) forget(item.handle);
      else add(item);
    },
    [add, forget],
  );

  const clear = useCallback(() => {
    if (!serverReadyRef.current) clearedWhileLoadingRef.current = true;
    setItems([]);
    markDirty();
  }, [markDirty]);

  const syncStatus: WishlistSyncStatus = !isLoggedIn ? 'guest' : syncError ? 'error' : serverReady ? 'ready' : 'loading';

  return (
    <WishlistContext.Provider
      value={{items, count: items.length, isInWishlist, add, remove, toggle, clear, isLoading, syncStatus}}
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
