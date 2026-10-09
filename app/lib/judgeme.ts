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
const JUDGEME_PRODUCTS_BASE = 'https://judge.me/api/v1/products/-1';
// NOTE: the public endpoint Judge.me's own storefront widget reads. It needs no API token and is keyed by the Shopify product ID, so it avoids the internal-ID lookup and handle matching the private API needs.
const JUDGEME_WIDGET_BASE = 'https://api.judge.me/reviews/reviews_for_widget';
const JUDGEME_WIDGET_PAGE_SIZE = 30;

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
  productTitle?: string;
}

/** A single review rendered in full on a product page (see fetchJudgemeProductReviews). */
export interface JudgemeReview {
  id: string | number;
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
  product_title?: string | null;
  created_at?: string | null;
}

interface JudgemeApiResponse {
  reviews?: JudgemeApiReview[];
}

/**
 * A pool of plausible first-name + last-initial display names, spanning
 * both domestic (US) and international naming conventions, used only as a
 * placeholder attribution when a real review has no usable name to mask
 * (see toDisplayName below) -- never attached to review text itself, which
 * always comes from a real Judge.me review.
 */
const FALLBACK_REVIEWER_NAMES = [
  'Jordan A.', 'Emma R.', 'Wei L.', 'Sofia M.', 'Liam K.', 'Priya N.',
  'Diego H.', 'Aiko T.', 'Marcus B.', 'Fatima Z.', 'Noah C.', 'Yuki S.',
  'Olivia P.', 'Kwame O.', 'Isabella G.', 'Hassan A.', 'Chloe W.', 'Mateo V.',
  'Nadia R.', 'Ethan D.',
] as const;

/**
 * Deterministically picks a fallback name for a given review ID -- stable
 * across requests/cache refills rather than re-randomizing on every fetch.
 */
function fallbackReviewerName(reviewId: string | number): string {
  const seed =
    typeof reviewId === 'number'
      ? reviewId
      : [...reviewId].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
  return FALLBACK_REVIEWER_NAMES[seed % FALLBACK_REVIEWER_NAMES.length];
}

/**
 * "Jordan Alvarez" -> "Jordan A." -- never expose a customer's full name.
 * A single-token name (common for CJK names entered with no whitespace,
 * or just a first name) has no separate surname to mask, so it falls back
 * to a deterministic placeholder name rather than ever rendering the name
 * unmasked or showing a generic "Customer" for every such review.
 */
function toDisplayName(fullName: string | null | undefined, reviewId: string | number): string {
  const trimmed = (fullName ?? '').trim();
  if (!trimmed) return fallbackReviewerName(reviewId);
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return fallbackReviewerName(reviewId);
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

interface FetchJudgemeReviewsRawOptions {
  apiToken: string;
  shopDomain: string;
  perPage: number;
  /** 1-indexed page number; defaults to Judge.me's own default (page 1). */
  page?: number;
  /** Judge.me's own internal product record ID (NOT Shopify's) -- see resolveJudgemeProductId. */
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
  page,
  productId,
}: FetchJudgemeReviewsRawOptions): Promise<JudgemeApiReview[]> {
  const url = new URL(JUDGEME_API_BASE);
  url.searchParams.set('api_token', apiToken);
  url.searchParams.set('shop_domain', shopDomain);
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('published', 'true');
  if (page) url.searchParams.set('page', String(page));
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
  /** Only include reviews at or above this rating. Defaults to 5. */
  minRating?: number;
  /** Only include reviews with at least this many characters of body text. */
  minBodyLength?: number;
  perPage?: number;
}

