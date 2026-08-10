# Legendary Branding — Headless Storefront

A premium editorial streetwear storefront built on **Shopify Hydrogen + React Router v7 + TypeScript + Tailwind CSS**, deployed to **Shopify Oxygen**.

Store: [legendary-branding.com](https://legendary-branding.com)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Shopify Hydrogen (React Router v7) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Runtime | Shopify Oxygen (Cloudflare Workers) |
| API | Shopify Storefront API (GraphQL) |
| Data source | legendary-branding.myshopify.com |

---

## Local Development

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- A Shopify store with Storefront API access

### Setup

```bash
# 1. Clone and install
git clone https://github.com/LXGNDRY/legendary-branding-headless.git
cd legendary-branding-headless
npm install

# 2. Configure environment
cp .env.example .env
# Fill in .env with your Shopify Storefront API credentials

# 3. Start dev server (via Shopify CLI — injects env from linked storefront)
npm run dev

# 4. Or start with plain Vite (requires .env filled in manually)
npx vite
```

The dev server runs at `http://localhost:3000`.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server via Shopify CLI (recommended) |
| `npm run build` | Production build via React Router |
| `npm run typecheck` | TypeScript check — must pass before commit |
| `npm run lint` | ESLint — must pass before commit |
| `npm run codegen` | Regenerate Storefront API types from `.graphqlrc.ts` |
| `npm run preview` | Preview the production build locally |

---

## Milestone Roadmap

| # | Milestone | Status |
|---|---|---|
| 1 | Foundation — shell, tokens, route stubs, docs | ✅ Done |
| 2 | Homepage, collection index + PLP | 🔜 Next |
| 3 | Product detail page (PDP), variant selector | 🔜 |
| 4 | Cart drawer + page, checkout redirect | 🔜 |
| 5 | Search (predictive + full results) | 🔜 |
| 6 | Journal / Blog (index + article) | 🔜 |
| 7 | Policy pages, 404, robots, sitemap | 🔜 |
| 8 | SEO, JSON-LD, performance, Oxygen deploy | 🔜 |

---

## Project Structure

```
app/
├── components/
│   ├── layout/       # Header, Footer, MobileMenu
│   └── ui/           # Button, Badge, Container, Placeholder
├── lib/
│   ├── context.ts    # createAppLoadContext (Hydrogen + session)
│   └── session.ts    # AppSession (cookie session)
├── routes/           # File-based React Router v7 routes
├── styles/
│   └── app.css       # Tailwind v4 + design tokens
├── entry.client.tsx
├── entry.server.tsx
├── root.tsx          # Global layout
└── routes.ts         # Route manifest (flatRoutes)
server.ts             # Cloudflare Workers fetch handler
```

---

## Environment Variables

See `.env.example` for the full list.

For **Oxygen deployment**, configure environment variables in the Shopify admin under **Hydrogen → [environment] → Variables**.

Never commit `.env` — it is in `.gitignore`.

---

## Oxygen Deployment

```bash
# Deploy a preview to Oxygen
npx shopify hydrogen deploy --preview

# Deploy to production (requires explicit approval)
npx shopify hydrogen deploy
```

Deployments are managed by Shopify Oxygen. Each deploy is immutable — environment variable changes require a redeploy.

---

## Safety Rules

- **Never** push to `main` or `master` without an approved PR review.
- **Never** modify the live Liquid theme, Shopify checkout, payment settings, DNS, or customer data from this codebase.
- **Never** commit `.env` or any real credentials.
- **Never** `shopify hydrogen deploy` (production) without explicit approval.
- Always run `npm run typecheck && npm run lint && npm run build` before committing.
- All work happens on feature branches. PRs merge to `main` only after review.

---

## GraphQL Codegen

Hydrogen auto-generates TypeScript types for all Storefront API queries tagged with `#graphql`. Regenerate after adding/modifying queries:

```bash
npm run codegen
```

Output: `storefrontapi.generated.d.ts` (gitignored, generated at build time).

---

## Contributing

Branch naming: `claude/[feature-description]` or `feat/[feature-description]`  
Commit format: `feat(m2): add collection PLP with Storefront API`  
All PRs must pass typecheck, lint, and build checks.
