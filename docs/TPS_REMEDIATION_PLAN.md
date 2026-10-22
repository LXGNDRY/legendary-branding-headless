# TPS Remediation Plan

Internal execution plan to close the 11 gaps found in the Toyota Production System (TPS) review of this repo.
Owner: `lb@legendary-branding.com`. Status tracker: the table in [Tracking](#tracking).

## Principles (how we run this)

- **One vertical slice per PR.** Each work item (WI) below is one `claude/*` branch, one PR into `dev`, one atomic commit series.
- **Stop-the-line (jidoka).** If a gate is red, fix the gate or the cause. Never skip, disable, or quarantine a test.
- **Verify before building.** Every WI starts with a "Verify first" step; findings that are not reproduced get closed as "not a gap" with evidence.
- **Hard constraints from CLAUDE.md still apply.** No checkout/payment/DNS/admin/theme changes, no manual production deploy, no force-push, no secrets in the repo.
- **Before every commit:** `npm run build && npm run typecheck && npm run lint && npm run test` (build first: it generates `.react-router/types` that typecheck needs).
- **Owner-gated files:** `.github/**`, `package.json`, `package-lock.json`, `server.ts`, `app/lib/security.ts`, `app/lib/session.ts` need owner review (CODEOWNERS).

## Gap register

| ID | Gap | Severity | Workstream | WI |
|---|---|---|---|---|
| G1 | Generated GraphQL type files are empty stubs; drift check passes trivially | High | WS1 Quality gates | WI-1 |
| G2 | `locales:check` passes today (all 8 catalogs have the same 56 keys, minified to one line) but is not enforced in CI, and the one-line JSON is unreviewable | Low | WS1 Quality gates | WI-2 |
| G3 | Rate limiter is per-isolate memory (`app/lib/rate-limit.ts`), used by 7 API routes incl. paid `api.chat` | High | WS2 Revenue and cost protection | WI-3 |
| G4 | 24 of 37 routes and 45 of 49 components have no unit test | Med-High | WS2 Revenue and cost protection | WI-4 |
| G5 | `products.$handle.tsx` is 1,235 lines | Med | WS3 Complexity | WI-7 |
| G6 | Duplicated Klaviyo calls; 8 files use ad-hoc `console.error` | Med | WS2 Revenue and cost protection | WI-5 |
| G7 | CLAUDE.md and docs drift (Node 20 vs 22, codegen blocking, M15/M16 missing, 25+ overlapping docs) | Med | WS3 Complexity | WI-8 |
| G8 | `Placeholder` and `HeroPlaceholder` still ship | Med | WS4 Content | WI-9 |
| G9 | Post-deploy smoke test misses PDP, cart, GraphQL proxy | Med | WS1 Quality gates | WI-2b |
| G10 | `eslint-disable` and `dangerouslySetInnerHTML` sanitization not centralized | Low-Med | WS3 Complexity | WI-6 |
| G11 | Dependency upgrade checklist is manual | Low-Med | WS5 Standard work | WI-10 |

## Sequencing

```
Phase 0 (verify)   WI-0
Phase 1 (gates)    WI-1  WI-2  WI-2b          <- close first; everything later relies on these
Phase 2 (revenue)  WI-3  WI-4  WI-5            <- tests (WI-4) land before refactors
Phase 3 (clean)    WI-6  WI-7  WI-8
Phase 4 (content)  WI-9                        <- blocked on owner confirming final assets
Phase 5 (standard) WI-10
```

Dependencies: WI-7 requires WI-4 (PDP tests first). WI-5 requires WI-4 tests for newsletter/waitlist. WI-8 runs last in each phase so docs describe what shipped.

---

## Phase 0 — Verify (read-only, no PR)

### WI-0 Baseline and reproduction
- Run on a clean `dev` checkout: `npm ci --legacy-peer-deps && npm run codegen && git status --short`.
- Record: (a) does codegen output differ from the committed stubs (G1), (b) `npm run locales:check` result (G2), (c) `npm run test -- --coverage` baseline (G4), (d) bundle size of the PDP route chunk (G5).
- **Exit:** a short baseline note added to the PR for WI-1. Any gap not reproduced is closed with evidence.

---

## Phase 1 — Quality gates (jidoka)

### WI-1 Real GraphQL types (G1)
- **Verify first:** needs `PUBLIC_STORE_DOMAIN` / `PUBLIC_STOREFRONT_API_TOKEN` (CI secrets); locally use a `.env` that is never committed.
- **Do:**
  - Determine why codegen emits empty interfaces (e.g. queries missing the `#graphql` tag, `documents` globs, or the plugin not finding operations). Fix at the source.
  - Commit the generated files and make the CI drift check meaningful.
  - Add a CI assertion that fails if either generated file has no query/mutation entries (guards against a silent regression to stubs).
- **Acceptance:** generated files list every inline query; `npm run typecheck` passes using the generated types in at least the PDP, collection and cart loaders; CI drift check fails when a query changes without regenerating.
- **Files:** `.graphqlrc.ts`, `storefrontapi.generated.d.ts`, `customeraccountapi.generated.d.ts`, `.github/workflows/oxygen-deployment-1000180490.yml` (owner review).
- **Rollback:** revert the PR; stubs return, no runtime impact (types only).

### WI-2 Locale gate in CI (G2)
- **Verified in Phase 0 review:** `python3 scripts/locales.py --check` passes; every locale has the same 56 keys as `en.json`. No translation work is needed.
- **Do:**
  - Add `npm run locales:check` to the `quality` job so a missing key or broken `{placeholder}` fails CI.
  - Reformat locale JSON to one key per line so diffs are reviewable.
- **Acceptance:** CI fails on a missing key or broken placeholder; locale diffs are line-by-line.
- **Rollback:** remove the CI step.

### WI-2b Stronger post-deploy smoke test (G9)
- **Do:** extend the smoke script with: a live PDP (pick a handle from the Storefront API at runtime, never hardcode), `/cart`, `/collections/all-products` content marker, and `POST /api/unstable/graphql.json` expecting 200 (consent/analytics proxy, per CLAUDE.md upgrade checklist).
- **Acceptance:** a deliberately broken PDP in a throwaway branch fails the smoke step; a healthy deploy passes.
- **Files:** `.github/workflows/oxygen-deployment-1000180490.yml` (owner review). Keep the quality, e2e and deploy ordering unchanged.

---

## Phase 2 — Revenue and cost protection

### WI-3 Shared rate limiting (G3)
- **Verify first:** confirm limits reset across isolates (cheap test: hit the limit repeatedly across several requests and observe inconsistent 429s on a preview deploy).
- **Options (pick one with the owner):**

| Option | Pros | Cons |
|---|---|---|
| Cloudflare rate-limiting rule on `/api/*` | No code; shared across edge | Needs Cloudflare/Oxygen access; plan limits |
| KV / Durable Object counter | Precise per-route limits | New binding on Oxygen; more code |
| Keep in-memory + hard daily cap on `api.chat` upstream (Anthropic spend limit) | Lowest effort | Doesn't stop abuse; only caps cost |

- **Do (minimum regardless of option):** set an Anthropic workspace spend limit; keep the in-memory limiter as a best-effort first layer; document the chosen control in `docs/PRODUCTION_READINESS.md`.
- **Acceptance:** more than N requests per minute per IP to `/api/chat` returns 429 across isolates (option 1 or 2), or the spend cap is verified in the provider console.

### WI-4 Test coverage on revenue and lead paths (G4)
- **Priority order:** `cart`, `cart.$lines`, `api.quick-add`, `api.newsletter`, `api.waitlist`, `api.wishlist`, `api.search`, `account.*` loaders and actions, `collections._index`, `pages.$handle`, `policies.$handle`, `journal.*`, `[sitemap.xml]`, `[robots.txt]`.
- **Do:** follow the existing pattern in `app/__tests__/routes/*` and `app/test/mock-storefront.ts`. Cover loading, error and empty states plus the failure branches (Klaviyo down, missing env, invalid body, rate-limited).
- **Component tests:** `CartDrawer`, `Header`, `SearchTypeahead`, `Wishlist`, `Analytics` (consent). Use Testing Library as in `QuickAddModal.test.tsx`.
- **Acceptance:** every route in the priority list has a test file; add a coverage floor in `vitest.config.ts` set to the post-WI-4 measured baseline (ratchet up only).
- Land as several small PRs (cart and checkout paths first), not one large one.

### WI-5 Single Klaviyo client and logging standard (G6)
- **Do:**
  - Extract `app/lib/klaviyo.ts` (subscribe, waitlist, shared error handling, timeouts). `api.newsletter` and `api.waitlist` become thin callers.
  - Route all server logging through one helper in `app/lib/monitoring.ts` (`captureError` with a context tag). Replace ad-hoc `console.error` calls; keep behavior (no stack traces to clients).
- **Acceptance:** one Klaviyo module; `grep -rn "console\." app` returns only the monitoring helper; WI-4 tests for both routes still pass unchanged.

---

## Phase 3 — Complexity reduction

### WI-6 Centralize HTML sanitization (G10)
- **Do:** one `SafeHtml` component (or `sanitizeHtml` util) used by `ContentBlocks`, `policies.$handle`, `pages.$handle`, `journal.$articleHandle`, `products.$handle` and `judgeme.ts` output; single documented `eslint-disable` there only. Do not add a heavy client dependency without justification (Workers bundle limit); prefer an allowlist-based minimal sanitizer with tests.
- **Acceptance:** `dangerouslySetInnerHTML` appears in one file; tests cover script, `on*` handlers, and `javascript:` URLs.

### WI-7 Split the PDP route (G5)
- **Requires:** WI-4 (PDP loader tests exist; e2e golden journey green).
- **Do:** move `AddToCartButton`, `MobilePurchaseBar`, `StickyBuyBar`, `QuantitySelector`, `Accordion` into `app/components/product/`; keep loader, action, meta and the default export in the route. Pure move, no behavior change.
- **Acceptance:** route file under ~600 lines; identical e2e results; no visual diff (manual preview check on desktop and mobile).

### WI-8 Docs and CLAUDE.md reconciliation (G7)
- **Do:**
  - Update CLAUDE.md: Node 22, codegen is blocking, add M15 and M16 and the remediation milestones to the table, point to this plan. (Owner approval required for CLAUDE.md edits.)
  - Consolidate `docs/`: keep `ARCHITECTURE`, `DEPLOYMENT`, `PRODUCTION_READINESS`, `REPOSITORY_GOVERNANCE`, `ANALYTICS`, `metafield-definitions`, `LAUNCH_CHECKLIST`; move audit and phase changelogs into `docs/archive/` with an index.
- **Acceptance:** no statement in CLAUDE.md contradicts the workflow file; `docs/README.md` indexes everything.

---

## Phase 4 — Content

### WI-9 Replace placeholders (G8)
- **Blocked on:** owner confirming final imagery (M12 and the theme import). Do not source or generate imagery independently (CLAUDE.md).
- **Prep now (no assets needed):** inventory every `Placeholder` / `HeroPlaceholder` usage (ProductCard x2, CollectionGrid, ProductGallery, collections index, StreetHero) and define the data source for each (Shopify CDN image field via Storefront API, explicit `width`/`height`).
- **Acceptance:** zero `Placeholder` imports outside the component's own file and tests; CLS check in e2e.

---

## Phase 5 — Standard work

### WI-10 Automate the upgrade checklist (G11)
- **Do:** add `.github/PULL_REQUEST_TEMPLATE` section (or a second template) for `@shopify/*`, `react-router`, `react`, `vite` bumps with the five checklist steps from CLAUDE.md; add a CI job on those PRs that runs `shopify hydrogen preview` plus `e2e/storefront-proxy.spec.ts` (already exists) and posts pass/fail. A human still reads release notes.
- **Acceptance:** a Dependabot bump of a covered package shows the checklist and the proxy test result.

---

## Definition of done (per WI)

- [ ] Verified-first note in the PR (reproduced, or closed with evidence)
- [ ] `npm run build && npm run typecheck && npm run lint && npm run test` green locally
- [ ] CI Quality Gate and full E2E matrix green
- [ ] PR uses the repo template: vertical slice, problem, implementation, risk and rollback, verification
- [ ] Tracker below updated
- [ ] Commit format `feat(m17): ...` / `fix(m17): ...` (continue milestone numbering; confirm the next number with the owner)

## Release cadence

- WIs merge into `dev` as they pass; each push to `dev` triggers an Oxygen preview deploy.
- Cut a `dev` → `main` release PR at the end of each phase (not per WI). Follow CLAUDE.md merge rules.
- After each production deploy: confirm the Deploy to Oxygen job ran, open the deploy URL, and run the WI-2b smoke checks.

## Risks

| Risk | Mitigation |
|---|---|
| Codegen needs live store secrets, so contributors without them cannot regenerate | Document the `.env` setup; CI is the source of truth |
| New CI gates block unrelated PRs | Land gates only after the repo is green on them; announce in the PR |
| PDP refactor regresses the highest-revenue page | Tests first (WI-4), pure-move commit, preview check on mobile and desktop |
| Rate-limit option needs Cloudflare/Oxygen access | Fallback: provider spend cap plus in-memory layer |

## Tracking

Every PR needs owner approval (`.github/CODEOWNERS` wildcard, `docs/REPOSITORY_GOVERNANCE.md`). The last column flags items that also need an owner *decision*, not just a review.

| WI | Gap | Branch | PR | Status | Owner sign-off needed |
|---|---|---|---|---|---|
| WI-0 | all | n/a | n/a | In progress: CI baseline captured; coverage baseline pending | No (read-only) |
| WI-1 | G1 | `claude/wi-1-codegen-types` | | Not started | Yes (workflow) |
| WI-2 | G2 | `claude/tps-locale-ci-gate` | [#360](https://github.com/LXGNDRY/legendary-branding-headless/pull/360) | Complete; locale check merged to `dev` | Yes (workflow) |
| WI-2b | G9 | `claude/tps-postdeploy-smoke` | [#363](https://github.com/LXGNDRY/legendary-branding-headless/pull/363) | Merged to `dev`; expanded smoke run pending | Yes (workflow) |
| WI-3 | G3 | `claude/wi-3-rate-limit` | | Not started | Yes (platform choice) |
| WI-4 | G4 | `claude/tps-newsletter-tests`, `claude/tps-waitlist-tests` | [#361](https://github.com/LXGNDRY/legendary-branding-headless/pull/361), [#362](https://github.com/LXGNDRY/legendary-branding-headless/pull/362) | In progress: newsletter and waitlist covered; remaining paths pending | Yes (CODEOWNERS) |
| WI-5 | G6 | `claude/tps-klaviyo-client` | [#364](https://github.com/LXGNDRY/legendary-branding-headless/pull/364) | In progress | Yes (CODEOWNERS) |
| WI-6 | G10 | `claude/wi-6-safe-html` | | Not started | Yes (CODEOWNERS) |
| WI-7 | G5 | `claude/wi-7-pdp-split` | | Not started | Yes (CODEOWNERS) |
| WI-8 | G7 | `claude/wi-8-docs` | | Not started | Yes (CLAUDE.md) |
| WI-9 | G8 | `claude/wi-9-imagery` | | Blocked: assets | Yes (assets) |
| WI-10 | G11 | `claude/wi-10-upgrade-gate` | | Not started | Yes (workflow) |
