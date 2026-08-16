# CLAUDE.md — Legendary Branding Headless Storefront
## Enterprise-Grade Headless Storefront — Operating Standard

Guidelines for Claude Code agents working on this repository. This document is the single source of truth for all development decisions. Read it fully before touching any file.

---

## Repository Identity

| Key | Value |
|---|---|
| GitHub | `LXGNDRY/legendary-branding-headless` |
| Brand | LEGENDARY BRANDING |
| Live domain | `legendary-branding.com` |
| Storefront API domain | `legendary-branding.myshopify.com` |
| Oxygen project | Storefront 1000167667 |
| Owner contact | `lb@legendary-branding.com` |

---

## What This Repo Is

This is the **primary customer-facing storefront** for Legendary Branding — a premium streetwear brand. It is a Shopify Hydrogen headless storefront deployed to Shopify Oxygen (Cloudflare Workers edge runtime). It consumes the Shopify Storefront API exclusively; it does not touch the Shopify admin, Liquid theme, or any backend directly.

A separate platform is handling Liquid theme conversion (`Theme-Files-edits-here.zip` at repo root). **These two tracks must not interfere.** The headless storefront and the Liquid theme are independent delivery paths against the same Shopify store.

---

## Branch Strategy

| Branch | Purpose | Deploy target |
|---|---|---|
| `main` | Production — every merge here triggers an Oxygen production deploy | `legendary-branding.com` |
| `dev` | Staging / preview — all development lands here first | Oxygen preview URL |
| `claude/*` | Agent working branches — PR into `dev`, never directly to `main` | None |

### Rules
- All agent work goes to a `claude/*` branch, then PR → `dev`, then owner-reviewed PR → `main`.
- **Never push directly to `main` or `dev`.**
- **Never force-push to any branch.**
- `dev` branch must exist at all times. If it's been deleted, recreate it from `main` before starting work:
  ```bash
  git fetch origin main
  git checkout -B dev origin/main
  git push -u origin dev
  ```
- Every PR must be ready for review (not draft) and include a clear description of what changed and why.
- Owner merges `dev` → `main` to trigger production deploy. Agents never merge to `main`.

---

## Hard Constraints — Never Do These

| Prohibited action | Reason |
|---|---|
| Modify the live Shopify Liquid theme | Would break production store |
| Touch `Theme-Files-edits-here.zip` | Active input to another platform's theme conversion |
| Change checkout, payment, or tax settings | Risk to live transactions |
| Alter Shopify Payments, PayPal, or other payment providers | Risk to live transactions |
| Modify DNS, domain settings, or Markets | Risk to production traffic |
| Edit products, collections, inventory, or orders in Shopify Admin | Live store data |
| Access or export customer data | Privacy / legal |
| Commit `.env` or any real API token, secret, or credential | Security |
| `shopify hydrogen deploy` to production manually | Requires explicit human approval — CI does this |
| Force-push to any branch | Can destroy work |
| Use `@ts-ignore` or `// eslint-disable` to hide real errors | Masks real problems |
| Hardcode prices, product data, or copy | Must always come from Storefront API |
| Commit generated imagery or AI-generated assets | Requires explicit owner approval |

---

## Enterprise Development Standards

### Before every commit
```bash
npm run typecheck && npm run lint && npm run build
```
All three must pass with zero errors. No exceptions.

### Code quality
- TypeScript strict mode — fix all type errors at the source, never suppress them.
- No `console.log`, `debugger`, or TODO comments in committed code (one-line `// NOTE:` comments explaining non-obvious decisions are fine).
- No dead code, commented-out blocks, or WIP fragments committed.
- Every component and route must handle its loading, error, and empty states explicitly.
- Accessibility: all interactive elements must have `aria-label` or visible label; color contrast must meet WCAG AA minimum.

