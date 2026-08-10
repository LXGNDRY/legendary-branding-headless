import type {HydrogenSession} from '@shopify/hydrogen';

/**
 * Customer Account API utilities.
 *
 * The customer account client is created by createHydrogenContext in context.ts
 * and accessed via context.customerAccount.
 *
 * This file contains helper types and utilities for account-related operations.
 */

/**
 * Helper to safely unwrap the customer account API response.
 * The Customer Account API returns data wrapped differently than Storefront API.
 */
export function unwrapCustomerResponse<T>(response: T): T {
  return response;
}

/**
 * Guard to check if customer account API is available.
 */
export function hasCustomerAccount(
  customerAccount: unknown,
): customerAccount is {
  login: () => Promise<Response>;
  authorize: () => Promise<Response>;
  logout: () => Promise<Response>;
  isLoggedIn: () => Promise<boolean>;
  query: (query: string, options?: unknown) => Promise<unknown>;
} {
  return Boolean(customerAccount);
}

// Re-export HydrogenSession type for convenience
export type {HydrogenSession};
