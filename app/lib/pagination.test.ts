import {describe, expect, it} from 'vitest';
import {fetchAllPages} from './pagination';

describe('fetchAllPages', () => {
  it('follows endCursor until the last page', async () => {
    const seen: (string | null)[] = [];
    const pages: Record<string, {nodes: number[]; pageInfo: {hasNextPage: boolean; endCursor: string | null}}> = {
      start: {nodes: [1, 2], pageInfo: {hasNextPage: true, endCursor: 'a'}},
      a: {nodes: [3, 4], pageInfo: {hasNextPage: true, endCursor: 'b'}},
      b: {nodes: [5], pageInfo: {hasNextPage: false, endCursor: null}},
    };
    const result = await fetchAllPages(async (after) => {
      seen.push(after);
      return pages[after ?? 'start'];
    });
    expect(result).toEqual([1, 2, 3, 4, 5]);
    expect(seen).toEqual([null, 'a', 'b']);
  });

  it('makes one request when everything fits on a page', async () => {
    let calls = 0;
    const result = await fetchAllPages(async () => {
      calls += 1;
      return {nodes: ['x'], pageInfo: {hasNextPage: false}};
    });
    expect(result).toEqual(['x']);
    expect(calls).toBe(1);
  });

  it('stops on an empty response and on a missing cursor', async () => {
    expect(await fetchAllPages(async () => null)).toEqual([]);
    let calls = 0;
    const result = await fetchAllPages(async () => {
      calls += 1;
      return {nodes: [calls], pageInfo: {hasNextPage: true, endCursor: null}};
    });
    expect(result).toEqual([1]);
  });

  it('is bounded even if the connection never ends', async () => {
    let calls = 0;
    await fetchAllPages(async () => {
      calls += 1;
      return {nodes: [calls], pageInfo: {hasNextPage: true, endCursor: 'again'}};
    });
    expect(calls).toBe(20);
  });
});