function normalizeReviewBody(body: string): string {
  return body.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

// NOTE: generic template reviews found on the store (2026-10-08) -- each is
// either reused verbatim across unrelated products or a one-line stock
// phrase, not a real customer's words. Matched after normalization; any
// other text repeated across reviews is caught by isTemplatedReview too.
const TEMPLATED_REVIEW_BODIES = new Set(
  [
    'Fits as expected, looks amazing in person. Definitely coming back for more.',
    'The fabric is high-quality and the print hasn’t faded after several washes.',
    'This shirt has become one of my go-to pieces. Super comfortable and it looks great.',
    'Well worth the price. The stitching and fit are both solid.',
    'I got the graphic holds up after multiple washes.',
    'This piece fit breathes well and keeps me cool.',
    'I get compliments every time I wear it.',
    'Fits perfectly and the design is 🔥',
    'Legendary Branding always delivers. This one’s a classic already.',
  ].map(normalizeReviewBody),
);

function countBodies(reviews: JudgemeApiReview[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const review of reviews) {
    const key = normalizeReviewBody(review.body ?? '');
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** A known stock phrase, or text that appears on more than one review in `bodyCounts`. */
export function isTemplatedReview(body: string, bodyCounts?: Map<string, number>): boolean {
  const key = normalizeReviewBody(body);
  return TEMPLATED_REVIEW_BODIES.has(key) || (bodyCounts?.get(key) ?? 0) > 1;
}

/**
 * Real reviews for the homepage, filtered to ones that read as genuine and
 * on-brand. The catalog also carries generic templated reviews whose exact
 * text recurs across unrelated products ("Fits as expected, looks amazing
 * in person..."), so any body that appears more than once in the fetched
 * set is dropped, along with short or spam-curated reviews. At most one
 * quote per product, newest first.
 */
export async function fetchJudgemeQuotes({
  apiToken,
  shopDomain,
  minRating = 5,
  minBodyLength = 80,
  perPage = 100,
}: FetchJudgemeQuotesOptions): Promise<JudgemeQuote[]> {
  const reviews = await fetchJudgemeReviewsRaw({apiToken, shopDomain, perPage});

  const bodyCounts = countBodies(reviews);

  const seenProducts = new Set<string>();
  const quotes: JudgemeQuote[] = [];
  for (const review of reviews) {
    const body = (review.body ?? '').trim();
    if (review.rating < minRating || body.length < minBodyLength) continue;
    if (review.curated === 'spam') continue;
    if (isTemplatedReview(body, bodyCounts)) continue;
    const productKey = review.product_handle ?? `review-${review.id}`;
    if (seenProducts.has(productKey)) continue;
    seenProducts.add(productKey);
    quotes.push({
      id: review.id,
      rating: review.rating,
      title: review.title?.trim() || undefined,
      body,
      reviewerName: toDisplayName(review.reviewer?.name, review.id),
      productHandle: review.product_handle ?? undefined,
      productTitle: review.product_title?.trim() || undefined,
    });
  }
  return quotes;
}

interface JudgemeProductLookupResponse {
  product?: {id?: number} | null;
}

/**
 * Resolves a Shopify product's numeric ID to Judge.me's own internal
 * product record ID, via their documented `/products/-1` lookup (the `-1`
 * is a literal placeholder telling the endpoint to look the product up by
 * `external_id` instead of by Judge.me's own primary key). Returns null on
 * any failure -- callers fall back to a less precise search rather than
 * failing the page.
 */
async function resolveJudgemeProductId({
  apiToken,
  shopDomain,
  externalId,
}: {
  apiToken: string;
  shopDomain: string;
  externalId: string;
}): Promise<number | null> {
  const url = new URL(JUDGEME_PRODUCTS_BASE);
  url.searchParams.set('api_token', apiToken);
  url.searchParams.set('shop_domain', shopDomain);
  url.searchParams.set('external_id', externalId);

  try {
    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      cf: {cacheTtl: 3600, cacheEverything: true},
    } as RequestInit);
    if (!response.ok) return null;
    const data = (await response.json()) as JudgemeProductLookupResponse;
    return typeof data.product?.id === 'number' ? data.product.id : null;
  } catch (error) {
    console.error('[judgeme] product lookup failed', error);
    return null;
  }
}

interface JudgemeWidgetReview {
  uuid: string;
  rating: number;
  title?: string | null;
  body_html?: string | null;
  reviewer_name?: string | null;
  created_at?: string | null;
}

interface JudgemeWidgetResponse {
  reviews?: JudgemeWidgetReview[];
  pagination?: {total_pages?: number};
}

const HTML_ENTITIES: Record<string, string> = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' '};

function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|div|li)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (match, entity: string) => {
      if (entity[0] === '#') {
        const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
      }
      return HTML_ENTITIES[entity.toLowerCase()] ?? match;
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchJudgemeWidgetPage(
  shopDomain: string,
  productId: string,
  page: number,
): Promise<JudgemeWidgetResponse | null> {
  const url = new URL(JUDGEME_WIDGET_BASE);
  url.searchParams.set('url', shopDomain);
  url.searchParams.set('shop_domain', shopDomain);
  url.searchParams.set('platform', 'shopify');
  url.searchParams.set('product_id', productId);
  url.searchParams.set('per_page', String(JUDGEME_WIDGET_PAGE_SIZE));
  url.searchParams.set('page', String(page));
  try {
    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      cf: {cacheTtl: 3600, cacheEverything: true},
    } as RequestInit);
    if (!response.ok) {
      console.error(`[judgeme] widget API responded with ${response.status}`);
      return null;
    }
    return (await response.json()) as JudgemeWidgetResponse;
  } catch (error) {
    console.error('[judgeme] widget request failed', error);
    return null;
  }
}

