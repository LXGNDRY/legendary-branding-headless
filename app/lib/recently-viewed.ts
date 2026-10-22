export interface RecentProduct {
  id: string;
  handle: string;
  title: string;
  image?: string;
  /** Rating snapshot at the time this product was viewed. */
  rating?: number;
  reviewCount?: number;
}

export const RECENT_COOKIE_NAME = 'recently_viewed';
export const MAX_RECENT_PRODUCTS = 8;
/** Browsers reject cookies over ~4096 bytes; keep the encoded value well under it. */
export const MAX_ENCODED_COOKIE_LENGTH = 3600;

const HANDLE = /^[a-z0-9][a-z0-9_-]{0,254}$/i;

function text(value: unknown, max: number): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value.slice(0, max) : undefined;
}

function httpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 400) return undefined;
  try {
    return new URL(value).protocol === 'https:' ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Validates untrusted cookie data into recent products; never throws. */
export function parseRecentProducts(raw: unknown): RecentProduct[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: RecentProduct[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const {id, handle, title, image, rating, reviewCount} = item as Record<string, unknown>;
    const cleanId = text(id, 100);
    const cleanTitle = text(title, 120);
    if (!cleanId || !cleanTitle || typeof handle !== 'string' || !HANDLE.test(handle) || seen.has(cleanId)) continue;
    seen.add(cleanId);
    const product: RecentProduct = {id: cleanId, handle, title: cleanTitle};
    const cleanImage = httpsUrl(image);
    if (cleanImage) product.image = cleanImage;
    if (typeof rating === 'number' && rating >= 0 && rating <= 5) product.rating = rating;
    if (typeof reviewCount === 'number' && Number.isInteger(reviewCount) && reviewCount >= 0) {
      product.reviewCount = reviewCount;
    }
    out.push(product);
    if (out.length >= MAX_RECENT_PRODUCTS) break;
  }
  return out;
}

/** Reads the raw cookie value for the list. Malformed escapes yield []. */
export function readRecentProducts(cookieHeader: string): RecentProduct[] {
  const match = cookieHeader.match(new RegExp(`(?:^|; ?)${RECENT_COOKIE_NAME}=([^;]+)`));
  if (!match) return [];
  try {
    return parseRecentProducts(JSON.parse(decodeURIComponent(match[1])));
  } catch {
    return [];
  }
}

/** Serializes newest-first, dropping the oldest entries until the cookie fits. */
export function serializeRecentProducts(products: RecentProduct[]): string {
  const list = products.slice(0, MAX_RECENT_PRODUCTS);
  while (list.length > 0 && encodeURIComponent(JSON.stringify(list)).length > MAX_ENCODED_COOKIE_LENGTH) {
    list.pop();
  }
  return JSON.stringify(list);
}
