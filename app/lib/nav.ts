export interface NavCollectionItem {
  id: string;
  title: string;
  handle: string;
  url: string;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
}

// Reads Shopify's own "Main Menu" navigation (Online Store -> Navigation),
// so the storefront's collection nav always matches whatever order/links
// the merchant has set in Shopify Admin -- no hardcoded collection list to
// fall out of sync when a collection is renamed, reordered, or swapped.
export const MAIN_MENU_QUERY = `#graphql
  query MainMenu($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    menu(handle: "main-menu") {
      items {
        id
        title
        type
        url
        resourceId
      }
    }
  }
` as const;

// Storefront API's MenuItem only carries a resourceId for a COLLECTION item,
// not the collection's handle/image -- resolve those in one batched `nodes`
// lookup instead of hardcoding a handle per nav label.
export const NAV_COLLECTIONS_QUERY = `#graphql
  query NavCollections($ids: [ID!]!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Collection {
        id
        title
        handle
        image {
          url
          altText
          width
          height
        }
      }
    }
  }
` as const;

// Every collection published to this storefront's sales channel (the Storefront
// API never returns an unpublished one), newest first. Used to add collections
// the merchant has not put in the Main Menu yet, so a new collection reaches the
// header and footer without anyone editing the menu or the code.
export const NAV_ALL_COLLECTIONS_QUERY = `#graphql
  query NavAllCollections($country: CountryCode, $language: LanguageCode, $first: Int!)
    @inContext(country: $country, language: $language) {
    collections(first: $first, sortKey: ID, reverse: true) {
      nodes {
        id
        title
        handle
        image {
          url
          altText
          width
          height
        }
        products(first: 1) {
          nodes {
            id
          }
        }
      }
    }
  }
` as const;

export type MenuItemNode = {
  id: string;
  title: string;
  type: string;
  url?: string | null;
  resourceId?: string | null;
};

export type CollectionNode = {
  id: string;
  title: string;
  handle: string;
  image?: NavCollectionItem['image'];
} | null;

/**
 * Resolves Shopify's main-menu items down to just its COLLECTION entries,
 * in the merchant's own menu order, with each collection's live handle and
 * image attached.
 */
export function resolveMenuCollections(
  menuItems: MenuItemNode[],
  collectionNodes: CollectionNode[],
): NavCollectionItem[] {
  const collectionsById = new Map(
    collectionNodes.filter((node): node is NonNullable<CollectionNode> => Boolean(node)).map((node) => [node.id, node]),
  );

  const resolved: NavCollectionItem[] = [];
  for (const item of menuItems) {
    if (item.type !== 'COLLECTION' || !item.resourceId) continue;
    const collection = collectionsById.get(item.resourceId);
    if (!collection) continue;
    resolved.push({
      id: item.id,
      title: item.title,
      handle: collection.handle,
      url: `/collections/${collection.handle}`,
      image: collection.image ?? null,
    });
  }
  return resolved;
}

export type PublishedCollectionNode = {
  id: string;
  title: string;
  handle: string;
  image?: NavCollectionItem['image'];
  products?: {nodes: {id: string}[]} | null;
} | null;

/**
 * The Main Menu's collections in the merchant's own order, followed by any other
 * published collection that has products and is not already in the menu. A
 * collection the merchant wants first (or relabelled) goes in the menu; one they
 * never added still shows up instead of silently missing from the header.
 */
export function mergeNavCollections(
  menuCollections: NavCollectionItem[],
  publishedCollections: PublishedCollectionNode[],
): NavCollectionItem[] {
  const seen = new Set(menuCollections.map((c) => c.handle));
  const extras: NavCollectionItem[] = [];
  for (const node of publishedCollections) {
    if (!node || seen.has(node.handle)) continue;
    if (!node.products?.nodes?.length) continue;
    seen.add(node.handle);
    extras.push({
      id: node.id,
      title: node.title,
      handle: node.handle,
      url: `/collections/${node.handle}`,
      image: node.image ?? null,
    });
  }
  return [...menuCollections, ...extras];
}
