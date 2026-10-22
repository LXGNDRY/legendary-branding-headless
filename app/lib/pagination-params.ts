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
