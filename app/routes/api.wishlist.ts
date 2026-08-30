import type {ActionFunctionArgs, LoaderFunctionArgs} from 'react-router';
import {requireSameOrigin} from '~/lib/security';
import {rateLimitMiddleware} from '~/lib/rate-limit';

/**
 * Wishlist sync API — server-side bridge for Customer Account metafields.
 *
 * GET  /api/wishlist          — fetch wishlist from customer metafield (logged-in only)
 * POST /api/wishlist          — replace entire wishlist (body: { items: WishlistItem[] })
 *
 * Uses the Customer Account API's customerUpdate mutation to write to the
 * custom.wishlist metafield. Returns 200 with items on success, 401 if not
 * logged in, 400 on bad input.
 */

interface WishlistItem {
  id: string;
  handle: string;
  title: string;
  price: string;
  image?: string;
  addedAt: number;
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

  if (!customerAccount) {
    return Response.json({items: []}, {status: 401});
  }

  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return Response.json({items: []}, {status: 401});
  }

  try {
    const result = await customerAccount.query(CUSTOMER_WISHLIST_QUERY);
    const data = result.data as {
      customer: {
        id: string;
        wishlistMetafield: {value: string} | null;
      };
    };

    const value = data.customer.wishlistMetafield?.value;
    let items: WishlistItem[] = [];

    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          items = parsed.filter(
            (item: unknown) =>
              typeof item === 'object' &&
              item !== null &&
              'handle' in item &&
              'id' in item,
          ) as WishlistItem[];
        }
      } catch {
        // Invalid metafield JSON — start fresh
        items = [];
      }
    }

    return Response.json({items});
  } catch (err) {
    console.error('[wishlist] Failed to fetch wishlist:', err);
    return Response.json({error: 'Failed to load wishlist.'}, {status: 500});
  }
}

export async function action({request, context}: ActionFunctionArgs) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  // Rate limiting — 30 requests per minute per IP (wishlist is frequent)
  const rateLimitResponse = rateLimitMiddleware(request, 'wishlist', 30);
  if (rateLimitResponse) return rateLimitResponse;

  const {customerAccount} = context;

  if (!customerAccount) {
    return Response.json({error: 'Not authenticated.'}, {status: 401});
  }

  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return Response.json({error: 'Not authenticated.'}, {status: 401});
  }

  let items: WishlistItem[] = [];
  try {
    const body = (await request.json()) as {items?: unknown};
    if (!Array.isArray(body.items)) {
      return Response.json({error: 'Invalid items array.'}, {status: 400});
    }
    items = body.items as WishlistItem[];
  } catch {
    return Response.json({error: 'Invalid JSON body.'}, {status: 400});
  }

  // Cap at 100 items to avoid oversized metafields
  const trimmedItems = items.slice(0, 100);

  try {
    // Step 1: get customer ID (needed for metafieldsSet's ownerId)
    const customerResult = await customerAccount.query(CUSTOMER_WISHLIST_QUERY);
    const customerData = customerResult.data as {
      customer: {id: string};
    };
    const customerId = customerData.customer.id;

    // Step 2: set the wishlist metafield
    const result = await customerAccount.mutate(
      CUSTOMER_WISHLIST_UPDATE_MUTATION,
      {
        variables: {
          metafields: [
            {
              ownerId: customerId,
              namespace: 'custom',
              key: 'wishlist',
              value: JSON.stringify(trimmedItems),
              type: 'json',
            },
          ],
        },
      },
    );

    const data = result.data as {
      metafieldsSet: {
        metafields: Array<{id: string; key: string; namespace: string; value: string}> | null;
        userErrors: Array<{field: string[]; message: string}>;
      };
    };

    if (data.metafieldsSet.userErrors?.length > 0) {
      return Response.json(
        {error: data.metafieldsSet.userErrors.map((e) => e.message).join(', ')},
        {status: 400},
      );
    }

    return Response.json({success: true, items: trimmedItems});
  } catch (err) {
    console.error('[wishlist] Failed to save wishlist:', err);
    return Response.json({error: 'Failed to save wishlist.'}, {status: 500});
  }
}
