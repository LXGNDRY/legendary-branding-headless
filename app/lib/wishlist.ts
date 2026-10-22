/**
 * Wishlist data contract shared by the browser provider, the sync API and the
 * wishlist page. Only product IDENTITY is stored: price, availability, title
 * and imagery come from the live Storefront API in the shopper's active market.
 */
export interface WishlistEntry {
  /** Product GID, e.g. gid://shopify/Product/123 */
  id: string;
  handle: string;
  addedAt: number;
}

export const MAX_WISHLIST_ITEMS = 100;
/** A full list of 100 identity entries is ~10 KB; anything near this is abuse. */
export const MAX_WISHLIST_BODY_BYTES = 32 * 1024;
export const STORAGE_VERSION = 2;
export const STORAGE_TTL_MS = 30 * 864e5;

const PRODUCT_GID = /^gid:\/\/shopify\/Product\/\d{1,20}$/;
const HANDLE = /^[a-z0-9][a-z0-9_-]{0,254}$/i;

/**
 * Validates untrusted wishlist data (storage, request body, metafield) down to
 * identity entries. Legacy items that also carried title/price/image are
 * migrated by dropping the extra fields. Invalid entries are skipped and
 * duplicates collapse to the earliest `addedAt`.
 */
export function parseWishlistEntries(input: unknown, now = Date.now()): WishlistEntry[] {
  if (!Array.isArray(input)) return [];
  const byHandle = new Map<string, WishlistEntry>();
  for (const raw of input) {
    if (typeof raw !== 'object' || raw === null) continue;
    const {id, handle, addedAt} = raw as Record<string, unknown>;
    if (typeof id !== 'string' || !PRODUCT_GID.test(id)) continue;
    if (typeof handle !== 'string' || !HANDLE.test(handle)) continue;
    const time = typeof addedAt === 'number' && Number.isFinite(addedAt) && addedAt > 0 ? Math.min(addedAt, now) : now;
    const key = handle.toLowerCase();
    const existing = byHandle.get(key);
    if (!existing || time < existing.addedAt) byHandle.set(key, {id, handle, addedAt: time});
    if (byHandle.size >= MAX_WISHLIST_ITEMS * 2) break;
  }
  return [...byHandle.values()].sort((a, b) => a.addedAt - b.addedAt).slice(0, MAX_WISHLIST_ITEMS);
}

/** Union of two lists by handle, keeping the older `addedAt`. */
export function mergeWishlists(a: WishlistEntry[], b: WishlistEntry[]): WishlistEntry[] {
  return parseWishlistEntries([...a, ...b]);
}

export function sameWishlist(a: WishlistEntry[], b: WishlistEntry[]): boolean {
  if (a.length !== b.length) return false;
  const keys = new Set(a.map((item) => item.handle.toLowerCase()));
  return b.every((item) => keys.has(item.handle.toLowerCase()));
}

/** Parses the browser-storage value. Never throws; corrupt or expired data yields []. */
export function parseStoredWishlist(raw: string | null, now = Date.now()): WishlistEntry[] {
  if (!raw || raw.length > MAX_WISHLIST_BODY_BYTES) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return [];
    const {items, savedAt} = data as {items?: unknown; savedAt?: unknown};
    if (typeof savedAt === 'number' && now - savedAt > STORAGE_TTL_MS) return [];
    return parseWishlistEntries(items, now);
  } catch {
    return [];
  }
}

export function serializeWishlist(items: WishlistEntry[], now = Date.now()): string {
  return JSON.stringify({v: STORAGE_VERSION, items, savedAt: now});
}
