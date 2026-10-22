export type PageInfoLike = {hasNextPage: boolean; endCursor?: string | null};

// NOTE: bounded so a misbehaving connection can never loop a request forever. Callers reading 100 per page can raise it to cover Shopify's 2,048-variant product limit.
const MAX_PAGES = 20;

/** Reads every page of a Storefront connection, following `endCursor` until `hasNextPage` is false. */
export async function fetchAllPages<T>(
  fetchPage: (after: string | null) => Promise<{nodes: T[]; pageInfo: PageInfoLike} | null | undefined>,
  maxPages = MAX_PAGES,
): Promise<T[]> {
  const all: T[] = [];
  let after: string | null = null;
  for (let page = 0; page < maxPages; page += 1) {
    const connection = await fetchPage(after);
    if (!connection) break;
    all.push(...connection.nodes);
    if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) break;
    after = connection.pageInfo.endCursor;
  }
  return all;
}