### Security
- No stack traces, internal error messages, or server paths exposed to clients in production.
- All env vars validated at boot — fail fast with a clear error, not silently at runtime.
- `ErrorBoundary` must gate any debug output behind `import.meta.env.DEV`.
- No real values in `.env.example` — placeholders only (e.g. `YOUR_SESSION_SECRET`).
- Run a secret sweep before any PR that touches `.env.example` or `env.d.ts`.

### Performance (Cloudflare Workers / Oxygen constraints)
- No Node.js APIs (`fs`, `path`, `process`, `Buffer`, etc.) — Workers runtime only.
- No synchronous, blocking operations in request handlers.
- Prefer streaming responses where Hydrogen supports it.
- Keep bundle size in check — no large client-side dependencies without justification.
- All images served through Shopify CDN (`image.shopify.com`) with explicit `width`/`height` to avoid CLS.

### Dependency management
- All dependencies pinned to exact or semver-ranged versions — never `"latest"`.
- Run `npm audit` before committing new dependencies; no high/critical vulnerabilities.
- Add new `@shopify/*` packages only when there is no existing utility in the installed Hydrogen version.

### Commits
- One atomic milestone per commit. No WIP commits.
- Format: `feat(m9): description` continuing from the last milestone number.
- Message body (optional): explain the why, not the what.

---

## CI / CD Pipeline

**File:** `.github/workflows/oxygen-deployment-1000167667.yml`

### Required pipeline shape
```
on: push → branches: [main]   # production only
steps:
  1. checkout
  2. setup node (lts/*)
  3. npm ci
  4. npm run typecheck          # must pass
  5. npm run lint               # must pass
  6. npm run build              # must pass
  7. shopify hydrogen deploy    # only if steps 4–6 pass
```

Any push to `main` that fails steps 4–6 must NOT deploy. Agents must ensure this gate exists before any new code ships.

---

## Milestone Sequence

| # | Milestone | Status |
|---|---|---|
| 1 | Foundation — shell, tokens, route stubs, README, CLAUDE.md | ✅ Complete |
| 2 | Homepage + collection index + PLP with Storefront API | ✅ Complete |
| 3 | Product detail page — gallery, variants, add-to-cart UI | ✅ Complete |
| 4 | Cart drawer, cart page, checkout redirect | ✅ Complete |
| 5 | Search — full results page (products, collections, articles) | ✅ Complete |
| 6 | Journal / Blog — index + article template | ✅ Complete |
| 7 | Policy pages, 404, robots.txt, sitemap.xml | ✅ Complete |
| 8 | SEO/JSON-LD, OG meta, canonical URLs, Oxygen preview deploy | ✅ Complete |
| 9 | Safety hardening — production request handler, error boundary, pinned deps, CI gate, env validation | ⬜ Next |
| 10 | Compliance — Shopify Analytics.Provider + cookie consent banner (GDPR/CCPA) | ⬜ Queued |
| 11 | Codegen — generate + commit `storefrontapi.generated.d.ts`, wire into CI | ⬜ Queued |
| 12 | Content — real imagery replacing all `<Placeholder>` usage; full visual QA | ⏳ Blocked on theme import |
| 13 | Hardening — smoke tests (vitest), tsconfig cleanup, zip removal post-theme-import | ⬜ Post-launch |

---

## Stack Reference

| Layer | Technology |
|---|---|
| Framework | Shopify Hydrogen 2025 + React Router v7 |
| Language | TypeScript (strict mode) |
| Styles | Tailwind CSS v4 — `@theme` tokens only, no arbitrary hex values |
| Data | Shopify Storefront API (GraphQL via `context.storefront.query()`) |
| Session | `AppSession` in `app/lib/session.ts` |
| Context | `createAppLoadContext` in `app/lib/context.ts` |
| Runtime | Cloudflare Workers (Oxygen) — no Node.js APIs |
| Deployment | `shopify hydrogen deploy` via GitHub Actions CI only |
| Types | `storefrontapi.generated.d.ts` (generated by `npm run codegen`) |

---

## Store Data Reference

