import {describe, expect, it} from 'vitest';
import {resetPagination} from './pagination-params';

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
