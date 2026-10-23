/**
 * Clears every Hydrogen pagination dimension from a URL. Hydrogen paginates
 * with BOTH `cursor` and `direction`; deleting only the cursor on a sort or
 * filter change leaves `direction=previous` behind, which then loads the LAST
 * page of the new result set instead of the first.
 */
export function resetPagination(params: URLSearchParams, namespace = ''): URLSearchParams {
  const prefix = namespace ? `${namespace}_` : '';
  params.delete(`${prefix}cursor`);
  params.delete(`${prefix}direction`);
  return params;
}


/** Normalize Hydrogen's coupled cursor/direction pair before loading or declaring a canonical page. */
export function normalizePagination(params: URLSearchParams): URLSearchParams {
  const cursor = params.get('cursor');
  if (!cursor || cursor.length > 2048 || !/^[A-Za-z0-9+/=_-]+$/.test(cursor) || params.getAll('cursor').length !== 1) {
    return resetPagination(params);
  }
  params.set('direction', params.get('direction') === 'previous' ? 'previous' : 'next');
  return params;
}

/** Only true pagination affects collection identity; tracking and variant parameters never do. */
export function paginationSearch(search: string): string {
  const params = normalizePagination(new URLSearchParams(search));
  const cursor = params.get('cursor');
  if (!cursor) return '';
  return `?${new URLSearchParams({cursor, direction: params.get('direction')!})}`;
}
