import {describe, it, expect, vi, afterEach} from 'vitest';
import {
  ANONYMOUS_REVIEWER,
  fetchJudgemeProductReviews,
  fetchJudgemeQuotes,
  isTemplatedReview,
  parseJudgemeBadge,
  resolveProductRating,
  summarizeReviews,
  toDisplayName,
} from './judgeme';

describe('parseJudgemeBadge', () => {
  it('returns null for null/undefined/empty input', () => {
    expect(parseJudgemeBadge(null)).toBeNull();
    expect(parseJudgemeBadge(undefined)).toBeNull();
    expect(parseJudgemeBadge('')).toBeNull();
  });

  it('parses double-quoted attributes', () => {
    const html = '<span data-average-rating="4.8" data-number-of-reviews="23"></span>';
    expect(parseJudgemeBadge(html)).toEqual({rating: 4.8, count: 23});
  });

  it('parses single-quoted attributes (Judge.me\'s actual output format)', () => {
    const html = "<span data-average-rating='4.5' data-number-of-reviews='12'></span>";
    expect(parseJudgemeBadge(html)).toEqual({rating: 4.5, count: 12});
  });

  it('returns null when rating attribute is missing', () => {
    expect(parseJudgemeBadge('<span data-number-of-reviews="5"></span>')).toBeNull();
  });

  it('returns null when count attribute is missing', () => {
    expect(parseJudgemeBadge('<span data-average-rating="4.0"></span>')).toBeNull();
  });

  it('rejects out-of-range or malformed ratings and counts instead of showing them', () => {
    const badge = (rating: string, count: string) => `<span data-average-rating="${rating}" data-number-of-reviews="${count}"></span>`;
    expect(parseJudgemeBadge(badge('5.7', '10'))).toBeNull();
    expect(parseJudgemeBadge(badge('0', '10'))).toBeNull();
    expect(parseJudgemeBadge(badge('4.8.2', '10'))).toBeNull();
    expect(parseJudgemeBadge(badge('-3', '10'))).toBeNull();
    expect(parseJudgemeBadge(badge('4.5', '99999999999'))).toBeNull();
    expect(parseJudgemeBadge(badge('5', '1'))).toEqual({rating: 5, count: 1});
  });

  it('returns null for a zero review count (no real reviews to show)', () => {
    const html = '<span data-average-rating="0.0" data-number-of-reviews="0"></span>';
    expect(parseJudgemeBadge(html)).toBeNull();
  });
});

