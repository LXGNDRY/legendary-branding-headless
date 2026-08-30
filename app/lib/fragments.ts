/**
 * Custom cart GraphQL fragments.
 *
 * Hydrogen's `createHydrogenContext` falls back to built-in default cart
 * fragments when no `cart.queryFragment`/`cart.mutateFragment` is supplied.
 * The default *mutation* fragment (used by every `cart.addLines` /
 * `updateLines` / `removeLines` / `updateDiscountCodes` call) only selects
 * `{ id totalQuantity checkoutUrl }` — no `lines`, `cost`, or
 * `discountCodes` — and the default *read* fragment (used by
 * `context.cart.get()`) has no `discountAllocations`, so no dollar amount
 * for an applied discount is ever available anywhere in the app.
 *
 * These fragments restore full parity with what the app already relies on
 * (see `CartData`/`CartLineData` in `~/lib/cart`) and add
 * `discountAllocations` so discount amounts can actually be rendered.
 *
 * Wired into `createHydrogenContext` in `~/lib/context`.
 */

// Hydrogen requires the query fragment to be named exactly `CartApiQuery`
// and the mutation fragment exactly `CartApiMutation` — reusing one
// fragment body under both names makes Hydrogen's own composed operations
// fail server-side with "Fragment CartApiMutation was used, but not
// defined" / "Fragment CartApiQuery was defined, but not used", confirmed
// against a live build. So both fragments below declare the same field
// selection independently rather than sharing it through a helper: the
// `shopify hydrogen codegen` step statically parses `#graphql` tagged
// templates and cannot resolve a function call inside one (confirmed via
// CI: it fails with "Syntax Error: Expected Name" on the unresolved call) —
// unlike a plain runtime build, which evaluates the template literal
// normally. Keeping both as flat literals avoids that entirely.
//
// The read fragment paginates lines with the `$numCartLines` variable
// Hydrogen's `cart` query operation declares (defaulted by Hydrogen itself
// when `context.cart.get()` is called without an explicit `numCartLines`).
export const CART_QUERY_FRAGMENT = `#graphql
  fragment CartApiQuery on Cart {
    updatedAt
    id
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: $numCartLines) {
      edges {
        node {
          id
          quantity
          attributes {
            key
            value
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            amountPerQuantity {
              amount
              currencyCode
            }
            compareAtAmountPerQuantity {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              availableForSale
              compareAtPrice {
                amount
                currencyCode
              }
              price {
                amount
                currencyCode
              }
              requiresShipping
              title
              image {
                id
                url
                altText
                width
                height
              }
              product {
                handle
                title
                id
                vendor
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
      totalDutyAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      applicable
      code
    }
    discountAllocations {
      discountedAmount {
        amount
        currencyCode
      }
      ... on CartCodeDiscountAllocation {
        code
      }
      ... on CartAutomaticDiscountAllocation {
        title
      }
      ... on CartCustomDiscountAllocation {
        title
      }
    }
    appliedGiftCards {
      id
      lastCharacters
      amountUsed {
        amount
        currencyCode
      }
    }
  }
` as const;

// Mutations (addLines/updateLines/removeLines/updateDiscountCodes) select
// the same full field set so every cart action returns the complete cart
// shape the UI needs — not just Hydrogen's crippled 3-field mutation
// default — but must be declared under the `CartApiMutation` fragment name
// Hydrogen's own generated mutation documents reference. Unlike the `cart`
// query, Hydrogen's mutation operations (cartLinesAdd/Update/Remove/
// cartDiscountCodesUpdate, etc.) do NOT declare a `$numCartLines` variable,
// so this fragment paginates with a fixed line count instead — confirmed
// against Hydrogen's own generated mutation documents, which only declare
// `$cartId`/`$lines`/visitor-consent variables.
export const CART_MUTATE_FRAGMENT = `#graphql
  fragment CartApiMutation on Cart {
    updatedAt
    id
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: 250) {
      edges {
        node {
          id
          quantity
          attributes {
            key
            value
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            amountPerQuantity {
              amount
              currencyCode
            }
            compareAtAmountPerQuantity {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              availableForSale
              compareAtPrice {
                amount
                currencyCode
              }
              price {
                amount
                currencyCode
              }
              requiresShipping
              title
              image {
                id
                url
                altText
                width
                height
              }
              product {
                handle
                title
                id
                vendor
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
      totalDutyAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      applicable
      code
    }
    discountAllocations {
      discountedAmount {
        amount
        currencyCode
      }
      ... on CartCodeDiscountAllocation {
        code
      }
      ... on CartAutomaticDiscountAllocation {
        title
      }
      ... on CartCustomDiscountAllocation {
        title
      }
    }
    appliedGiftCards {
      id
      lastCharacters
      amountUsed {
        amount
        currencyCode
      }
    }
  }
` as const;
