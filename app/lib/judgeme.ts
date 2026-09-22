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
  /** 1-indexed page number; defaults to Judge.me's own default (page 1). */
  page?: number;
}

/**
 * Shared request/parse core for the Judge.me reviews endpoint. Always
 * degrades to an empty list rather than throwing -- a failed third-party
 * fetch should never break the page it's decorating.
 *
 * Judge.me's `product_id` filter takes their own internal product record
 * ID, not the platform's (Shopify's) product ID -- there is no documented,
 * verifiable public endpoint to resolve one to the other, so this
 * deliberately does NOT attempt to filter server-side by product. See
 * fetchJudgemeProductReviews for how a single product's reviews are
 * found instead (paginating this endpoint and filtering by product_handle,
 * which every review response row does carry).
 */
async function fetchJudgemeReviewsRaw({
  apiToken,
  shopDomain,
  perPage,
  page,
}: FetchJudgemeReviewsRawOptions): Promise<JudgemeApiReview[]> {
  const url = new URL(JUDGEME_API_BASE);
  url.searchParams.set('api_token', apiToken);
  url.searchParams.set('shop_domain', shopDomain);
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('published', 'true');
  if (page) url.searchParams.set('page', String(page));

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
  /** Only reviews for this product are returned (matched by handle). */
  productHandle: string;
  perPage?: number;
  /** How many 100-review pages of the shop's reviews to search across, in parallel. */
  maxPages?: number;
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
 * There's no reliable way to filter this server-side to one product: the
 * reviews endpoint's `product_id` parameter takes Judge.me's own internal
 * product record ID, not the Shopify product ID (confirmed via Judge.me's
 * help docs and third-party API references) -- there's no documented,
 * verifiable public endpoint to resolve one to the other, and passing a
 * mismatched value there isn't even an error, it silently falls back to
 * every review in the store. So this instead pages through the shop's
 * reviews (in parallel, bounded by maxPages) and filters by product_handle,
 * which every review response row does carry -- fine as long as maxPages
 * covers the store's total review volume; a store that outgrows this needs
 * a bigger maxPages, not a different approach (see Codex findings on
 * PR #200 for the product_id dead end and the earlier per_page=100-single-
 * page version's undersized page count).
 */
export async function fetchJudgemeProductReviews({
  apiToken,
  shopDomain,
  productHandle,
  perPage = 100,
  maxPages = 5,
}: FetchJudgemeProductReviewsOptions): Promise<JudgemeReview[]> {
  const pages = await Promise.all(
    Array.from({length: maxPages}, (_, i) =>
      fetchJudgemeReviewsRaw({apiToken, shopDomain, perPage, page: i + 1}),
    ),
  );
  // Dedup by id -- pagination could theoretically overlap if the shop's
  // review set shifts between the parallel page requests.
  const reviews = [...new Map(pages.flat().map((r) => [r.id, r])).values()];

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