describe('fetchJudgemeQuotes', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('degrades to an empty list when the request fails (never breaks the page)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down'));
    const quotes = await fetchJudgemeQuotes({apiToken: 'x', shopDomain: 'test.myshopify.com'});
    expect(quotes).toEqual([]);
  });

  it('degrades to an empty list on a non-OK response', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('', {status: 500}));
    const quotes = await fetchJudgemeQuotes({apiToken: 'x', shopDomain: 'test.myshopify.com'});
    expect(quotes).toEqual([]);
  });

  it('filters out reviews below minRating and minBodyLength, masks full names', async () => {
    const body = JSON.stringify({
      reviews: [
        {id: 1, rating: 5, body: 'Picked this up after seeing it online and it genuinely exceeded what I expected from the fit.', reviewer: {name: 'Jordan Alvarez'}, hidden: false},
        {id: 2, rating: 4, body: 'Four stars, long enough to pass the length filter but not the rating one.', reviewer: {name: 'Taylor Smith'}, hidden: false},
        {id: 3, rating: 5, body: 'short', reviewer: {name: 'Sam Jones'}, hidden: false},
        {id: 4, rating: 5, body: 'This one is hidden and should be excluded entirely.', reviewer: {name: 'Alex Kim'}, hidden: true},
      ],
    });
    global.fetch = vi.fn().mockResolvedValue(new Response(body, {status: 200}));

    const quotes = await fetchJudgemeQuotes({apiToken: 'x', shopDomain: 'test.myshopify.com'});

    expect(quotes).toHaveLength(1);
    expect(quotes[0].id).toBe(1);
    // "Jordan Alvarez" -> "Jordan A." -- first name + last-initial only, never the full name.
    expect(quotes[0].reviewerName).toBe('Jordan A.');
  });

  it('shows a single-word name as written rather than swapping in a different person', async () => {
    const body = JSON.stringify({
      reviews: [
        {id: 7, rating: 5, body: 'Picked this up after seeing it online and it genuinely exceeded what I expected from the fit.', reviewer: {name: 'Madonna'}, hidden: false},
      ],
    });
    global.fetch = vi.fn().mockResolvedValue(new Response(body, {status: 200}));
    const quotes = await fetchJudgemeQuotes({apiToken: 'x', shopDomain: 'test.myshopify.com'});
    expect(quotes[0].reviewerName).toBe('Madonna');
  });

  it('drops reviews whose rating is out of range or not a number', async () => {
    const long = 'Long enough review text that would otherwise qualify for the homepage selection of quotes.';
    const body = JSON.stringify({
      reviews: [
        {id: 1, rating: 9, body: long + ' one', product_handle: 'a'},
        {id: 2, rating: 'five', body: long + ' two', product_handle: 'b'},
        {id: 3, rating: 5, body: long + ' three', product_handle: 'c', reviewer: {name: 'Real Person'}},
      ],
    });
    global.fetch = vi.fn().mockResolvedValue(new Response(body, {status: 200}));
    const quotes = await fetchJudgemeQuotes({apiToken: 'x', shopDomain: 'test.myshopify.com'});
    expect(quotes.map((q) => q.id)).toEqual([3]);
  });

  it('degrades to an empty list when the response has the wrong shape', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({reviews: 'nope'}), {status: 200}));
    expect(await fetchJudgemeQuotes({apiToken: 'x', shopDomain: 'test.myshopify.com'})).toEqual([]);
  });

  it('never lets a failed response sit in the edge cache for the success TTL', async () => {
    const init: RequestInit[] = [];
    global.fetch = vi.fn(async (_url: unknown, options?: RequestInit) => {
      init.push(options ?? {});
      return new Response('', {status: 500});
    }) as typeof fetch;
    await fetchJudgemeQuotes({apiToken: 'x', shopDomain: 'test.myshopify.com'});
    const cf = (init[0] as {cf?: {cacheTtlByStatus?: Record<string, number>; cacheTtl?: number}}).cf;
    expect(cf?.cacheTtl).toBeUndefined();
    expect(cf?.cacheTtlByStatus).toEqual({'200-299': 3600, '300-599': -1});
  });

  it('drops templated text reused across reviews, spam, and repeat products', async () => {
    const templated = 'Fits as expected, looks amazing in person. Definitely coming back for more and more again.';
    const body = JSON.stringify({
      reviews: [
        {id: 1, rating: 5, body: templated, product_handle: 'tee', reviewer: {name: 'A B'}},
        {id: 2, rating: 5, body: templated.toUpperCase(), product_handle: 'hoodie', reviewer: {name: 'C D'}},
        {id: 3, rating: 5, body: 'Quiet luxury type beat. People keep asking about the patch on the sleeve every time I wear it.', product_handle: 'crew', product_title: 'Crewneck', reviewer: {name: 'Elliot Vance'}},
        {id: 4, rating: 5, body: 'Second review on the same crewneck, also long enough to otherwise qualify for the homepage.', product_handle: 'crew', reviewer: {name: 'E F'}},
        {id: 5, rating: 5, body: 'Flagged as spam by Judge.me curation but otherwise long enough to qualify for the homepage.', curated: 'spam', product_handle: 'hat', reviewer: {name: 'G H'}},
      ],
    });
    global.fetch = vi.fn().mockResolvedValue(new Response(body, {status: 200}));

    const quotes = await fetchJudgemeQuotes({apiToken: 'x', shopDomain: 'test.myshopify.com'});

    expect(quotes.map((q) => q.id)).toEqual([3]);
    expect(quotes[0].productTitle).toBe('Crewneck');
    expect(quotes[0].productHandle).toBe('crew');
  });

  it('treats identical non-Latin reviews as duplicates', async () => {
    const jp = 'このパーカーは本当に最高です。生地が厚くて、洗濯しても形が崩れません。毎日着ています。友達にも勧めました。サイズ感もちょうど良く、デザインもかっこいいです。';
    const body = JSON.stringify({
      reviews: [
        {id: 1, rating: 5, body: jp, product_handle: 'a', reviewer: {name: 'A B'}},
        {id: 2, rating: 5, body: jp, product_handle: 'b', reviewer: {name: 'C D'}},
      ],
    });
    global.fetch = vi.fn().mockResolvedValue(new Response(body, {status: 200}));
    const quotes = await fetchJudgemeQuotes({apiToken: 'x', shopDomain: 'test.myshopify.com', minBodyLength: 20});
    expect(quotes).toEqual([]);
  });
});