| Resource | Handle / Detail |
|---|---|
| Collections | `accessories-more`, `hoodies-jackets`, `shirts-tops`, `all-products`, `sets`, `marque-legendaire-luxury-streetwear`, `legendary-select` |
| Price range | $55 – $120 USD |
| Blog | "Legendary Blogging" (handle: `legendary_blogging`) |
| Policy pages | `refund-policy`, `terms-of-service`, `privacy-with-legendary-branding`, `shipping-policy`, `size-guide`, `about`, `contact`, `legendary_branding_faqs` |

---

## Design System

### Tailwind `@theme` tokens
```css
--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif
--color-canvas: #ffffff
--color-ink: #0a0a0a
--color-muted: #6b6b6b
--color-subtle: #999999
--color-border: #e5e5e5
--color-surface: #f7f7f7
--color-accent: #0a0a0a
```

### Design direction
**Premium editorial streetwear** — white canvas, black typography, bold campaign imagery zones, minimal high-end aesthetic, mobile-first, WCAG AA accessible. No decorative color outside these tokens. No gradients, shadows, or visual noise that undercuts the luxury positioning.

### Image handling
- All product images served from Shopify CDN via `<Image>` from `@shopify/hydrogen`.
- `<Placeholder>` component (`app/components/ui/Placeholder.tsx`) is a build-time stand-in only — every instance must be replaced before a production launch.
- Never use `<img>` directly; always use Hydrogen's `<Image>` for automatic CDN optimization.

---

## Key File Map

| File | Purpose |
|---|---|
| `server.ts` | Cloudflare Worker entry — request handler mode must be `'production'` in all non-dev builds |
| `app/root.tsx` | Root layout, `ErrorBoundary` (must gate stack traces behind `import.meta.env.DEV`) |
| `app/lib/context.ts` | App load context — env var validation lives here |
| `app/lib/session.ts` | `AppSession` — httpOnly, sameSite: lax, secret rotation |
| `app/routes.ts` | `flatRoutes()` from `@react-router/fs-routes` — do not manually define routes here |
| `app/components/ui/` | Shared UI primitives — `Placeholder`, `ProductCard`, `ProductGallery`, etc. |
| `.env.example` | Env var template — placeholders only, no real values |
| `env.d.ts` | TypeScript type declarations for `Env` — keep in sync with `.env.example` |
| `.graphqlrc.ts` | Codegen config — must match all inline `#graphql` query files |
| `.github/workflows/oxygen-deployment-1000167667.yml` | CI/CD — must include typecheck/lint/build gate before deploy |

---

## How to Add a Storefront API Query

1. Write the query inline in the route file using the `#graphql` tagged template literal.
2. Run `npm run codegen` to regenerate `storefrontapi.generated.d.ts`.
3. Import the generated type and use it in the loader's return type annotation.
4. Never hardcode product data, prices, or content — always read from the API response.

```ts
const PRODUCT_QUERY = `#graphql
  query Product($handle: String!) {
    product(handle: $handle) {
      id
      title
      priceRange { minVariantPrice { amount currencyCode } }
    }
  }
` as const;

export async function loader({params, context}: LoaderFunctionArgs) {
  const {product} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {handle: params.handle!},
  });
  if (!product) throw new Response('Not found', {status: 404});
  return {product};
}
```

---

## Parallel Work Boundary

A separate platform is converting `Theme-Files-edits-here.zip` into a working Shopify Liquid theme for `legendary-branding.com`. This headless Hydrogen storefront and that Liquid theme are **independent tracks** against the same Shopify store.

Rules governing the boundary:
- Do not touch the zip file.
- Do not edit any Shopify Liquid (`.liquid`) files.
- Do not change Shopify Admin settings (products, collections, themes, domains, checkout).
- Once the theme import is complete and confirmed, the owner will signal that Phase D (real imagery) and Phase E3 (zip cleanup) can begin.
- Real product images will flow from the theme-import output into this storefront — do not source imagery independently until the owner confirms the assets are final.
