import {describe, expect, it} from 'vitest';
import {resetPagination, normalizePagination, paginationSearch} from './pagination-params';

describe('resetPagination', () => {
  it('clears both cursor and direction so a new sort/filter starts on the first page', () => {
    const params = new URLSearchParams('sort=price&cursor=abc&direction=previous&type=Hoodie');
    expect(resetPagination(params).toString()).toBe('sort=price&type=Hoodie');
  });

  it('handles namespaced pagination and leaves other namespaces alone', () => {
    const params = new URLSearchParams('products_cursor=a&products_direction=next&reviews_cursor=b');
    expect(resetPagination(params, 'products').toString()).toBe('reviews_cursor=b');
  });

  it('is a no-op when nothing is paginated', () => {
    expect(resetPagination(new URLSearchParams('a=1')).toString()).toBe('a=1');
  });
});


describe('pagination identity', () => {
  it('cannot load the last page merely by supplying direction without a cursor', () => {
    expect(normalizePagination(new URLSearchParams('direction=previous&utm_source=x')).toString()).toBe('utm_source=x');
  });
  it('keeps a valid backwards page distinct and discards tracking', () => {
    expect(paginationSearch('?cursor=opaque&direction=previous&utm_source=x')).toBe('?cursor=opaque&direction=previous');
  });
  it('normalizes the default direction consistently with Hydrogen', () => {
    expect(paginationSearch('?cursor=opaque&direction=invalid')).toBe('?cursor=opaque&direction=next');
  });
  it.each(['?cursor=a&cursor=b', '?cursor=%00', '?cursor='])('does not invent a page from %s', (search) => {
    expect(paginationSearch(search)).toBe('');
  });
});
