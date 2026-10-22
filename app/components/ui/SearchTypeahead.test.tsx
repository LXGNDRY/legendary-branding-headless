// @vitest-environment jsdom
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import SearchTypeahead from './SearchTypeahead';
import {LocaleProvider} from '~/lib/i18n';

type Deferred = {resolve: (body: unknown) => void; signal?: AbortSignal | null; url: string};

const product = (title: string, amount = '49.00', currencyCode = 'USD') => ({
  id: `gid://shopify/Product/${title}`,
  title,
  handle: title.toLowerCase(),
  vendor: 'LB',
  featuredImage: null,
  priceRange: {minVariantPrice: {amount, currencyCode}},
  reviewBadge: null,
});

function result(...products: ReturnType<typeof product>[]) {
  return {products, collections: [], queries: []};
}

function renderTypeahead(language: 'EN' | 'DE' = 'EN', count = 1) {
  return render(
    <MemoryRouter>
      <LocaleProvider language={language}>
        {Array.from({length: count}, (_, i) => (
          <SearchTypeahead key={i} />
        ))}
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe('SearchTypeahead', () => {
  let pending: Deferred[];

  beforeEach(() => {
    vi.useFakeTimers();
    pending = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        return new Promise<Response>((resolve, reject) => {
          const entry: Deferred = {
            url,
            signal: init?.signal,
            resolve: (body) => resolve(new Response(JSON.stringify(body), {status: 200})),
          };
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
          pending.push(entry);
        });
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const type = (value: string, index = 0) =>
    act(async () => {
      fireEvent.change(screen.getAllByRole('combobox')[index], {target: {value}});
      await vi.advanceTimersByTimeAsync(250);
    });

  it('never lets an older response overwrite newer results', async () => {
    renderTypeahead();
    await type('te');
    await type('tee');
    expect(pending).toHaveLength(2);
    expect(pending[0].signal?.aborted).toBe(true);

    await act(async () => pending[1].resolve(result(product('Newer'))));
    expect(screen.getByText('Newer')).toBeTruthy();

    // the aborted, older request resolving late changes nothing
    await act(async () => pending[0].resolve(result(product('Older'))));
    expect(screen.queryByText('Older')).toBeNull();
    expect(screen.getByText('Newer')).toBeTruthy();
  });

  it('does not reopen the list when a response arrives after the input was cleared', async () => {
    renderTypeahead();
    await type('tee');
    await type('');
    expect(pending[0].signal?.aborted).toBe(true);
    await act(async () => pending[0].resolve(result(product('Ghost'))));
    expect(screen.queryByText('Ghost')).toBeNull();
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('false');
  });

  it('aborts the in-flight request on unmount', async () => {
    const {unmount} = renderTypeahead();
    await type('tee');
    unmount();
    expect(pending[0].signal?.aborted).toBe(true);
  });

  it('shows prices in the API currency and the active language, not a hardcoded dollar sign', async () => {
    renderTypeahead('DE');
    await type('tee');
    await act(async () => pending[0].resolve(result(product('Hemd', '1234.5', 'EUR'))));
    const text = document.body.textContent ?? '';
    expect(text).toContain('€');
    expect(text).toContain('1.234,50');
    expect(text).not.toContain('$1234.5');
  });

  it('gives two instances on one page distinct ARIA targets', async () => {
    renderTypeahead('EN', 2);
    const boxes = screen.getAllByRole('combobox');
    const controls = boxes.map((box) => box.getAttribute('aria-controls'));
    expect(controls[0]).toBeTruthy();
    expect(controls[0]).not.toBe(controls[1]);
  });
});
