import {describe, it, expect, vi, afterEach} from 'vitest';
import {parseJudgemeBadge, fetchJudgemeQuotes, fetchJudgemeProductReviews, isTemplatedReview} from './judgeme';

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

  it('falls back to a deterministic placeholder name for a single-token name', async () => {
    const body = JSON.stringify({
      reviews: [
        {id: 7, rating: 5, body: 'Picked this up after seeing it online and it genuinely exceeded what I expected from the fit.', reviewer: {name: 'Madonna'}, hidden: false},
      ],
    });
    global.fetch = vi.fn().mockResolvedValue(new Response(body, {status: 200}));

    const quotes = await fetchJudgemeQuotes({apiToken: 'x', shopDomain: 'test.myshopify.com'});

    expect(quotes).toHaveLength(1);
    expect(quotes[0].reviewerName).not.toBe('Madonna');
    expect(quotes[0].reviewerName).toMatch(/^[A-Za-z]+ [A-Z]\.$/);

    // Same review id always resolves to the same fallback name.
    global.fetch = vi.fn().mockResolvedValue(new Response(body, {status: 200}));
    const quotesAgain = await fetchJudgemeQuotes({apiToken: 'x', shopDomain: 'test.myshopify.com'});
    expect(quotesAgain[0].reviewerName).toBe(quotes[0].reviewerName);
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

    expect(result.map((r) => r.id)).toEqual([1, 2, 3, 4]);
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

    expect(result).toHaveLength(6);
    expect(urls.every((u) => u.includes('reviews_for_widget') && u.includes('product_id=8507670364313'))).toBe(true);
    expect(urls.some((u) => u.includes('api_token'))).toBe(false);
    expect(result[0]).toMatchObject({
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
    expect(result.map((r) => r.id)).toEqual([9]);
  });

  it('returns an empty list when the widget endpoint fails and no token is set', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('', {status: 500}));
    const result = await fetchJudgemeProductReviews({shopDomain: 'test.myshopify.com', productId: '1', productHandle: 'tee'});
    expect(result).toEqual([]);
  });
});
