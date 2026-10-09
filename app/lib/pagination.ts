export type PageInfoLike = {hasNextPage: boolean; endCursor?: string | null};

// NOTE: bounded so a misbehaving connection can never loop a request forever; 20 pages of 50 is far beyond any real catalog.
const MAX_PAGES = 20;

/** Reads every page of a Storefront connection, following `endCursor` until `hasNextPage` is false. */
export async function fetchAllPages<T>(
  fetchPage: (after: string | null) => Promise<{nodes: T[]; pageInfo: PageInfoLike} | null | undefined>,
): Promise<T[]> {
  const all: T[] = [];
  let after: string | null = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const connection = await fetchPage(after);
    if (!connection) break;
    all.push(...connection.nodes);
    if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) break;
    after = connection.pageInfo.endCursor;
  }
  return all;
}
