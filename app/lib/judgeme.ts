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
 * Cloudflare edge-cache options for a Judge.me request. `cacheTtl` alone also caches error responses, so an
 * outage would stay cached for the whole hour; keyed by status, only successes are kept.
 * NOTE: whether the edge actually serves these from cache on Oxygen has not been measured (needs a deployed preview).
 */
function edgeCache(signalMs = 5000): RequestInit {
  const init: RequestInit & {cf?: Record<string, unknown>} = {
    signal: AbortSignal.timeout(signalMs),
    cf: {cacheEverything: true, cacheTtlByStatus: {'200-299': 3600, '300-599': -1}},
  };
  return init;
}

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
  const rating = html.match(/data-average-rating=["'](\d+(?:\.\d+)?)["']/)?.[1];
  const count = html.match(/data-number-of-reviews=["'](\d+)["']/)?.[1];
  if (!rating || !count) return null;
  const parsedRating = parseFloat(rating);
  const parsedCount = parseInt(count, 10);
  // NOTE: a rating outside 0-5 or a zero/absurd count is malformed provider data; omit it rather than show it.
  if (!isValidRating(parsedRating) || parsedCount <= 0 || parsedCount > MAX_REVIEW_COUNT) return null;
  return {rating: parsedRating, count: parsedCount};
}

const MAX_REVIEW_COUNT = 10_000_000;

/** Judge.me ratings are 1-5 stars; anything else (0, negative, above 5, NaN) is not a rating. */
export function isValidRating(rating: unknown): rating is number {
  return typeof rating === 'number' && Number.isFinite(rating) && rating > 0 && rating <= 5;
}

/**
 * Average rating and count of a fetched review list. This describes only the reviews in the list; the
 * provider's own aggregate (the badge) covers every review, including star-only ones, and wins when present.
 */
export function summarizeReviews(reviews: readonly {rating: number}[]): {rating: number; count: number} | null {
  const valid = reviews.filter((review) => isValidRating(review.rating));
  if (valid.length === 0) return null;
  const total = valid.reduce((sum, review) => sum + review.rating, 0);
  return {rating: Number((total / valid.length).toFixed(2)), count: valid.length};
}

/**
 * The rating shown beside a product: the provider's aggregate (badge) whenever it is valid, because it covers
 * every review including star-only ones. Only without it is one derived from the fetched list, and only when
 * that list is complete: a truncated list would understate the count. Because the badge always wins, a fast
 * and a slow render of the same data show the same numbers.
 */
export function resolveProductRating(
  badge: {rating: number; count: number} | null,
  list: JudgemeReviewList | null | undefined,
): {rating: number; count: number} | null {
  if (badge) return badge;
  if (!list || list.truncated) return null;
  return summarizeReviews(list.reviews);
}

export interface JudgemeQuote {
  id: number;
  rating: number;
  title?: string;
  body: string;
  /** Masked per toDisplayName: never invented, never a full name. */
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

/** Shown when a review has no usable name. Deliberately generic: it never stands in for a different person. */
export const ANONYMOUS_REVIEWER = 'Anonymous';

const MAX_NAME_TOKEN_LENGTH = 30;
// A name written without spaces in these scripts is usually the whole name (surname + given name).
const UNSPACED_SCRIPTS = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

/** First user-perceived character (an emoji or accented letter stays whole), or '' for an empty string. */
function firstGrapheme(text: string): string {
  const Segmenter = (Intl as {Segmenter?: typeof Intl.Segmenter}).Segmenter;
  if (Segmenter) {
    for (const {segment} of new Segmenter(undefined, {granularity: 'grapheme'}).segment(text)) return segment;
    return '';
  }
  return Array.from(text)[0] ?? '';
}

/**
 * The attribution shown with a review. Policy (docs/REVIEWS.md):
 * - Never invent an identity. No name, or something that is not a name (an email address, a link, only
 *   punctuation), is shown as "Anonymous".
 * - Two or more words: first word plus the initial of the last ("Jordan Alvarez" -> "Jordan A.").
 * - One word in Chinese, Japanese or Korean script (usually the full name): its first character only
 *   ("山田太郎" -> "山."), so a full name is never exposed.
 * - One word otherwise: shown as written ("Madonna"), since it is already only a first name or a handle.
 */
export function toDisplayName(fullName: string | null | undefined): string {
  const cleaned = (fullName ?? '').replace(/\p{Cc}/gu, ' ').trim();
  if (!cleaned || /[@/\\]|https?:|www\./i.test(cleaned) || !/[\p{L}\p{N}]/u.test(cleaned)) return ANONYMOUS_REVIEWER;

  const parts = cleaned.split(/\s+/).map((part) => part.slice(0, MAX_NAME_TOKEN_LENGTH * 4));
  if (parts.length === 1) {
    const [only] = parts;
    if (UNSPACED_SCRIPTS.test(only)) return `${firstGrapheme(only)}.`;
    return Array.from(only).slice(0, MAX_NAME_TOKEN_LENGTH).join('');
  }
  const first = Array.from(parts[0]).slice(0, MAX_NAME_TOKEN_LENGTH).join('');
  const initial = firstGrapheme(parts[parts.length - 1]);
  return initial && /[\p{L}\p{N}]/u.test(initial) ? `${first} ${initial}.` : first;
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
 * Shared request/parse core for the Judge.me reviews endpoint. Never throws
 * -- a failed third-party fetch should never break the page it's decorating --
 * and says whether the page was actually read (`ok`), so a failed page is not
 * mistaken for an empty one.
 */
interface RawPage {
  reviews: JudgemeApiReview[];
  ok: boolean;
}

const FAILED_PAGE: RawPage = {reviews: [], ok: false};

async function fetchJudgemeReviewsRaw({
  apiToken,
  shopDomain,
  perPage,
  page,
  productId,
}: FetchJudgemeReviewsRawOptions): Promise<RawPage> {
  const url = new URL(JUDGEME_API_BASE);
  url.searchParams.set('api_token', apiToken);
  url.searchParams.set('shop_domain', shopDomain);
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('published', 'true');
  if (page) url.searchParams.set('page', String(page));
  if (productId) url.searchParams.set('product_id', productId);

  let response: Response;
  try {
    // Edge cache: an hour-stale review list is a non-issue; failures are never cached.
    response = await fetch(url.toString(), edgeCache());
  } catch (error) {
    console.error('[judgeme] request failed', error);
    return FAILED_PAGE;
  }

  if (!response.ok) {
    console.error(`[judgeme] API responded with ${response.status}`);
    return FAILED_PAGE;
  }

  try {
    const data = (await response.json()) as JudgemeApiResponse;
    if (!Array.isArray(data.reviews)) return FAILED_PAGE;
    return {ok: true, reviews: data.reviews.filter((r) => r && !r.hidden && isValidRating(r.rating))};
  } catch (error) {
    console.error('[judgeme] failed to parse response', error);
    return FAILED_PAGE;
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
  const {reviews} = await fetchJudgemeReviewsRaw({apiToken, shopDomain, perPage});

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
      reviewerName: toDisplayName(review.reviewer?.name),
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
    const response = await fetch(url.toString(), edgeCache());
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
    const response = await fetch(url.toString(), edgeCache());
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

/** A product's reviews plus whether the list is known to be incomplete (so callers can say so). */
export interface JudgemeReviewList {
  reviews: JudgemeReview[];
  /** True when pages were skipped (page cap) or failed: the list is a subset of what Judge.me holds. */
  truncated: boolean;
}

const EMPTY_LIST: JudgemeReviewList = {reviews: [], truncated: false};

/** Published, written reviews for a product from Judge.me's public widget endpoint; empty on first-page failure. */
async function fetchJudgemeWidgetReviews(shopDomain: string, productId: string, maxPages: number): Promise<JudgemeReviewList> {
  const first = await fetchJudgemeWidgetPage(shopDomain, productId, 1);
  if (!first || !Array.isArray(first.reviews)) return EMPTY_LIST;
  const reportedPages = Number.isInteger(first.pagination?.total_pages) ? Math.max(first.pagination!.total_pages!, 1) : 1;
  const totalPages = Math.min(reportedPages, maxPages);
  const rest = await Promise.all(
    Array.from({length: Math.max(totalPages - 1, 0)}, (_, i) => fetchJudgemeWidgetPage(shopDomain, productId, i + 2)),
  );
  // NOTE: a page that failed or was cut by the cap leaves a partial list; it is returned and marked truncated, never passed off as complete.
  const truncated = reportedPages > maxPages || rest.some((page) => page === null || !Array.isArray(page.reviews));
  const raw = [first, ...rest].flatMap((page) => (page && Array.isArray(page.reviews) ? page.reviews : []));
  const reviews = [...new Map(raw.filter((r) => r && r.uuid).map((r) => [r.uuid, r])).values()]
    .map((r) => ({review: r, body: htmlToText(r.body_html ?? '')}))
    .filter(({review, body}) => body.length > 0 && isValidRating(review.rating))
    .map(({review, body}) => ({
      id: review.uuid,
      rating: review.rating,
      title: review.title?.trim() || undefined,
      body,
      reviewerName: toDisplayName(review.reviewer_name),
      createdAt: review.created_at ?? undefined,
    }));
  return {reviews, truncated};
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
}: FetchJudgemeProductReviewsOptions): Promise<JudgemeReviewList> {
  const widget = await fetchJudgemeWidgetReviews(shopDomain, productId, maxPages);
  if (widget.reviews.length > 0) return widget;
  if (!apiToken) return EMPTY_LIST;

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
        reviewerName: toDisplayName(r.reviewer?.name),
        createdAt: r.created_at ?? undefined,
      }));
  // The private API does not report a page total: a failed page, or a last page that is full, means the list may be incomplete.
  const mayHaveMore = (pages: RawPage[]) => pages.some((page) => !page.ok) || (pages.at(-1)?.reviews.length ?? 0) >= perPage;

  const internalId = await resolveJudgemeProductId({apiToken, shopDomain, externalId: productId});
  if (internalId) {
    const idPages = await Promise.all(
      Array.from({length: maxPages}, (_, i) =>
        fetchJudgemeReviewsRaw({apiToken, shopDomain, perPage, page: i + 1, productId: String(internalId)}),
      ),
    );
    const raw = [...new Map(idPages.flatMap((page) => page.reviews).map((r) => [r.id, r])).values()];
    // Defensive: a resolved-but-wrong id would fall back to unfiltered results the same way a raw Shopify id
    // does, so still check the handle before trusting the response.
    const matched = raw.filter((r) => r.product_handle === productHandle);
    if (matched.length > 0) return {reviews: toReviews(matched), truncated: mayHaveMore(idPages)};
  }

  const pages = await Promise.all(
    Array.from({length: maxPages}, (_, i) => fetchJudgemeReviewsRaw({apiToken, shopDomain, perPage, page: i + 1})),
  );
  // Dedup by id -- pagination could theoretically overlap if the shop's review set shifts between the parallel page requests.
  const deduped = [...new Map(pages.flatMap((page) => page.reviews).map((r) => [r.id, r])).values()];
  return {reviews: toReviews(deduped.filter((r) => r.product_handle === productHandle)), truncated: mayHaveMore(pages)};
}
