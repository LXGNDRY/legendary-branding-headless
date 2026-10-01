import {describe, it, expect, vi, afterEach} from 'vitest';
import {parseJudgemeBadge, fetchJudgemeQuotes} from './judgeme';

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
        {id: 1, rating: 5, body: 'This is a wonderfully long review body.', reviewer: {name: 'Jordan Alvarez'}, hidden: false},
        {id: 2, rating: 2, body: 'This is also a long enough review body.', reviewer: {name: 'Taylor Smith'}, hidden: false},
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
        {id: 7, rating: 5, body: 'A sufficiently long review body for the quote card.', reviewer: {name: 'Madonna'}, hidden: false},
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
});
