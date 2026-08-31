# Deployment — Legendary Branding Headless Storefront

**Source of truth for the actual pipeline:** `.github/workflows/oxygen-deployment-1000167667.yml`.
This document expands on that file and on `CLAUDE.md`'s CI/CD section; it does not introduce any
new claims about behavior that isn't in the workflow file itself.

The pipeline is fail-closed: generated GraphQL drift, any quality failure,
browser E2E failure, missing Oxygen deployment metadata, missing authentication
bypass credentials, challenge interception, HTTP failure, or rendered error
boundary prevents the applicable gate from passing.

---

## 1. Branch Strategy

| Branch | Purpose | Deploy target |
|---|---|---|
| `main` | Production | Oxygen production deploy automatically on push (i.e. every merged release PR); manual workflow dispatch also available as a fallback |
| `dev` | Staging / preview | Oxygen preview deploy on push |
| `claude/*`, `docs/*`, other working branches | Agent/developer working branches | No deploy — PRs only trigger the quality gate |

Rules (from `CLAUDE.md`, unchanged here): never push directly to `main` or `dev`; never
force-push; every PR targets `dev` first, then an owner-reviewed PR promotes `dev` → `main`, which
the owner merges (agents never merge to `main`).

---

## 2. Pipeline Shape (as implemented)

The workflow (`Storefront 1000167667`) triggers on `push` to `main`/`dev`, `pull_request` to
`main`/`dev`, and manual `workflow_dispatch`. It defines three jobs:

### `quality` (runs on every trigger)
1. Checkout
2. Setup Node 20
3. Cache `~/.npm` (keyed on `package-lock.json` hash)
4. `npm ci --legacy-peer-deps`
5. **Codegen** — `npm run codegen`, with `PUBLIC_STORE_DOMAIN` / `PUBLIC_STOREFRONT_API_TOKEN`
   from repo secrets and a hardcoded `SESSION_SECRET: ci-only-do-not-use`. This step does **not**
   have `continue-on-error: true` in the current workflow file — codegen is a real, blocking gate
   in CI (this differs from the "continue-on-error" description in `CLAUDE.md`'s aspirational
   pipeline shape; per `docs/PRODUCTION_READINESS.md` §2, `.graphqlrc.ts` was fixed so codegen
   validates for real rather than being a soft-fail step).
6. **Generated drift** — rejects changes to committed Storefront or Customer Account declarations.
7. **Build** — `npm run build` (must run before typecheck; generates `.react-router/types/`)
8. **Typecheck** — `npm run typecheck` (`tsc --noEmit`)
9. **Lint** — `npm run lint`
10. **Test** — `npm run test`

### `deploy` (green pushes to `dev` or `main`, or manual dispatch from `main`; needs `quality` and `e2e`)
1. Checkout, Node setup, npm cache, `npm ci --legacy-peer-deps`
2. On `main`, `npm run validate:release-env` fails closed unless the complete Shopify,
   Customer Account, GA4, newsletter, and waitlist configuration is present.
3. `npx shopify hydrogen deploy --force --json-output --auth-bypass-token`, authenticated via
   `SHOPIFY_HYDROGEN_DEPLOYMENT_TOKEN: ${{ secrets.OXYGEN_DEPLOYMENT_TOKEN_1000167667 }}`.
   The job's `environment` is `production` when `github.ref_name == 'main'`, else `preview`.
4. The deploy step requires `h2_deploy_log.json`, a valid HTTPS deployment URL, and Shopify's
   short-lived authentication bypass token. Missing or malformed output fails the job.
5. **Post-deploy smoke test** — curls `/`, `/collections/all-products`, `/policies/about`,
   `/sitemap.xml`, `/robots.txt` on the generated Oxygen URL using the bypass-token header.
   Non-2xx responses, challenge interception, and rendered error-boundary text fail the job.

### `e2e` (runs after `quality` and gates deployment)
1. Checkout, Node setup, npm cache, `npm ci --legacy-peer-deps`
2. Install the browser required by each isolated Chromium, WebKit, and mobile-Chromium matrix job.
3. Writes a local `.env` with `SESSION_SECRET`, `PUBLIC_STORE_DOMAIN`,
   `PUBLIC_STOREFRONT_API_TOKEN` — required because `shopify hydrogen preview`/`dev` read env vars
   via Miniflare from a local `.env` file, not from inherited shell/step `env:` (documented
   in-line in the workflow as a fix for a real prior failure mode).
