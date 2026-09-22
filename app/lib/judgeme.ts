/**
 * Judge.me public API client — server-only.
 *
 * Fetches real, individual review text (not just the aggregate rating/count
 * already available via the synced `judgeme.badge`/`judgeme.widget`
 * metafields) so the storefront can render its own quote cards instead of
 * Judge.me's stock widget. Requires a private API token; degrades to an
 * empty list rather than throwing if the token is unset or the API call
 * fails, matching the same "never simulate success, never break the page"
 * pattern used for the Klaviyo integration.
 */

const JUDGEME_API_BASE = 'https://judge.me/api/v1/reviews';

/**
 * Judge.me's badge metafield embeds the product's real synced rating as
 * HTML attributes (e.g. data-average-rating='4.8' data-number-of-reviews='23').
 * Judge.me emits these with single quotes, so both quote styles are accepted.
 * Shared by every surface that reads this metafield (homepage aggregate,
 * product cards) so the parsing logic exists in exactly one place.
 */
export function parseJudgemeBadge(
  html: string | null | undefined,
): {rating: number; count: number} | null {
  if (!html) return null;
  const rating = html.match(/data-average-rating=["']([\d.]+)["']/)?.[1];
  const count = html.match(/data-number-of-reviews=["'](\d+)["']/)?.[1];
  if (!rating || !count) return null;
  const parsedCount = parseInt(count, 10);
  if (parsedCount <= 0) return null;
  return {rating: parseFloat(rating), count: parsedCount};
}

export interface JudgemeQuote {
  id: number;
  rating: number;
  title?: string;
  body: string;
  /** First name + last-initial only -- never the customer's full name. */
  reviewerName: string;
  productHandle?: string;
}

/** A single review rendered in full on a product page (see fetchJudgemeProductReviews). */
export interface JudgemeReview {
  id: number;
  rating: number;
  title?: string;
  body: string;
  reviewerName: string;
  createdAt?: string;
}

interface JudgemeApiReview {
  id: number;
  rating: number;
  title?: string | null;
  body?: string | null;
  hidden?: boolean;
  curated?: string | null;
  reviewer?: {name?: string | null} | null;
  product_handle?: string | null;
  created_at?: string | null;
}

interface JudgemeApiResponse {
  reviews?: JudgemeApiReview[];
}

/**
 * "Jordan Alvarez" -> "Jordan A." -- never expose a customer's full name.
 * A single-token name (common for CJK names entered with no whitespace,
 * or just a first name) has no separate surname to mask, so it falls back
 * to a generic label rather than ever rendering the name unmasked.
 */
function toDisplayName(fullName: string | null | undefined): string {
  const trimmed = (fullName ?? '').trim();
  if (!trimmed) return 'Customer';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return 'Customer';
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

interface FetchJudgemeReviewsRawOptions {
  apiToken: string;
  shopDomain: string;
  perPage: number;
  /** Shopify product ID (numeric, as a string) to filter server-side to a single product's reviews. */
  productId?: string;
}

/**
 * Shared request/parse core for the Judge.me reviews endpoint. Always
 * degrades to an empty list rather than throwing -- a failed third-party
 * fetch should never break the page it's decorating.
 */
async function fetchJudgemeReviewsRaw({
  apiToken,
  shopDomain,
  perPage,
  productId,
}: FetchJudgemeReviewsRawOptions): Promise<JudgemeApiReview[]> {
  const url = new URL(JUDGEME_API_BASE);
  url.searchParams.set('api_token', apiToken);
  url.searchParams.set('shop_domain', shopDomain);
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('published', 'true');
  if (productId) url.searchParams.set('product_id', productId);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      // Cloudflare Workers edge cache -- avoid hitting Judge.me on every
      // request; an hour-stale review list is a non-issue for this content.
      cf: {cacheTtl: 3600, cacheEverything: true},
    } as RequestInit);
  } catch (error) {
    console.error('[judgeme] request failed', error);
    return [];
  }

  if (!response.ok) {
    console.error(`[judgeme] API responded with ${response.status}`);
    return [];
  }

  try {
    const data = (await response.json()) as JudgemeApiResponse;
    return (data.reviews ?? []).filter((r) => !r.hidden && typeof r.rating === 'number');
  } catch (error) {
    console.error('[judgeme] failed to parse response', error);
    return [];
  }
}

interface FetchJudgemeQuotesOptions {
  apiToken: string;
  shopDomain: string;
  /** Only include reviews at or above this rating. Defaults to 4. */
  minRating?: number;
  /** Only include reviews with at least this many characters of body text. */
  minBodyLength?: number;
  perPage?: number;
}

export async function fetchJudgemeQuotes({
  apiToken,
  shopDomain,
  minRating = 4,
  minBodyLength = 20,
  perPage = 20,
}: FetchJudgemeQuotesOptions): Promise<JudgemeQuote[]> {
  const reviews = await fetchJudgemeReviewsRaw({apiToken, shopDomain, perPage});

  return reviews
    .filter(
      (r) => r.rating >= minRating && (r.body ?? '').trim().length >= minBodyLength,
    )
    .map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title?.trim() || undefined,
      body: r.body!.trim(),
      reviewerName: toDisplayName(r.reviewer?.name),
      productHandle: r.product_handle ?? undefined,
    }));
}

interface FetchJudgemeProductReviewsOptions {
  apiToken: string;
  shopDomain: string;
  /** Shopify product ID (numeric, as a string) -- filters server-side via Judge.me's `product_id` param. */
  productId: string;
  /** Belt-and-suspenders check against the returned rows; see below. */
  productHandle: string;
  perPage?: number;
}

/**
 * Full review list for a single product's page.
 *
 * Judge.me's Shopify app used to sync a self-contained "widget" metafield
 * (pre-rendered HTML + a client-side script that unhid it) that this
 * storefront rendered directly via dangerouslySetInnerHTML. Judge.me has
 * since retired that script (cdn.judge.me/widget_v3.js now returns
 * 410 Gone), and their replacement loader uses an incompatible DOM
 * contract -- so instead of depending on their client-side embed at all,
 * this fetches real review data server-side (same API already used for
 * fetchJudgemeQuotes) and the storefront renders its own list.
 *
 * Filters server-side via Judge.me's `product_id` param (the Shopify
 * product's numeric ID) rather than pulling one page of the whole shop's
 * reviews and filtering by handle client-side, as this used to: at this
 * store's total review volume (a few hundred across ~16+ products), a
 * single 100-review page reliably missed products whose reviews weren't
 * in it -- confirmed live in production (a product's own compact rating
 * badge showed real data from the Storefront API metafield, while this
 * function's shop-wide-then-filter approach returned an empty list for
 * that same product). The product_handle filter below is kept as a
 * defensive check against the API returning something unexpected for an
 * unrecognized/misnamed param, not as the primary filter.
 */
export async function fetchJudgemeProductReviews({
  apiToken,
  shopDomain,
  productId,
  productHandle,
  perPage = 50,
}: FetchJudgemeProductReviewsOptions): Promise<JudgemeReview[]> {
  const reviews = await fetchJudgemeReviewsRaw({apiToken, shopDomain, perPage, productId});

  return reviews
    .filter((r) => r.product_handle === productHandle && (r.body ?? '').trim().length > 0)
    .map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title?.trim() || undefined,
      body: r.body!.trim(),
      reviewerName: toDisplayName(r.reviewer?.name),
      createdAt: r.created_at ?? undefined,
    }));
}
