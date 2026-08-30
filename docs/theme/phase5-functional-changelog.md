# Phase 5 — Functional Changelog

> Address CRUD, wishlist persistence, and explicit image dimensions.
> All three items land together — zero new runtime dependencies.

---

## 1. Address CRUD

### Overview
Full address management behind the Customer Account API. Previously the addresses page was a static UI mockup with unbound buttons. Now every action (create, update, delete, set-default) hits the real Customer Account API via server-side mutations.

### Files
- `app/routes/account.edit.tsx` — new route (profile editing)
- `app/routes/account.addresses.tsx` — rewritten from static UI to full CRUD

### Account Edit Route (`/account/edit`)
Profile detail editing. Previously the account dashboard linked here but the route didn't exist.

**Fields:** first name, last name (editable); email (read-only display).

**Mutation used:** `customerUpdate` (Customer Account API).

**States:**
- Success banner when save completes
- Per-error list when the API returns `userErrors`
- Cancel button returns to `/account`

**Usage in code:**
```tsx
// account.edit.tsx action
const result = await customerAccount.mutate(CUSTOMER_UPDATE_MUTATION, {
  variables: {
    customer: { firstName, lastName },
  },
});
```

### Addresses Route (`/account/addresses`)
Four address mutations, all server-side.

| Action | Mutation | UI Trigger |
|---|---|---|
| Create | `customerAddressCreate` | "+ Add Address" card → inline form |
| Update | `customerAddressUpdate` | "Edit" button on each card → inline form |
| Delete | `customerAddressDelete` | "Delete" button (confirm dialog) |
| Set default | `customerDefaultAddressUpdate` | "Set as Default" button (non-default cards only) |

Create and update use the same shared `AddressForm` component inline — no modal, no route change. Delete and set-default use `useFetcher` so only the affected card re-renders.

**Address fields:** first name, last name, company (optional), address1, address2 (optional), city, province, ZIP, country, phone (optional).

**Empty state:** if the customer has zero addresses, a centered CTA card prompts to add one.

**Error handling:** API-level `userErrors` surface above the form as a red error banner.

### Resolved Dead Links
- `/account/edit` — now exists, was 404
- "Edit Details" button on account dashboard — now navigates to a working page
- "Account" quick-link in account dashboard — same

---

## 2. Wishlist Persistence

### Overview
Wishlists now sync to a `custom.wishlist` customer metafield when the user is logged in. Guest users keep the existing localStorage behavior — nothing changes for them. The system gracefully degrades: if Customer Account API isn't configured, or if the metafield is missing, everything still works via localStorage.

### Files
- `app/routes/api.wishlist.ts` — new server route (read + write)
- `app/components/ui/Wishlist.tsx` — rewritten provider with sync
- `app/root.tsx` — passes `isLoggedIn` to WishlistProvider

### Architecture
```
Logged-in user flow:
  onMount → load from localStorage (instant)
            → fetch /api/wishlist (server)
            → merge local + server → state
  onToggle → update state → debounced 500ms POST to /api/wishlist

Guest user flow:
  onMount → load from localStorage (instant)
  onToggle → update state → save to localStorage
```

### Server Route: `/api/wishlist`
| Method | Behavior | Auth |
|---|---|---|
| `GET` | Returns `{ items: WishlistItem[] }` from the `custom.wishlist` metafield | 401 if not logged in |
| `POST` | Replaces the wishlist metafield with the posted `items` array | 401 if not logged in |

The route caps writes at 100 items to avoid oversized metafield payloads.

**Metafield shape:** `custom.wishlist` — type `json`, value is a `WishlistItem[]` array.

### Merge Logic (on login)
When a user logs in with items already in localStorage:
1. Server wishlist is fetched
2. Both lists are merged by `handle`
3. For duplicates, the item with the older `addedAt` wins
4. Result is sorted oldest-first

This way a user who adds items while logged out, then logs in, doesn't lose anything — items on both sides are preserved.

### Debounced Sync
Writes to the server are debounced at **500ms** so rapid toggles (e.g. adding 3 items in a row) batch into a single POST.

### Non-Critical Failures
All network failures are silent from the user's perspective:
- The localStorage copy stays authoritative
- The console logs the error for debugging
- No toast, no error banner, no broken state

### Provider API (unchanged)
The `useWishlist()` return shape is fully backward-compatible:
```ts
const { items, count, isInWishlist, add, remove, toggle, clear, isLoading } = useWishlist();
```