4. `npm run build`
5. `npm run test:e2e` runs isolated desktop Chromium, desktop WebKit, and mobile Chromium jobs against a **local** `shopify hydrogen preview` server
   (per `playwright.config.ts`'s `webServer`), not the live Oxygen deployment — this sidesteps the
   Oxygen preview bot-check entirely.
6. On failure, uploads per-project Playwright traces as a build artifact (`playwright-report/`, 7-day
   retention).

The suite includes structural journeys and a deterministic stocked-product commerce journey
covering variant selection, cart creation, quantity mutation, checkout URL validation, and
removal. It does not place a paid order, replace a manual payment/refund test before launch, or
currently run an automated WCAG violation scanner.

---

## 3. Required GitHub Actions Secrets

Read directly from the workflow file's `secrets.*` references:

| Secret | Used by | Purpose |
|---|---|---|
| `OXYGEN_DEPLOYMENT_TOKEN_1000167667` | `deploy` job | Auth token for `shopify hydrogen deploy` (`SHOPIFY_HYDROGEN_DEPLOYMENT_TOKEN`) |
| `PUBLIC_STORE_DOMAIN` | `quality` (codegen), `e2e` | Shopify storefront domain |
| `PUBLIC_STOREFRONT_API_TOKEN` | `quality` (codegen), `e2e` | Public Storefront API token |
| `SESSION_SECRET` | production validation | Session signing secret |
| `PUBLIC_STOREFRONT_ID` | production validation | Hydrogen analytics storefront ID |
| `PUBLIC_CHECKOUT_DOMAIN` | production validation | Trusted Shopify checkout domain |
| `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` | production validation | Customer Account OAuth client |
| `PUBLIC_CUSTOMER_ACCOUNT_API_URL` | production validation | Customer Account API URL |
| `PUBLIC_GA4_MEASUREMENT_ID` | production validation | GA4 destination |
| `PRIVATE_KLAVIYO_API_KEY` | production validation | Server-side Klaviyo API access |
| `PUBLIC_KLAVIYO_LIST_ID` | production validation | Newsletter list |
| `PUBLIC_KLAVIYO_WAITLIST_LIST_ID` | production validation | Back-in-stock list |

Their presence in the real GitHub repository settings and matching Oxygen runtime environment
remains an owner-controlled launch check.

The commerce E2E fixture defaults to the active, stocked
`legendary-world-round-t-shirt` product. Set the non-secret
`E2E_PRODUCT_HANDLE` environment variable when deliberately rotating the test
fixture. The test derives the expected product title from the loaded fixture.
The fixture must remain published, available to the Storefront API,
and have an available `Color=Black&Size=S` variant; missing fixture data is a
test failure, never a skip.

### Vars read by the app but not referenced anywhere in the workflow file
The app reads several more optional vars at runtime (`app/lib/context.ts`, `env.d.ts`), but the CI
workflow never injects them into any job — meaning they are only ever populated in the actual
Oxygen environment (Shopify Admin → Hydrogen → Environments), not via GitHub secrets:

- `PUBLIC_SENTRY_DSN` — server/client Sentry wiring (`app/lib/sentry.server.ts`,
  `app/lib/monitoring.ts`) no-ops without it.
- `PUBLIC_META_PIXEL_ID`, `PUBLIC_TIKTOK_PIXEL_ID` — each optional pixel in
  `app/components/seo/Analytics.tsx` simply doesn't load if its ID is unset.
- `PUBLIC_KLAVIYO_COMPANY_ID` — optional consent-gated Klaviyo on-site forms.

Newsletter and waitlist endpoints now fail truthfully with `503` when their required Klaviyo
configuration is missing. Customer Account navigation is hidden and its routes fail with `503`
when the required pair is absent.

Whether any of these are actually set in the real Oxygen production/preview environment is
**unverified — needs owner confirmation.** This is a real operational risk: if
`PUBLIC_SENTRY_DSN` is unset, production errors are only visible via `console.error` in Oxygen's
own logs, not in Sentry.

---

## 3a. Dependabot PRs — CI is structurally red, this is expected

`.github/dependabot.yml` sets `target-branch: "dev"` for both the `npm` and `github-actions`
update blocks, matching this repo's dev-first branch policy for **routine, non-security** updates.
But every Dependabot-authored PR's CI will still show the `e2e` jobs failing with
`PUBLIC_STORE_DOMAIN environment variable is not set` — **this is a GitHub Actions platform
restriction, not a bug in this repo or in the dependency bump itself.** GitHub does not expose
repository secrets to workflow runs triggered by Dependabot-authored pull requests (`pull_request`
events where the actor is `dependabot[bot]`), as a security measure against a malicious dependency
update exfiltrating secrets through CI. `target-branch` does not change this; neither does
re-running the job.

**`target-branch` does not apply to Dependabot *security* updates** (vulnerability alerts) —
Dependabot always opens those against the repository's default branch regardless of config. If the
default branch is `main`, a security-update PR still bypasses `dev` and will fail this repo's
PR-governance check (which only permits `dev` as a head targeting `main`). Handle one exactly like
a routine bump below, just push the replacement PR at `dev` yourself since Dependabot won't; don't
retarget the original security PR's base in place, since GitHub ties security-update metadata
(the linked advisory) to it opening against the default branch.

**Do not merge a Dependabot PR on the strength of its own CI**, and do not "fix" this by switching
the workflow trigger to `pull_request_target` — that grants secrets to a workflow that also checks
out the PR's (dependency-modified) code, which is the exact attack this restriction exists to
prevent, and is not worth the risk for routine dependency bumps.

Instead, to actually land a Dependabot bump (routine or security):
1. Read the diff and judge patch/minor (generally safe) vs. major (needs a deliberate migration,
   not a dependency-bump merge). The changed files depend on the ecosystem: `npm` updates touch
   `package.json`/`package-lock.json`; `github-actions` updates touch the referenced
   `.github/workflows/*.yml` files (an action's pinned SHA/version, not any npm manifest).
2. For a safe bump: check out the Dependabot branch locally, apply the actual changed files from
   its diff onto current `dev` (`git checkout <dependabot-branch> -- <the changed files>` — e.g.
   `package.json package-lock.json` for an `npm` update, or the specific workflow file(s) for a
   `github-actions` update), then validate: `npm ci --legacy-peer-deps && npm run build && npm run
   typecheck && npm run lint && npm run test` locally with real secrets for an `npm` update (plus
   `npm run codegen`, checking for drift, if it touches `@graphql-codegen/*` or
   `@shopify/hydrogen-codegen`); for a `github-actions` update, inspect the workflow diff by hand
   (there's no local runner) and confirm the referenced action version/SHA is real.
3. Push that validated change as a new branch/PR targeting `dev` (not Dependabot-authored, so its
   CI runs with real secrets and is trustworthy), merge it, then close the original Dependabot PR
   referencing the replacement.
4. For a major bump: close it with a comment explaining why (breaking changes needing a dedicated
   migration), rather than merging or leaving it to rot unaddressed.

---

## 4. Rollback Procedure

**There is no automated rollback in this pipeline.** The workflow file has no rollback job, no
previous-deployment pinning, and no one-click revert step. Rollback today is a manual process:

1. Identify the last known-good commit on the affected branch (`main` or `dev`).
2. Either:
   - `git revert <bad-commit>` on that branch and push (triggers a normal forward deploy of the
     reverted state through the same pipeline), **or**
   - Check out the older commit locally and run `npx shopify hydrogen deploy` manually (requires
     the deployment token and, per `CLAUDE.md`, requires explicit human approval before running —
     agents must not run this manually).
3. Verify the rollback via the same post-deploy smoke-test routes described in §2, or manually in
   a browser.

**Known limitation, stated plainly:** rollback is entirely manual today. There is no "redeploy
previous Oxygen deployment" automation, no deployment history pinning beyond what Shopify Partners
dashboard shows, and no automatic rollback on smoke-test failure (a failed smoke test fails the CI
job but does not revert the already-deployed Oxygen build). Automating rollback is deferred — see
`docs/POST_LAUNCH_ROADMAP.md`.

---

## 5. Verifying a Deploy Reached Oxygen

1. GitHub → Actions → the workflow run triggered by the merge push to `dev` or `main`, or a manual
   dispatch from `main`.
2. Confirm `quality` completed with success.
3. Confirm `Deploy to Oxygen` ran (not skipped) with success. If skipped, the triggering event was
   a `pull_request` — the only case that doesn't deploy. A push to `dev`, a push to `main`, or a
   manual dispatch from `main` all deploy.
4. Check the `Post-deploy smoke test` step's log — every critical route must be verified; bot-check
   interception is a failure because the deployment uses Shopify's authentication bypass token.
5. Deployment entries and their preview URLs are also visible in the Shopify Partners dashboard
   under Hydrogen storefront 1000167667 — each successful deploy creates a new entry there.

---

## 6. Local Development Prerequisites (`package-lock.json`, `--legacy-peer-deps`, `rootDirs`)

Carried over verbatim from `CLAUDE.md` since these are load-bearing for the CI gate described
above:

- `npm ci` is strict; after any `package.json` version bump, run `npm install --legacy-peer-deps`
  locally and commit the resulting `package-lock.json` in the same PR.
- Both CI jobs use `npm ci --legacy-peer-deps` — the Hydrogen + React Router v7 peer dependency
  graph only resolves with this flag.
- `tsconfig.json` must keep `"rootDirs": [".", "./.react-router/types"]` so TypeScript can resolve
  `.js` import extensions in React Router v7's generated type stubs to their `.tsx` sources.
