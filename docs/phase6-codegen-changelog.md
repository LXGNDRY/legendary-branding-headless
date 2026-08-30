# Phase 6 — Codegen & GraphQL Validation Changelog

> Real type-safety gate for Storefront + Customer Account GraphQL.
> Fixes the DB-level bugs that could never be caught before this phase.

---

## Overview

Phase 6 turns `npm run codegen` into a real CI gate that validates **every
GraphQL document** in the codebase against the correct API schema, and fixes
the class of bugs that gate exists to catch — matching the audit goal of
"generate real API types and stop treating codegen as an afterthought."

Previously:
- `storefrontapi.generated.d.ts` and `customeraccountapi.generated.d.ts` were
  6-line stubs with empty `GeneratedQueryTypes` / `GeneratedMutationTypes`
  interfaces
- CI's codegen step was `continue-on-error: true`, so it never blocked anything
- Nothing validated GraphQL queries against the schemas until runtime (when the
  app hit the live Storefront API)

Now:
- Codegen validates every Storefront and Customer Account query/mutation
  against the correct schema, in CI, on every push/PR
- Invalid GraphQL fails the job and blocks the PR
- The address and account mutations were corrected to the real Customer
  Account API schema (details below) — these were silently broken at runtime
  and could not have been caught any other way

---

## 1. Codegen Configuration Fix

**File:** `.graphqlrc.ts`

The `.graphqlrc.ts` defines two projects:
- `default` — Storefront API schema (`storefront.schema.json`), matching storefront documents
- `customer` — Customer Account API schema (`customer-account.schema.json`), matching account documents

**Bug fixed:** `app/routes/api.wishlist.ts` (the wishlist metafield sync route,
added in Phase 5) uses Customer Account API mutations but was being matched by
the `default` (Storefront) project's document globs. So codegen validated its
Customer Account mutations against the Storefront schema — which always failed
(Storefront's `customerUpdate` requires a `customerAccessToken`; it has no
`metafieldsSet`). This is why codegen never passed with `api.wishlist.ts` in the
repo.

**Change:**
- Excluded `app/routes/api.wishlist.ts` from the `default` project
- Added it to the `customer` project's document globs

Now each document goes to the schema it actually uses.

---

## 2. Mutation Corrections (caught by codegen)

Once codegen validated the Customer Account project against the correct schema,
it surfaced real bugs in the Phase 5 account mutations. All were fixed.

### Wishlist sync — `api.wishlist.ts`
**File:** `app/routes/api.wishlist.ts`

The Phase 5 implementation wrote the wishlist metafield via
`customerUpdate(customer: { metafields: ... })` — a Storefront API shape. The
Customer Account API:
- has **no `metafields` field** on `CustomerUpdateInput` (only `firstName` + `lastName`)
- provides dedicated **`metafieldsSet`** / `metafieldsDelete` top-level mutations

**Fix:** switched to `metafieldsSet`. The write path now:
1. Queries the customer `id`
2. Calls `metafieldsSet` with `{ ownerId, namespace: "custom", key: "wishlist", type: "json", value }`

### Address CRUD — `account.addresses.tsx`
**File:** `app/routes/account.addresses.tsx`

Four issues, all fixed:

| Issue | Was | Fixed to |
|---|---|---|
| Input type | `MailingAddressInput` | `CustomerAddressInput` |
| Update arg | `$id` / `id: $id` | `$addressId` / `addressId: $addressId` |
| Delete arg | `$id` / `id: $id` | `$addressId` / `addressId: $addressId` |
| Delete return | `deletedCustomerAddressId` | `deletedAddressId` |

**Input field mapping (CustomerAddressInput):** the input type uses `zoneCode`
(not `province`) and `territoryCode` (not `country`). The action now maps the
form's `province` → `zoneCode` and derives `territoryCode` from the `country`
field (defaults to `US`).

### Profile edit — `account.edit.tsx`
**File:** `app/routes/account.edit.tsx`

`customerUpdate` in the Customer Account API takes its arg as `input`, not
`customer`.

| Was | Fixed to |
|---|---|
| `customerUpdate($customer: CustomerUpdateInput!)` | `customerUpdate($input: CustomerUpdateInput!)` |
| `customerUpdate(customer: $customer)` | `customerUpdate(input: $input)` |
| `variables: { customer: ... }` | `variables: { input: ... }` |

### Set-default removed — `account.addresses.tsx`
**File:** `app/routes/account.addresses.tsx`

The audit and codegen confirmed the Customer Account API has **no**
`customerDefaultAddressUpdate` mutation (it's Storefront-only). The dedicated
"Set as Default" button and its action handler were removed. Default-address
indication is still displayed read-only; setting a default requires using the
Storefront API separately (documented as future work).

---

## 3. CI Gate — real, not optional

**File:** `.github/workflows/oxygen-deployment-1000167667.yml`

The codegen step was:

```yaml
- name: Generate Storefront API types
  run: npm run codegen
  # ...
  continue-on-error: true   # ← never blocked anything
```

**Change:** removed `continue-on-error: true` and renamed the step to
"Codegen + GraphQL validation (Storefront & Customer Account)".

The step still runs before Build / Typecheck / Lint / Test in the same Quality
Gate job, so:
1. It validates every GraphQL document against the correct schema
2. It generates the `.d.ts` type files in the CI runner
3. If any query/mutation is invalid, the job fails and the PR is blocked

**What this catches:** the exact class of bugs this whole audit flagged as
unfindable — unused GraphQL variables, invalid field names, wrong mutation
shapes (like the `totalCount` field that crashed every collection page, and the
`$first` unused variable that crashed the homepage). Those are now compile-time
CI failures instead of production outages.

---

## 4. Generated Types (.d.ts)

The committed `storefrontapi.generated.d.ts` and
`customeraccountapi.generated.d.ts` remain the empty stubs — they are populated
with real, schema-derived operation types when codegen runs against the live
store with real `PUBLIC_STOREFRONT_API_TOKEN` + `PUBLIC_STORE_DOMAIN` CI
secrets.

Because the generate phase needs live credentials, the **validation gate is the
deliverable that runs everywhere** (it works against the bundled schema JSONs
with placeholder tokens). Routes continue to use their existing explicit TS
interfaces, which already passed typecheck; migrating them onto the generated
`GeneratedQueryTypes` map is deferred until the populated files are committed
(from a CI run with real secrets).

---

## 5. Files Changed

| File | Change |
|---|---|
| `.graphqlrc.ts` | Route `api.wishlist.ts` to the Customer Account project |
| `app/routes/api.wishlist.ts` | Wishlist write via `metafieldsSet` + `ownerId` |
| `app/routes/account.addresses.tsx` | Correct input type, arg names, field mapping; removed set-default |
| `app/routes/account.edit.tsx` | `customerUpdate` uses `input` arg |
| `.github/workflows/oxygen-deployment-1000167667.yml` | Codegen is now a real gate |

## 6. Checks
- ✅ Codegen passes validation (no GraphQL document errors)
- ✅ Typecheck passes (`npm run typecheck`)
- ✅ Build passes (`npm run build`)
- ✅ Lint passes (`npm run lint`)

## 7. Significance
With Phase 6, the storefront closes the loop on the audit's central finding:
**`continue-on-error: true` let site-breaking GraphQL reach production twice.**
Codegen validation is now a hard CI gate — the same class of error becomes a
blocked PR, reported automatically, instead of a live-site outage found by a
manual curl sweep.