One new property was added: `isLoading` (boolean) — `true` until the initial localStorage hydrate completes on the client.

### Guest Behavior (unchanged)
- localStorage key: `lb_wishlist`
- TTL: 30 days
- Shape: `{ items: WishlistItem[], savedAt: number }`

### Configuration
No env vars needed. The route uses the existing `customerAccount` context, which is already configured via the standard `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` + `PUBLIC_CUSTOMER_ACCOUNT_API_URL` pair.

The `custom.wishlist` metafield must be defined in Shopify Admin → Settings → Custom data → Customers. Type: `json`. If the metafield doesn't exist yet, GET returns an empty array and POST creates it.

---

## 3. Explicit Image Dimensions

### Overview
Every `<Image>` call site now has explicit `width` and `height` props alongside the existing `aspectRatio` prop. This satisfies the CLAUDE.md rule that all Image usage must have explicit dimensions to prevent CLS.

### Rationale
`aspectRatio` already prevents layout shift by reserving space, but explicit pixel dimensions give the browser more information for:
- Choosing the right srcset size at parse time
- Better Lighthouse CLS scoring
- Consistent behavior across browsers and rendering modes
- Faster first-paint layout calculation

### Dimensions by Aspect Ratio
All sizes were chosen to be high enough for 2x/3x screens at typical viewport sizes, but low enough not to waste bandwidth:

| Aspect Ratio | Width × Height | Used For |
|---|---|---|
| `3/4` (portrait) | 800 × 1067 | Product cards, PDP gallery, collection grids, hero right |
| `4/3` (landscape) | 800 × 600 | Lookbook images, collection index cards |
| `4/5` (tall) | 800 × 1000 | Brand story section |
| `16/9` (wide) | 1600 × 900 | Before/after comparison, street hero (single) |
| `21/9` (cinema) | — (still uses aspectRatio only) | Before/after hover state |
| `1/1` (square) | 600 × 600 (large) / 200 × 200 (thumb) | Drop timer product, PDP gallery thumbnails |
| `5/6` | 250 × 300 | Cart drawer thumbnails |
| `6/7` | 300 × 350 | Cart page line items |
| Hero left (portrait) | 1200 × 1600 | HeroSplit left panel |
| Collection hero | 1600 × 800 | Collection page banner |
| Journal featured | 1200 × 900 | Journal index featured article |
| Journal grid | 900 × 600 | Journal index article grid |
| Journal article hero | 1600 × 700 | Journal article header (16/7) |
| Apple touch icon | 180 × 180 | PWA / iOS home screen |
| PWA icons | 192 / 512 px | site.webmanifest |

### Components Touched
**UI Components:**
- `ProductCard` — all 3 instances (cart variant, primary, secondary hover)
- `ProductGallery` — main image + thumbnail grid
- `CartDrawer` — line item thumbnails

**Sections:**
- `HeroSplit` — left (1200×1600) + right (800×1000)
- `CategoryGrid` — all category cards
- `CollectionGrid` — all collection cards
- `Lookbook` — all lookbook images
- `BrandStory` — brand image
- `BeforeAfter` — before + after images
- `FitCheck` — main image
- `DropTimer` — product image
- `StreetHero` — left + right images

**Routes:**
- `cart.tsx` — line item images
- `collections.$handle.tsx` — collection hero
- `collections._index.tsx` — collection grid
- `journal._index.tsx` — featured + grid
- `journal.$articleHandle.tsx` — article hero

**Not changed:**
- Very small decorative thumbnails inside tooltips (FitCheck hotspots, size guide)
- SVG placeholders and inline icons
- Images in sections that were already removed (legacy)

### Backward Compatibility
The `aspectRatio` prop is preserved on every call site — explicit dimensions are additive, not a replacement. Images continue to fill their container via `w-full h-full object-cover` as before.

---

## 4. Checks
- ✅ Typecheck passes (`npm run typecheck`)
- ✅ Lint passes (`npm run lint`)
- ✅ No new runtime dependencies
- ✅ Guest user wishlist behavior is byte-identical before/after
- ✅ All Customer Account API calls are server-only (no tokens in client bundle)

## 5. Next Up (Phase 6 — Codegen)
Generate real Storefront + Customer Account API TypeScript types via `npm run codegen`, replacing the current stub `.d.ts` files. Lower priority — DX improvement only, no user-visible change.
