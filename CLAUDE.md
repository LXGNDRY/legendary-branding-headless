# CLAUDE.md — Legendary Branding Headless Storefront

Guidelines for Claude Code agents working on this repository.

---

## Repository

- **GitHub:** `LXGNDRY/legendary-branding-headless`
- **Store:** LEGENDARY BRANDING (`legendary-branding.com`)
- **Storefront API domain:** `legendary-branding.myshopify.com`

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — merges here deploy to the live URL. PR + owner review required. |
| `dev` | Preview / staging — all development work lands here. Linked to Oxygen preview URL. |

- All work goes to **`dev`**.
- Do **NOT** push directly to `main`.
- Do **NOT** force-push to any branch.
- Open a PR from `dev` → `main` after each milestone — ready for review, not draft.
- Owner reviews and merges `dev` → `main` to trigger a production deploy.

---

## Hard Constraints — Never Do These

| Prohibited action | Reason |
|---|---|
| Modify the live Shopify Liquid theme | Would break production store |
| Change checkout, payment, or tax settings | Risk to live transactions |
| Alter Shopify Payments, PayPal, or other payment providers | Risk to live transactions |
| Modify DNS, domain settings, or Markets | Risk to production traffic |
| Edit products, collections, inventory, or orders in Shopify Admin | Live store data |
| Access or export customer data | Privacy / legal |
| Commit `.env` or real API tokens | Security |
| `shopify hydrogen deploy` to production | Requires explicit human approval |
| Force-push to any branch | Can destroy work |

---

## Development Rules

1. Run `npm run typecheck && npm run lint && npm run build` before every commit.
2. Fix all TypeScript errors — never use `@ts-ignore` to hide real issues.
3. Each commit is a single atomic milestone. No WIP commits.
4. Commit message format: `feat(m1): description` (milestone number + description).
5. All env vars live in `.env.example` only — never real values.
6. Image placeholders (`<Placeholder>`) stand in for real product images until art direction is approved.
7. No generated imagery committed without explicit user approval.

---

## Milestone Sequence

| # | Milestone | Branch Status |
|---|---|---|
| 1 | Foundation — shell, tokens, route stubs, README, CLAUDE.md | ✅ Complete |
| 2 | Homepage + collection index + PLP with Storefront API | 🔜 |
| 3 | Product detail page — gallery, variants, add-to-cart UI | 🔜 |
| 4 | Cart drawer, cart page, checkout redirect | 🔜 |
| 5 | Search — predictive + full results page | 🔜 |
| 6 | Journal / Blog — index + article template | 🔜 |
| 7 | Policy pages, 404, robots.txt, sitemap.xml | 🔜 |
| 8 | SEO/JSON-LD, image optimization, Oxygen preview deploy | 🔜 |

---

## Stack Reference

- **Framework:** Shopify Hydrogen + React Router v7
- **Language:** TypeScript (strict mode)
- **Styles:** Tailwind CSS v4 — use `@theme` tokens, not arbitrary hex values
- **Data:** Shopify Storefront API (GraphQL, via `context.storefront.query()`)
- **Session:** `AppSession` in `app/lib/session.ts`
- **Context:** `createAppLoadContext` in `app/lib/context.ts`
- **Runtime:** Cloudflare Workers (Oxygen) — no Node.js APIs available

---

## Store Data Reference

| Resource | Detail |
|---|---|
| Collections | ACCESSORIES (`accessories-more`), OUTERWEAR (`hoodies-jackets`), T-SHIRTS (`shirts-tops`), NEW DROPS (`all-products`), SETS (`sets`), Marque Légendaire (`marque-legendaire-luxury-streetwear`), LEGENDARY SELECT (`legendary-select`) |
| Price range | $55 – $120 USD |
| Blog | "Legendary Blogging" (handle: `legendary_blogging`) |
| Policy pages | refund-policy, terms-of-service, privacy-with-legendary-branding, shipping-policy, size-guide, about, contact, legendary_branding_faqs |

---

## Design Tokens (Tailwind `@theme`)

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

Design direction: **premium editorial streetwear** — white canvas, black typography, bold campaign imagery areas, minimal high-end aesthetic, mobile-first, accessible.

---

## How to Add a Storefront API Query (from Milestone 2 onward)

1. Write the query inline with the `#graphql` tagged template in the route file.
2. Run `npm run codegen` to generate TypeScript types.
3. Import the generated type and use it in the loader return type.
4. Never hardcode product/price data — always read from the API response.

Example pattern:
```ts
const PRODUCT_QUERY = `#graphql
  query Product($handle: String!) {
    product(handle: $handle) {
      id
      title
      ...
    }
  }
`;

export async function loader({params, context}: LoaderFunctionArgs) {
  const {product} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {handle: params.handle!},
  });
  return {product};
}
```
