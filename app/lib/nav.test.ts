import {describe, it, expect} from 'vitest';
import {resolveMenuCollections, type MenuItemNode, type CollectionNode} from './nav';

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