describe('templated reviews', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('recognises known stock phrases regardless of apostrophe style', () => {
    expect(isTemplatedReview("The fabric is high-quality and the print hasn't faded after several washes.")).toBe(true);
    expect(isTemplatedReview('I get compliments every time I wear it.')).toBe(true);
    expect(isTemplatedReview('Wore this in the rain twice now and it held up both times.')).toBe(false);
  });

  it('keeps every review on a product page list so it matches the Judge.me count', async () => {
    const reviews = [
      {id: 1, rating: 5, body: 'Fits as expected, looks amazing in person. Definitely coming back for more.', product_handle: 'tee'},
      {id: 2, rating: 5, body: 'Same text twice on one product.', product_handle: 'tee'},
      {id: 3, rating: 5, body: 'Same text twice on one product.', product_handle: 'tee'},
      {id: 4, rating: 4, body: 'Ordered a medium and it fits like a large. Good to know before ordering.', product_handle: 'tee'},
    ];
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/products/')) return new Response(JSON.stringify({product: {id: 42}}), {status: 200});
      const page = new URL(url).searchParams.get('page');
      return new Response(JSON.stringify({reviews: page === '1' ? reviews : []}), {status: 200});
    }) as typeof fetch;

    const result = await fetchJudgemeProductReviews({
      apiToken: 'x',
      shopDomain: 'test.myshopify.com',
      productId: '1',
      productHandle: 'tee',
    });

    expect(result.reviews.map((r) => r.id)).toEqual([1, 2, 3, 4]);
    expect(result.truncated).toBe(false);
  });

  const widgetReview = (uuid: string, extra: Record<string, unknown> = {}) => ({
    uuid,
    rating: 5,
    title: 'Great',
    body_html: '<p>Heavy fabric &amp; a great fit.</p>',
    reviewer_name: 'Theo Williams',
    created_at: '2026-10-05T06:45:15.000Z',
    ...extra,
  });

  it('reads every page from the public widget endpoint without an API token', async () => {
    const urls: string[] = [];
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      urls.push(url.toString());
      const page = Number(url.searchParams.get('page'));
      return new Response(
        JSON.stringify({
          reviews: [widgetReview(`a${page}`), widgetReview(`b${page}`)],
          pagination: {total_pages: 3},
        }),
        {status: 200},
      );
    }) as typeof fetch;

    const result = await fetchJudgemeProductReviews({
      shopDomain: 'test.myshopify.com',
      productId: '8507670364313',
      productHandle: 'wide-leg',
    });

    expect(result.reviews).toHaveLength(6);
    expect(result.truncated).toBe(false);
    expect(urls.every((u) => u.includes('reviews_for_widget') && u.includes('product_id=8507670364313'))).toBe(true);
    expect(urls.some((u) => u.includes('api_token'))).toBe(false);
    expect(result.reviews[0]).toMatchObject({
      rating: 5,
      title: 'Great',
      body: 'Heavy fabric & a great fit.',
      reviewerName: 'Theo W.',
    });
  });

  it('skips widget reviews without text and falls back to the private API when the widget is empty', async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('reviews_for_widget')) {
        return new Response(JSON.stringify({reviews: [widgetReview('x', {body_html: '<p> </p>'})], pagination: {total_pages: 1}}), {status: 200});
      }
      if (url.includes('/products/')) return new Response(JSON.stringify({product: {id: 42}}), {status: 200});
      const page = new URL(url).searchParams.get('page');
      return new Response(
        JSON.stringify({reviews: page === '1' ? [{id: 9, rating: 5, body: 'Private path review.', product_handle: 'tee'}] : []}),
        {status: 200},
      );
    }) as typeof fetch;

    const result = await fetchJudgemeProductReviews({
      apiToken: 'x',
      shopDomain: 'test.myshopify.com',
      productId: '1',
      productHandle: 'tee',
    });
    expect(result.reviews.map((r) => r.id)).toEqual([9]);
  });

  it('returns an empty list when the widget endpoint fails and no token is set', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('', {status: 500}));
    const result = await fetchJudgemeProductReviews({shopDomain: 'test.myshopify.com', productId: '1', productHandle: 'tee'});
    expect(result).toEqual({reviews: [], truncated: false});
  });

  it('returns what it has, marked truncated, when a later widget page fails', async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const page = Number(new URL(url).searchParams.get('page'));
      if (page === 2) return new Response('', {status: 500});
      return new Response(JSON.stringify({reviews: [widgetReview(`w${page}`)], pagination: {total_pages: 3}}), {status: 200});
    }) as typeof fetch;

    const result = await fetchJudgemeProductReviews({shopDomain: 'test.myshopify.com', productId: '1', productHandle: 'tee'});
    expect(result.reviews.map((r) => r.id)).toEqual(['w1', 'w3']);
    expect(result.truncated).toBe(true);
  });

  it('marks the list truncated when the page cap cuts it, and stops at the cap', async () => {
    const pagesAsked: number[] = [];
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const page = Number(new URL(String(input)).searchParams.get('page'));
      pagesAsked.push(page);
      return new Response(JSON.stringify({reviews: [widgetReview(`p${page}`)], pagination: {total_pages: 40}}), {status: 200});
    }) as typeof fetch;
    const result = await fetchJudgemeProductReviews({shopDomain: 'test.myshopify.com', productId: '1', productHandle: 'tee', maxPages: 3});
    expect(pagesAsked.sort()).toEqual([1, 2, 3]);
    expect(result.reviews).toHaveLength(3);
    expect(result.truncated).toBe(true);
  });

  it('drops out-of-range ratings and empty bodies, tolerates a missing reviews array, and dedupes', async () => {
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          reviews: [
            widgetReview('ok'),
            widgetReview('ok'),
            widgetReview('high', {rating: 7}),
            widgetReview('zero', {rating: 0}),
            widgetReview('text', {rating: 'x'}),
            widgetReview('empty', {body_html: ''}),
          ],
          pagination: {total_pages: 1},
        }),
        {status: 200},
      ),
    ) as typeof fetch;
    const result = await fetchJudgemeProductReviews({shopDomain: 'test.myshopify.com', productId: '1', productHandle: 'tee'});
    expect(result.reviews.map((r) => r.id)).toEqual(['ok']);

    global.fetch = vi.fn(async () => new Response(JSON.stringify({pagination: {total_pages: 1}}), {status: 200})) as typeof fetch;
    expect(await fetchJudgemeProductReviews({shopDomain: 'test.myshopify.com', productId: '1', productHandle: 'tee'})).toEqual({reviews: [], truncated: false});
  });

  it('never invents or swaps a reviewer name for a missing one', async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({reviews: [widgetReview('a', {reviewer_name: null}), widgetReview('b', {reviewer_name: ''})], pagination: {total_pages: 1}}), {status: 200}),
    ) as typeof fetch;
    const result = await fetchJudgemeProductReviews({shopDomain: 'test.myshopify.com', productId: '1', productHandle: 'tee'});
    expect(result.reviews.map((r) => r.reviewerName)).toEqual([ANONYMOUS_REVIEWER, ANONYMOUS_REVIEWER]);
  });
});

