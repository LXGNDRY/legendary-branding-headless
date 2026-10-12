import {describe, it, expect} from 'vitest';
import {mergeNavCollections, resolveMenuCollections, type MenuItemNode, type CollectionNode, type NavCollectionItem, type PublishedCollectionNode} from './nav';

describe('resolveMenuCollections', () => {
  it('returns collections in the menu\'s own order, with handle/image resolved', () => {
    const menuItems: MenuItemNode[] = [
      {id: 'gid://menu/1', title: 'Hoodies', type: 'COLLECTION', resourceId: 'gid://collection/1'},
      {id: 'gid://menu/2', title: 'About', type: 'PAGE', resourceId: null},
      {id: 'gid://menu/3', title: 'Shirts', type: 'COLLECTION', resourceId: 'gid://collection/2'},
    ];
    const collectionNodes: CollectionNode[] = [
      {id: 'gid://collection/1', title: 'Hoodies & Jackets', handle: 'hoodies-jackets', image: null},
      {id: 'gid://collection/2', title: 'Shirts & Tops', handle: 'shirts-tops', image: null},
    ];

    const result = resolveMenuCollections(menuItems, collectionNodes);

    expect(result).toEqual([
      {id: 'gid://menu/1', title: 'Hoodies', handle: 'hoodies-jackets', url: '/collections/hoodies-jackets', image: null},
      {id: 'gid://menu/3', title: 'Shirts', handle: 'shirts-tops', url: '/collections/shirts-tops', image: null},
    ]);
  });

  it('skips non-COLLECTION menu items', () => {
    const menuItems: MenuItemNode[] = [
      {id: 'gid://menu/1', title: 'About', type: 'PAGE', resourceId: 'gid://page/1'},
      {id: 'gid://menu/2', title: 'External', type: 'HTTP', resourceId: null},
    ];
    expect(resolveMenuCollections(menuItems, [])).toEqual([]);
  });

  it('skips a COLLECTION item whose resourceId has no matching node (e.g. an unpublished collection)', () => {
    const menuItems: MenuItemNode[] = [
      {id: 'gid://menu/1', title: 'Gone', type: 'COLLECTION', resourceId: 'gid://collection/missing'},
    ];
    expect(resolveMenuCollections(menuItems, [])).toEqual([]);
  });

  it('skips a COLLECTION item with no resourceId at all', () => {
    const menuItems: MenuItemNode[] = [
      {id: 'gid://menu/1', title: 'Weird', type: 'COLLECTION', resourceId: null},
    ];
    expect(resolveMenuCollections(menuItems, [])).toEqual([]);
  });

  it('filters out null entries in collectionNodes (Shopify nodes() returns null for a missing id)', () => {
    const menuItems: MenuItemNode[] = [
      {id: 'gid://menu/1', title: 'Hoodies', type: 'COLLECTION', resourceId: 'gid://collection/1'},
    ];
    const collectionNodes: CollectionNode[] = [
      null,
      {id: 'gid://collection/1', title: 'Hoodies', handle: 'hoodies-jackets', image: null},
    ];
    const result = resolveMenuCollections(menuItems, collectionNodes);
    expect(result).toHaveLength(1);
    expect(result[0].handle).toBe('hoodies-jackets');
  });
});

describe('mergeNavCollections', () => {
  const menu: NavCollectionItem[] = [
    {id: 'gid://menu/1', title: 'OUTERWEAR', handle: 'hoodies-jackets', url: '/collections/hoodies-jackets', image: null},
    {id: 'gid://menu/2', title: 'SHIRTS & TOPS', handle: 'shirts-tops', url: '/collections/shirts-tops', image: null},
  ];
  const published = (handle: string, count = 1, title = handle.toUpperCase()): PublishedCollectionNode => ({
    id: `gid://collection/${handle}`,
    title,
    handle,
    image: null,
    products: {nodes: Array.from({length: count}, (_, i) => ({id: `p${i}`}))},
  });

  it('keeps the menu first and in the merchant\'s order, then appends a published collection missing from the menu', () => {
    const result = mergeNavCollections(menu, [published('halloween-26', 13, "HALLOWEEN '26"), published('shirts-tops'), published('hoodies-jackets')]);
    expect(result.map((c) => c.handle)).toEqual(['hoodies-jackets', 'shirts-tops', 'halloween-26']);
    expect(result[2]).toEqual({
      id: 'gid://collection/halloween-26',
      title: "HALLOWEEN '26",
      handle: 'halloween-26',
      url: '/collections/halloween-26',
      image: null,
    });
  });

  it('keeps the menu label for a collection that is in both', () => {
    const result = mergeNavCollections(menu, [published('hoodies-jackets', 5, 'Hoodies & Jackets')]);
    expect(result[0].title).toBe('OUTERWEAR');
    expect(result).toHaveLength(2);
  });

  it('skips empty collections and null nodes', () => {
    const result = mergeNavCollections(menu, [published('empty', 0), null, {...published('no-products'), products: null}]);
    expect(result).toEqual(menu);
  });

  it('lists a collection once even if the API returns it twice', () => {
    const result = mergeNavCollections([], [published('a'), published('a'), published('b')]);
    expect(result.map((c) => c.handle)).toEqual(['a', 'b']);
  });

  it('returns the menu alone when the published-collections lookup came back empty', () => {
    expect(mergeNavCollections(menu, [])).toEqual(menu);
  });
});