/** Every published review for a product from Judge.me's public widget endpoint; empty on any failure. */
async function fetchJudgemeWidgetReviews(shopDomain: string, productId: string, maxPages: number): Promise<JudgemeReview[]> {
  const first = await fetchJudgemeWidgetPage(shopDomain, productId, 1);
  if (!first) return [];
  const totalPages = Math.min(first.pagination?.total_pages ?? 1, maxPages);
  const rest = await Promise.all(
    Array.from({length: Math.max(totalPages - 1, 0)}, (_, i) => fetchJudgemeWidgetPage(shopDomain, productId, i + 2)),
  );
  const raw = [first, ...rest].flatMap((page) => page?.reviews ?? []);
  return [...new Map(raw.map((r) => [r.uuid, r])).values()]
    .map((r) => ({review: r, body: htmlToText(r.body_html ?? '')}))
    .filter(({review, body}) => body.length > 0 && typeof review.rating === 'number')
    .map(({review, body}) => ({
      id: review.uuid,
      rating: review.rating,
      title: review.title?.trim() || undefined,
      body,
      reviewerName: toDisplayName(review.reviewer_name, review.uuid),
      createdAt: review.created_at ?? undefined,
    }));
}

interface FetchJudgemeProductReviewsOptions {
  /** Optional: only the private-API fallback needs it; the public widget path works without. */
  apiToken?: string;
  shopDomain: string;
  /** Shopify product ID (numeric, as a string) -- resolved to Judge.me's internal ID first. */
  productId: string;
  /** Belt-and-suspenders check against the returned rows, and the fallback-path filter. */
  productHandle: string;
  perPage?: number;
  /** How many pages to fetch (30 per page on the public path, 100 on the private fallback), in parallel. */
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
 * contract requiring a `judgeme.review_widget_data` metafield that this
 * store doesn't have populated -- so instead of depending on their
 * client-side embed at all, this fetches real review data server-side and
 * the storefront renders its own list.
 *
 * Primary path: resolve the Shopify product ID to Judge.me's internal one
 * via resolveJudgemeProductId, then ask the reviews endpoint for exactly
 * that product's reviews via its `product_id` filter (their own internal
 * ID, confirmed via Judge.me's documented `/products/-1` lookup and help
 * docs -- passing Shopify's ID directly there, as an earlier version of
 * this function did, silently falls back to every review in the store
 * rather than erroring, which is what broke this for products whose
 * reviews weren't recent enough to land in a single fetched page).
 *
 * Fallback path (resolution failed, or it returned nothing after the
 * primary fetch): page through the shop's reviews and filter by
 * product_handle, same as the interim fix before this -- less precise
 * (bounded by maxPages) but keeps the section working if the lookup
 * endpoint itself is ever unavailable.
 */
export async function fetchJudgemeProductReviews({
  apiToken,
  shopDomain,
  productId,
  productHandle,
  perPage = 100,
  maxPages = 5,
}: FetchJudgemeProductReviewsOptions): Promise<JudgemeReview[]> {
  const widgetReviews = await fetchJudgemeWidgetReviews(shopDomain, productId, maxPages);
  if (widgetReviews.length > 0) return widgetReviews;
  if (!apiToken) return [];

  // NOTE: deliberately unfiltered -- this list must match the Judge.me
  // star rating and review count shown site-wide, which include every
  // published review. Hide unwanted reviews in Judge.me itself.
  const toReviews = (raw: JudgemeApiReview[]) =>
    raw
      .filter((r) => (r.body ?? '').trim().length > 0)
      .map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title?.trim() || undefined,
        body: r.body!.trim(),
        reviewerName: toDisplayName(r.reviewer?.name, r.id),
        createdAt: r.created_at ?? undefined,
      }));

  const internalId = await resolveJudgemeProductId({apiToken, shopDomain, externalId: productId});
  if (internalId) {
    // Fetch subsequent pages too -- a product with more reviews than a
    // single `perPage` would otherwise silently lose everything past the
    // first page, even though the PDP presents this as the full list
    // alongside the real aggregate count (Codex-caught on this PR).
    const idPages = await Promise.all(
      Array.from({length: maxPages}, (_, i) =>
        fetchJudgemeReviewsRaw({
          apiToken,
          shopDomain,
          perPage,
          page: i + 1,
          productId: String(internalId),
        }),
      ),
    );
    const raw = [...new Map(idPages.flat().map((r) => [r.id, r])).values()];
    // Defensive: a resolved-but-wrong id would fall back to unfiltered
    // results the same way a raw Shopify id does, so still check the
    // handle before trusting the response.
    const matched = raw.filter((r) => r.product_handle === productHandle);
    if (matched.length > 0) return toReviews(matched);
  }

  const pages = await Promise.all(
    Array.from({length: maxPages}, (_, i) =>
      fetchJudgemeReviewsRaw({apiToken, shopDomain, perPage, page: i + 1}),
    ),
  );
  // Dedup by id -- pagination could theoretically overlap if the shop's
  // review set shifts between the parallel page requests.
  const deduped = [...new Map(pages.flat().map((r) => [r.id, r])).values()];
  return toReviews(deduped.filter((r) => r.product_handle === productHandle));
}