describe('private-API fallback truncation', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('marks the list truncated when an intermediate page fails even though the last page is short', async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('reviews_for_widget')) return new Response('', {status: 500});
      if (url.includes('/products/')) return new Response(JSON.stringify({product: {id: 42}}), {status: 200});
      const page = Number(new URL(url).searchParams.get('page'));
      if (page === 2) return new Response('', {status: 500});
      return new Response(
        JSON.stringify({reviews: page === 1 ? [{id: 1, rating: 5, body: 'First page review.', product_handle: 'tee'}] : []}),
        {status: 200},
      );
    }) as typeof fetch;

    const result = await fetchJudgemeProductReviews({apiToken: 'x', shopDomain: 'test.myshopify.com', productId: '1', productHandle: 'tee', maxPages: 3});
    expect(result.reviews.map((r) => r.id)).toEqual([1]);
    expect(result.truncated).toBe(true);
    expect(resolveProductRating(null, result)).toBeNull();
  });

  it('treats a malformed page as failed, and a clean short list as complete', async () => {
    const respond = (malformed: boolean) =>
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('reviews_for_widget')) return new Response('', {status: 500});
        if (url.includes('/products/')) return new Response(JSON.stringify({product: {id: 42}}), {status: 200});
        const page = Number(new URL(url).searchParams.get('page'));
        if (page === 2 && malformed) return new Response(JSON.stringify({reviews: 'nope'}), {status: 200});
        return new Response(
          JSON.stringify({reviews: page === 1 ? [{id: 1, rating: 5, body: 'First page review.', product_handle: 'tee'}] : []}),
          {status: 200},
        );
      }) as typeof fetch;
    const options = {apiToken: 'x', shopDomain: 'test.myshopify.com', productId: '1', productHandle: 'tee', maxPages: 3};
    global.fetch = respond(true);
    expect((await fetchJudgemeProductReviews(options)).truncated).toBe(true);
    global.fetch = respond(false);
    expect((await fetchJudgemeProductReviews(options)).truncated).toBe(false);
  });
});

