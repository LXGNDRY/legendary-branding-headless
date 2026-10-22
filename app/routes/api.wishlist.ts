import type {ActionFunctionArgs, LoaderFunctionArgs} from 'react-router';
import {requireSameOrigin} from '~/lib/security';
import {rateLimitMiddleware} from '~/lib/rate-limit';
import {captureError} from '~/lib/monitoring';
import {MAX_WISHLIST_BODY_BYTES, MAX_WISHLIST_ITEMS, parseWishlistEntries, type WishlistEntry} from '~/lib/wishlist';

/**
 * Wishlist sync API — server-side bridge for Customer Account metafields.
 *
 * GET  /api/wishlist          — fetch wishlist from customer metafield (logged-in only)
 * POST /api/wishlist          — replace entire wishlist (body: { items: WishlistItem[] })
 *
 * Only product identity (GID, handle, addedAt) is stored. Every response,
 * including errors, is private and uncacheable.
 */

const HEADERS = {'Cache-Control': 'no-store', Vary: 'Cookie'} as const;

function respond(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return Response.json(body, {status, headers: {...HEADERS, ...extra}});
}


const CUSTOMER_WISHLIST_QUERY = `#graphql
  query CustomerWishlist {
    customer {
      id
      wishlistMetafield: metafield(namespace: "custom", key: "wishlist") {
        value
      }
    }
  }
` as const;

const CUSTOMER_WISHLIST_UPDATE_MUTATION = `#graphql
  mutation customerWishlistSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        key
        namespace
        value
      }
      userErrors {
        field
        message
      }
    }
  }
` as const;

export async function loader({context}: LoaderFunctionArgs) {
  const {customerAccount} = context;

  if (!customerAccount || !(await customerAccount.isLoggedIn())) {
    return respond({items: []}, 401);
  }

  try {
    const result = await customerAccount.query(CUSTOMER_WISHLIST_QUERY);
    const data = result.data as {
      customer: {id: string; wishlistMetafield: {value: string} | null};
    };

    let items: WishlistEntry[] = [];
    const value = data.customer.wishlistMetafield?.value;
    if (value) {
      try {
        items = parseWishlistEntries(JSON.parse(value));
      } catch {
        // Invalid metafield JSON — start fresh
        items = [];
      }
    }
    return respond({items});
  } catch (error) {
    captureError(error, {route: 'api.wishlist', failure: 'read'});
    return respond({error: 'Failed to load wishlist.'}, 500);
  }
}

export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return respond({error: 'Method not allowed.'}, 405, {Allow: 'GET, POST'});
  }
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  // Rate limiting — 30 requests per minute per IP (wishlist is frequent)
  const rateLimitResponse = rateLimitMiddleware(request, 'wishlist', 30);
  if (rateLimitResponse) return rateLimitResponse;

  const {customerAccount} = context;
  if (!customerAccount || !(await customerAccount.isLoggedIn())) {
    return respond({error: 'Not authenticated.'}, 401);
  }

  const declared = Number(request.headers.get('Content-Length') ?? 0);
  if (declared > MAX_WISHLIST_BODY_BYTES) {
    return respond({error: 'Wishlist is too large.'}, 413);
  }

  let rawItems: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_WISHLIST_BODY_BYTES) {
      return respond({error: 'Wishlist is too large.'}, 413);
    }
    rawItems = (JSON.parse(text) as {items?: unknown} | null)?.items;
  } catch {
    return respond({error: 'Invalid JSON body.'}, 400);
  }
  if (!Array.isArray(rawItems) || rawItems.length > MAX_WISHLIST_ITEMS * 2) {
    return respond({error: 'Invalid items array.'}, 400);
  }
  const items = parseWishlistEntries(rawItems);

  try {
    // Step 1: get customer ID (needed for metafieldsSet's ownerId)
    const customerResult = await customerAccount.query(CUSTOMER_WISHLIST_QUERY);
    const customerId = (customerResult.data as {customer: {id: string}}).customer.id;

    // Step 2: set the wishlist metafield
    const result = await customerAccount.mutate(CUSTOMER_WISHLIST_UPDATE_MUTATION, {
      variables: {
        metafields: [
          {
            ownerId: customerId,
            namespace: 'custom',
            key: 'wishlist',
            value: JSON.stringify(items),
            type: 'json',
          },
        ],
      },
    });

    const data = result.data as {
      metafieldsSet: {userErrors: Array<{field: string[]; message: string}>};
    };
    if (data.metafieldsSet.userErrors?.length > 0) {
      // NOTE: provider messages are not returned to the browser.
      captureError(new Error('Wishlist metafield rejected'), {route: 'api.wishlist', failure: 'userErrors'});
      return respond({error: 'Failed to save wishlist.'}, 400);
    }

    return respond({success: true, items});
  } catch (error) {
    captureError(error, {route: 'api.wishlist', failure: 'write'});
    return respond({error: 'Failed to save wishlist.'}, 500);
  }
}