describe('toDisplayName', () => {
  it('masks a multi-word name to first name plus last initial', () => {
    expect(toDisplayName('Jordan Alvarez')).toBe('Jordan A.');
    expect(toDisplayName('  Mary  Jane   Watson ')).toBe('Mary W.');
    expect(toDisplayName('José Álvarez')).toBe('José Á.');
    expect(toDisplayName('Zoë Müller-Smith')).toBe('Zoë M.');
  });

  it('keeps an initial that is more than one UTF-16 unit whole', () => {
    expect(toDisplayName('Ana 𝒜lvarez')).toBe('Ana 𝒜.');
    expect(toDisplayName('Ana e\u0301clair')).toBe('Ana e\u0301.');
  });

  it('shows one word as written, bounded, in alphabetic scripts', () => {
    expect(toDisplayName('Madonna')).toBe('Madonna');
    expect(toDisplayName('Σωκράτης')).toBe('Σωκράτης');
    expect(toDisplayName('A'.repeat(100))).toHaveLength(30);
  });

  it('never exposes an unspaced CJK full name, only its first character', () => {
    expect(toDisplayName('山田太郎')).toBe('山.');
    expect(toDisplayName('김민수')).toBe('김.');
    expect(toDisplayName('さくら')).toBe('さ.');
  });

  it('masks spaced CJK and right-to-left names the same way', () => {
    expect(toDisplayName('山田 太郎')).toBe('山田 太.');
    expect(toDisplayName('محمد الأحمد')).toBe('محمد ا.');
  });

  it('uses the neutral label, never a made-up person, for missing or non-name input', () => {
    for (const input of [null, undefined, '', '   ', '\u0000\u0007', '...', '---', 'jane@example.com', 'https://x.test/me', 'www.shop.com', 'a/b']) {
      expect(toDisplayName(input)).toBe(ANONYMOUS_REVIEWER);
    }
  });

  it('is stable: the same input always gives the same output and never a known placeholder person', () => {
    expect(toDisplayName('Madonna')).toBe(toDisplayName('Madonna'));
    for (const placeholder of ['Jordan A.', 'Emma R.', 'Wei L.', 'Aiko T.']) {
      expect(toDisplayName(null)).not.toBe(placeholder);
    }
  });
});

describe('resolveProductRating', () => {
  const badge = {rating: 4.6, count: 120};
  const list = (reviews: {rating: number}[], truncated = false) => ({reviews: reviews as never, truncated});

  it('always prefers the provider aggregate, so fast and slow renders agree', () => {
    expect(resolveProductRating(badge, null)).toEqual(badge);
    expect(resolveProductRating(badge, list([{rating: 1}]))).toEqual(badge);
  });

  it('derives from a complete list only when there is no badge', () => {
    expect(resolveProductRating(null, list([{rating: 5}, {rating: 4}]))).toEqual({rating: 4.5, count: 2});
  });

  it('never derives an aggregate from a truncated or empty list', () => {
    expect(resolveProductRating(null, list([{rating: 5}], true))).toBeNull();
    expect(resolveProductRating(null, list([]))).toBeNull();
    expect(resolveProductRating(null, null)).toBeNull();
  });
});

describe('summarizeReviews', () => {
  it('averages the listed reviews to two decimals', () => {
    expect(summarizeReviews([{rating: 5}, {rating: 5}, {rating: 4}])).toEqual({rating: 4.67, count: 3});
  });

  it('returns null when there are no reviews', () => {
    expect(summarizeReviews([])).toBeNull();
  });

  it('ignores out-of-range and non-numeric ratings', () => {
    expect(summarizeReviews([{rating: 5}, {rating: 99}, {rating: 0}, {rating: Number.NaN}, {rating: 3}])).toEqual({rating: 4, count: 2});
    expect(summarizeReviews([{rating: 9}])).toBeNull();
  });
});
