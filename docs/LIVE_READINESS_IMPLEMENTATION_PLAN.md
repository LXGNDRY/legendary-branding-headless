# Live Readiness Implementation Plan

**Date:** 2026-08-21  
**Branch audited:** `work`  
**Plan owner:** Engineering + store owner/operator  
**Purpose:** Provide an execution-ready plan to move the storefront from “feature-complete in code” to a verified production release candidate that can safely accept real customers and Shopify orders.

This plan is intentionally concrete. It converts the live-readiness audit findings into ordered workstreams, PR-sized implementation slices, owner decisions, validation commands, evidence requirements, and launch/no-launch gates.

---

## 1. Executive Summary

The storefront should **not** be considered live-ready yet. The implementation work is close enough to plan a release candidate, but several release blockers remain:

1. Dependency installation still needs a successful clean install in a network-enabled environment.
2. CI depends on `npm ci --legacy-peer-deps`, which masks the remaining Hydrogen/React Router peer mismatch.
3. Local test/build/typecheck results are currently untrustworthy until install reproducibility is fixed.
4. No end-to-end Shopify order has been verified in Shopify Admin.
5. Live Oxygen environment variables and third-party integrations are not fully verified.
6. Content claims and testimonials still need proof or cleanup.
7. Market scope is unresolved; code currently behaves like a US-only storefront.
8. Readiness documentation and launch checklist status have drifted and need reconciliation.

The correct path is **not** to deploy first and debug production. The correct path is to repair the dependency/CI foundation, re-establish a trusted quality gate, verify commerce and integrations against real systems, reconcile documentation, and only then ask the owner for final production approval.

---

## 2. Release Definition

The storefront is live-ready only when all of the following are true:

1. A clean checkout can install dependencies with `npm ci` without `--legacy-peer-deps`.
2. Codegen, build, typecheck, lint, unit tests, and Chromium E2E pass from a clean environment.
3. CI enforces the same quality gate that engineers run locally.
4. Oxygen deploys are blocked by quality-gate failures.
5. A real Shopify order, or an owner-approved Shopify test-mode order, is completed end-to-end and verified in Shopify Admin.
6. Required Oxygen environment variables are present in the target environment.
7. Sentry, Klaviyo, analytics pixels, customer-account behavior, and newsletter behavior are verified or explicitly deferred.
8. Public claims, legal links, policy links, shipping/return claims, and testimonials are verified or rewritten.
9. Market scope is explicit: US-only launch or a verified multi-market launch.
10. `docs/PRODUCTION_READINESS.md` and `docs/LAUNCH_CHECKLIST.md` agree with the actual implementation and verification state.
11. The owner explicitly approves the final release candidate before production launch.

---

## 3. Severity Model

Use these priorities for all follow-up issues and PRs.

| Priority | Meaning | Examples | Launch impact |
|---|---|---|---|
| P0 | Blocks launch | Clean install failure, build failure, no verified order, missing required env var, broken checkout | Must be fixed or owner-accepted before launch |
| P1 | High-risk but may be owner-deferred | Analytics not verified, Klaviyo unverified, wishlist persistence unverified, unsupported content claims | Should be fixed; may launch only with explicit owner risk acceptance |
| P2 | Post-launch improvement | Broader E2E coverage, nonce-based CSP, multi-market expansion if US-only launch is approved | Does not block launch if documented |

Default stance: unresolved commerce, install, build, and required-environment issues are **P0**.

---

## 4. Current Audit Findings

### 4.1 Dependency installation is not clean-install safe

The audit found peer-version conflicts in the dependency graph. This branch removes the unused direct `@vitejs/plugin-react@6.0.5` dependency that required Vite `^8.0.0` while the project pins `vite@6.4.3`.

Remaining dependency work:

- `@shopify/hydrogen@2026.4.4` expects React Router packages in the `~7.16.0` range, while the project pins `react-router@7.18.2`, `@react-router/dev@7.18.2`, and `@react-router/fs-routes@7.18.2`.
- The GitHub Actions workflow currently installs with `npm ci --legacy-peer-deps`, which permits CI to proceed despite that Hydrogen/React Router peer mismatch.
- A real non-dry-run `npm ci` must still be confirmed in CI or another network-enabled environment; this container could run `npm ci --dry-run --legacy-peer-deps` but could not complete package downloads through the configured proxy.

### 4.2 Local quality checks are not currently trustworthy

Because dependency installation did not complete cleanly during the audit:

- `npm run typecheck` failed with missing module/type errors because `node_modules` could not be installed.
- `npm run test` failed because `vitest` was unavailable.
- `npm run build` failed because `react-router` was unavailable.
- `npm run lint` exited successfully in the partial environment, but lint alone does not establish live readiness.

These results should be treated as evidence that the install foundation is broken, not as proof of thousands of source-level TypeScript defects.

### 4.3 Commerce has not been verified end-to-end

The highest-risk launch gap is still commerce verification. There is no repository evidence that a real customer path has completed checkout and produced a verified Shopify Admin order with correct product, variant, price, tax, shipping, and order status.

### 4.4 Live environment configuration is unverified

Several integrations are implemented in code but still require target-environment confirmation:

- Sentry DSN.
- Klaviyo private API key and list ID.
- GA4, Meta, and TikTok pixel IDs.
- Customer Account API credentials.
- Shopify Storefront API domain/token.
- Shopify Markets configuration.

### 4.5 Documentation has drifted

The launch checklist and production readiness docs contain stale or contradictory status statements. Documentation must be reconciled after the technical fixes are complete so the final launch checklist reflects actual evidence, not prior assumptions.

---

## 5. Implementation Principles

1. **Small PRs only.** Each PR should have one clear purpose and one clear acceptance checklist.
2. **No release-by-hope.** Anything marked verified must have evidence: command output, CI run, screenshot, Shopify Admin confirmation, or owner confirmation.
3. **No hidden dependency bypasses.** `--legacy-peer-deps` may be used temporarily for investigation, but it must not be part of the final release path.
4. **Code PRs run the full gate.** Documentation-only PRs may skip automated checks, but any code/config/dependency change must run install, codegen, build, typecheck, lint, and tests.
5. **Owner-only tasks are explicit.** Tasks requiring Shopify Admin, payment approval, environment variables, real testimonials, or market decisions must be assigned to the owner/operator.
6. **Manual checks belong in docs.** If a workflow cannot be automated reliably, it must be listed in the launch checklist with date, verifier, and result.

---

## 6. Overall Execution Order

Complete the work in this order:

1. **P0-A:** Repair dependency matrix and lockfile.
2. **P0-B:** Replace legacy CI install with normal clean install.
3. **P0-C:** Restore build/typecheck/lint/test reliability.
4. **P0-D:** Verify production-preview build and E2E smoke coverage.
5. **P0-E:** Verify required Oxygen environment variables.
6. **P0-F:** Complete Shopify order verification.
7. **P1-G:** Verify integrations: Sentry, Klaviyo, analytics, account flows, wishlist.
8. **P1-H:** Audit and correct public content claims.
9. **P1-I:** Decide and document market scope.
10. **P0-J:** Reconcile readiness docs and launch checklist.
11. **P0-K:** Run final release-candidate gate and obtain owner signoff.

---

## 7. Workstream A — Dependency Matrix Repair (P0)

### Goal

Make dependency installation reproducible with `npm ci` from a clean checkout.

### Owner

Engineering.

### Inputs

- `package.json`
- `package-lock.json`
- Hydrogen, React Router, Vite, Tailwind, Mini Oxygen, Vitest compatibility ranges

### Implementation Tasks

1. Start from a clean working tree.
2. Remove any partial install artifacts locally:

   ```bash
   rm -rf node_modules
   ```

3. Pick one Hydrogen/React Router strategy:
   - **Conservative strategy:** keep `@shopify/hydrogen@2026.4.4` and align `react-router`, `@react-router/dev`, and `@react-router/fs-routes` to Hydrogen-compatible `~7.16.0` versions.
   - **Forward strategy:** upgrade Hydrogen to a version that officially supports the currently pinned React Router packages.
4. Pick one Vite/plugin strategy:
   - **Conservative strategy:** keep `vite@6.4.3` and use a compatible `@vitejs/plugin-react` version.
   - **Forward strategy:** upgrade Vite to satisfy `@vitejs/plugin-react@6.0.5`, but only after confirming Hydrogen, Mini Oxygen, React Router tooling, Tailwind Vite plugin, and Vitest support that Vite version.
5. Regenerate the lockfile using the selected matrix:

   ```bash
   npm install
   ```

6. Verify a clean install:

   ```bash
   rm -rf node_modules
   npm ci
   ```

7. Inspect the final dependency graph:

   ```bash
   npm explain vite
   npm explain react-router
   npm explain @vitejs/plugin-react
   npm explain @shopify/hydrogen
   ```

8. Commit `package.json` and `package-lock.json` together.

### Acceptance Criteria

- `npm ci` passes without `--legacy-peer-deps`.
- No direct dependency has an unresolved peer conflict.
- `package-lock.json` is updated and committed with `package.json`.
- The chosen dependency matrix is noted in the PR description.

### Validation Commands

```bash
rm -rf node_modules
npm ci
npm explain vite
npm explain react-router
npm explain @vitejs/plugin-react
npm explain @shopify/hydrogen
npm run build
npm run typecheck
npm run lint
npm run test
```

### Rollback Plan

If the forward-upgrade strategy causes broad runtime/build issues, revert that PR and use the conservative strategy: align React Router to Hydrogen's supported range and align the React plugin to Vite 6.

---

## 8. Workstream B — CI Install and Quality Gate Hardening (P0)

### Goal

Make CI enforce the same dependency and quality checks that define a release candidate.

### Owner

Engineering.

### Implementation Tasks

1. After Workstream A passes, replace every workflow install command that uses:

   ```bash
   npm ci --legacy-peer-deps
   ```

   with:

   ```bash
   npm ci
   ```

2. Keep codegen in CI if GraphQL documents are intended to be schema-validated on every PR.
3. Keep build before typecheck if React Router generated type stubs are required before `tsc --noEmit`.
4. Ensure the deploy job still depends on the quality job.
5. Ensure E2E still depends on a successful quality job.
6. Add comments in the workflow explaining why the quality gate order is intentional.
7. Confirm branch protection requires the quality job before merge, if branch protection is available.

### Acceptance Criteria

- Pull requests to `dev` and `main` run install, codegen, build, typecheck, lint, and tests.
- Push deploys to `dev` and `main` remain blocked by quality failure.
- No workflow install step uses `--legacy-peer-deps`.
- CI logs show normal `npm ci` success.

### Validation Commands

```bash
npm ci
npm run codegen
npm run build
npm run typecheck
npm run lint
npm run test
```

---

## 9. Workstream C — Codegen, Build, Typecheck, Lint, Unit Test Stabilization (P0)

### Goal

Restore trust that the codebase is healthy after dependency installation is fixed.

### Owner

Engineering.

### Implementation Tasks

1. Run codegen with CI-equivalent environment variables.
2. Run build to generate React Router artifacts and validate the production bundle.
3. Run TypeScript after build.
4. Run lint.
5. Run unit tests.
6. Fix failures in the smallest possible slices:
   - generated type drift,
   - source type errors,
   - test fixture drift,
   - import path errors,
   - route/action/loader contract issues,
   - lint errors.
7. Re-run the full sequence after every code/config/dependency fix.

### Acceptance Criteria

- `npm run codegen` passes.
- `npm run build` passes.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run test` passes.
- The PR includes exact command results.

### Validation Commands

```bash
npm ci
npm run codegen
npm run build
npm run typecheck
npm run lint
npm run test
```

---

## 10. Workstream D — E2E Reliability and Coverage (P0/P1)

### Goal

Use Playwright to validate critical storefront journeys without depending on flaky live Oxygen preview bot checks.

### Owner

Engineering.

### Implementation Tasks

1. Confirm Playwright browser installation works in CI.
2. Confirm local production preview starts consistently from the built app.
3. Classify each E2E journey as one of:
   - strict automated pass/fail,
   - conditional skip because Shopify fixture data is absent,
   - manual-only because it requires real checkout, auth, or payment.
4. Tighten coverage for P0 pre-checkout behavior:
   - homepage renders,
   - collection route renders,
   - product route renders,
   - variant selection works,
   - add-to-cart works,
   - cart drawer/page shows correct line item,
   - quantity update works,
   - checkout redirect is produced,
   - empty cart state works,
   - invalid product handle shows branded 404/error state,
   - mobile menu opens, traps focus, and navigates.
5. Avoid overusing graceful skips for paths that must work in production.
6. Document any remaining manual-only journeys in the launch checklist.

### Acceptance Criteria

- `npm run test:e2e -- --project=chromium` passes in CI.
- Critical pre-checkout flows have strict assertions where data is available.
- Manual-only commerce/account flows are explicitly listed in the launch checklist.

### Validation Commands

```bash
npm run build
npm run test:e2e -- --project=chromium
```

---

## 11. Workstream E — Oxygen Environment Verification (P0)

### Goal

Confirm the target Oxygen environment can boot and serve the storefront with the expected production configuration.

### Owner

Store owner/operator with Engineering support.

### Required Launch Variables

These are required for the app to boot and read Shopify data:

- `SESSION_SECRET`
- `PUBLIC_STORE_DOMAIN`
- `PUBLIC_STOREFRONT_API_TOKEN`

### Conditional Variables

These are required if the related feature is in launch scope:

- `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID`
- `PUBLIC_CUSTOMER_ACCOUNT_API_URL`
- `PRIVATE_STOREFRONT_API_TOKEN`

### Integration Variables

These should be verified or explicitly deferred:

- `PUBLIC_SENTRY_DSN`
- `PRIVATE_KLAVIYO_API_KEY`
- `PUBLIC_KLAVIYO_LIST_ID`
- `PUBLIC_GA4_MEASUREMENT_ID`
- `PUBLIC_META_PIXEL_ID`
- `PUBLIC_TIKTOK_PIXEL_ID`

### Implementation Tasks

1. Create a sanitized environment checklist with present/missing status only; never commit secret values.
2. Confirm required variables are set in the target Oxygen environment.
3. Confirm account variables are either both present or both intentionally absent.
4. Deploy to preview after the quality gate passes.
5. Open the preview in a browser and verify critical routes load.
6. Confirm server boot does not fail with missing required variable errors.
7. Record verification date, environment, and verifier in the launch checklist.

### Acceptance Criteria

- Required variables are confirmed present.
- Optional variables are either confirmed present or documented as deferred.
- Preview deploy serves homepage, product, collection, cart, policies, sitemap, and robots routes.
- Verification evidence is recorded in docs or PR notes.

---

## 12. Workstream F — Third-Party Integration Verification (P1 unless owner requires for launch)

### Goal

Prove configured integrations work in the target environment or explicitly defer them.

### Sentry Tasks

1. Confirm `PUBLIC_SENTRY_DSN` is configured.
2. Trigger a controlled non-customer-data test event.
3. Confirm the event appears in the correct Sentry project and environment.
4. Confirm no secret/customer data is captured unexpectedly.

### Klaviyo Tasks

1. Confirm `PRIVATE_KLAVIYO_API_KEY` and `PUBLIC_KLAVIYO_LIST_ID` are configured.
2. Submit a test newsletter signup with a controlled test email.
3. Confirm the profile appears in the expected Klaviyo list.
4. Confirm failure states are user-friendly if Klaviyo rejects the request.

### Analytics Tasks

1. Confirm GA4, Meta, and TikTok IDs are set if launch requires them.
2. Verify consent behavior before and after opt-in/opt-out.
3. Use debug/realtime tools to confirm page_view, product_view, add_to_cart, search, and checkout-start events where implemented.
4. Document any event not implemented as deferred.

### Acceptance Criteria

- Each integration is marked one of: verified, disabled, deferred, or blocking.
- Verification evidence is recorded without exposing secrets.
- Owner accepts any deferred integration before launch.

---

## 13. Workstream G — Real Commerce Verification (P0)

### Goal

Prove that a shopper can complete a purchase and that Shopify records the order correctly.

### Owner

Store owner/operator, with Engineering observing and recording defects.

### Required Owner Decision

Choose one approved checkout method:

1. Shopify test-mode/bogus-gateway order.
2. Shopify development-store test order.
3. Owner-approved real low-value production order.

### Manual Test Script

1. Open the deployed storefront in a normal browser session.
2. Navigate homepage → collection → product detail page.
3. Select a purchasable size/variant.
4. Add the item to cart.
5. Verify cart line item title, image, variant, quantity, and price.
6. Update quantity and confirm totals update.
7. Remove and re-add the item to confirm cart state is reliable.
8. Click checkout.
9. Confirm redirect to Shopify-hosted checkout.
10. Complete checkout with the approved payment/test method.
11. Confirm order confirmation page displays.
12. Verify the order in Shopify Admin:
    - order exists,
    - correct product,
    - correct variant,
    - correct quantity,
    - correct subtotal,
    - correct discounts,
    - correct shipping,
    - correct tax,
    - correct total,
    - correct customer/contact details,
    - correct payment/test status,
    - correct fulfillment status,
    - correct notification behavior.
13. Refund/cancel the order if it was a real production order.
14. Record result in the launch checklist.

### Edge Cases to Verify

- Sold-out variant cannot be purchased.
- Invalid variant URL does not crash the page.
- Rapid repeated add-to-cart clicks do not create unintended quantities.
- Browser back/forward after variant selection keeps state consistent.
- Checkout unavailable/error state is clear to the user.

### Acceptance Criteria

- At least one full order path is verified in Shopify Admin.
- Defects found during checkout are fixed or recorded as P0 blockers.
- Owner signs off that order behavior is acceptable.

---

## 14. Workstream H — Customer Account and Wishlist Verification (P1/P0 if account features are launch-critical)

### Goal

Confirm account and wishlist features behave correctly with real Customer Account API configuration.

### Owner

Engineering + store owner/operator.

### Implementation Tasks

1. Confirm Customer Account API credentials are configured in Oxygen.
2. Verify account login starts the expected Shopify Customer Account flow.
3. Verify `/account` routes do not expose private data to unauthenticated users.
4. Verify account profile edit works if in launch scope.
5. Verify address create/update/delete/default behavior if in launch scope.
6. Verify wishlist persistence:
   - log in as test customer,
   - add product to wishlist,
   - log out,
   - log in from a different browser/session,
   - confirm wishlist persists,
   - remove item and confirm removal persists.
7. Confirm customer-specific responses are not cached publicly.

### Acceptance Criteria

- Account features are either verified with real credentials or removed/deferred from launch scope.
- Wishlist persistence is verified or documented as deferred.
- No private customer data is publicly cacheable.

---

## 15. Workstream I — Content Truth, Legal, and Policy Verification (P1/P0 for legal/commercial claims)

### Goal

Ensure every public claim is true, supportable, and aligned with actual Shopify/store policy configuration.

### Owner

Store owner/operator owns truth; Engineering implements copy changes.

### Claims to Audit

At minimum, verify:

- Free-shipping threshold.
- Made-to-order claims.
- Worldwide/international shipping claims.
- Authenticity guarantees.
- New drop cadence.
- Delivery estimates.
- Return/exchange promises.
- Warranty/quality guarantees.
- Testimonial names, locations, and quotes.
- Privacy policy links.
- Terms of service links.
- Refund/return policy links.
- Data-sharing opt-out link.
- Contact/support links.

### Implementation Tasks

1. Inventory all marketing and policy claims in public routes/components.
2. Compare each claim against Shopify Admin settings, policy pages, fulfillment reality, or owner-provided proof.
3. Categorize each claim:
   - verified,
   - needs rewrite,
   - remove before launch,
   - owner-accepted risk.
4. Rewrite unsupported claims to accurate, non-committal language.
5. Remove fabricated or unverified testimonials unless owner supplies real approved replacements.
6. Verify every footer/header/legal link resolves.
7. Update launch docs with remaining owner-accepted risk, if any.

### Acceptance Criteria

- No unsupported commercial claim remains unless owner explicitly accepts the risk.
- Testimonials are real and owner-approved, or removed.
- Shipping/returns/legal copy matches real Shopify policies.
- All public legal and support links resolve successfully.

---

## 16. Workstream J — Market Scope and International Readiness (P1/P0 if international launch is claimed)

### Goal

Make launch market scope explicit and ensure UI/checkout behavior matches that scope.

### Owner

Store owner/operator, with Engineering implementation.

### Required Decision

Pick one launch scope:

1. **US-only launch.** Fastest and safest if Shopify Markets are not fully configured.
2. **Defined multi-market launch.** Requires per-market verification.
3. **US launch now, multi-market post-launch.** Document as roadmap.

### US-Only Tasks

1. Document US-only launch scope.
2. Remove or rewrite worldwide/international checkout claims.
3. Verify US pricing, shipping, taxes, and checkout.
4. Ensure currency UI does not imply unsupported checkout currencies.

### Multi-Market Tasks

1. Confirm enabled Shopify Markets in Shopify Admin.
2. Implement market-aware country/currency behavior instead of hardcoded assumptions.
3. Verify product availability by market.
4. Verify checkout, shipping, duties/taxes, and currency display for each launch market.
5. Add E2E/manual checks for every supported market.

### Acceptance Criteria

- Market scope is owner-approved and documented.
- UI claims match checkout reality.
- Every launch market has verified pricing/shipping/tax/checkout behavior.

---

## 17. Workstream K — Documentation Reconciliation (P0)

### Goal

Make all launch docs reflect the actual final implementation and verification status.

### Owner

Engineering, with owner confirmation for owner-only items.

### Implementation Tasks

1. Update `docs/PRODUCTION_READINESS.md` after dependency/CI and verification work is complete.
2. Update `docs/LAUNCH_CHECKLIST.md` so it matches current code, CI, E2E, and manual verification state.
3. Resolve stale contradictions around:
   - E2E coverage,
   - accessibility status,
   - orphaned content pages,
   - real checkout status,
   - integration verification,
   - market scope,
   - production docs status.
4. Add verification metadata:
   - date,
   - environment,
   - verifier,
   - evidence link or PR/CI reference.
5. Create `docs/URL_MIGRATION.md` only if this launch replaces an existing storefront URL structure.
6. Keep deferred items in `docs/POST_LAUNCH_ROADMAP.md`, not in the launch-critical checklist.

### Acceptance Criteria

- Readiness docs and launch checklist agree.
- No checklist item is marked complete without evidence.
- Owner-only open items are clearly labeled.
- Deferred items are explicitly non-blocking and owner-approved.

---

## 18. Final Release Candidate Gate (P0)

Run the final gate from a clean checkout after all implementation PRs are merged.

### Automated Gate

```bash
rm -rf node_modules
npm ci
npm run codegen
npm run build
npm run typecheck
npm run lint
npm run test
npm run test:e2e -- --project=chromium
```

### Manual Gate

1. Verify target Oxygen environment variables.
2. Open deployed preview in a real browser.
3. Smoke-test homepage, collection, product, cart, policies, sitemap, and robots routes.
4. Verify Sentry test event if Sentry is in launch scope.
5. Verify Klaviyo test signup if newsletter capture is in launch scope.
6. Verify analytics debug/realtime events if analytics is in launch scope.
7. Complete real/test-mode Shopify order verification.
8. Verify content claims and policy links.
9. Verify market scope and checkout country/currency behavior.
10. Owner signs off on launch.

### Launch/No-Launch Rule

Do not promote to production if any P0 item is unresolved. P1 items may be deferred only with explicit owner acceptance recorded in the launch checklist.

---

## 19. Recommended PR Plan

### PR 1 — Dependency Matrix Repair

**Scope**

- Align Hydrogen, React Router, Vite, and React plugin versions.
- Regenerate `package-lock.json`.
- Prove clean install works.

**Required validation**

```bash
rm -rf node_modules
npm ci
npm explain vite
npm explain react-router
npm run build
npm run typecheck
npm run lint
npm run test
```

### PR 2 — CI Install Hardening

**Scope**

- Remove `--legacy-peer-deps` from workflow install steps.
- Confirm quality gate and deploy dependencies remain correct.
- Add workflow comments for check order.

**Required validation**

```bash
npm ci
npm run codegen
npm run build
npm run typecheck
npm run lint
npm run test
```

### PR 3 — Quality Gate Fixes

**Scope**

- Fix source issues surfaced after clean install.
- Keep changes minimal and directly tied to failing checks.

**Required validation**

```bash
npm ci
npm run codegen
npm run build
npm run typecheck
npm run lint
npm run test
```

### PR 4 — E2E Tightening

**Scope**

- Tighten or add Playwright coverage for product, cart, checkout redirect, mobile menu, and error states.
- Document manual-only journeys.

**Required validation**

```bash
npm ci
npm run build
npm run test:e2e -- --project=chromium
```

### PR 5 — Environment and Integration Verification Docs

**Scope**

- Record sanitized environment verification results.
- Record Sentry/Klaviyo/analytics verification results or deferrals.

**Required validation**

Documentation-only unless code changes are included.

### PR 6 — Commerce Verification Record and Fixes

**Scope**

- Record order verification result.
- Fix any checkout/cart/PDP defects discovered during the order test.

**Required validation for code changes**

```bash
npm ci
npm run codegen
npm run build
npm run typecheck
npm run lint
npm run test
npm run test:e2e -- --project=chromium
```

### PR 7 — Content Truth Cleanup

**Scope**

- Remove/rewrite unsupported claims.
- Remove or replace unverified testimonials.
- Confirm legal/policy links.

**Required validation for code changes**

```bash
npm ci
npm run build
npm run typecheck
npm run lint
npm run test
```

### PR 8 — Market Scope Implementation or Documentation

**Scope**

- Document US-only launch, or implement verified multi-market behavior.
- Remove claims that exceed launch scope.

**Required validation for code changes**

```bash
npm ci
npm run codegen
npm run build
npm run typecheck
npm run lint
npm run test
```

### PR 9 — Final Launch Documentation Reconciliation

**Scope**

- Update production readiness and launch checklist from actual evidence.
- Add owner signoff section.
- Move non-blocking items to roadmap.

**Required validation**

Documentation-only unless code changes are included.

---

## 20. Evidence Required Before Launch

The final launch PR or release issue should include links or copied summaries for:

1. Successful clean `npm ci` output.
2. Successful codegen output.
3. Successful production build output.
4. Successful typecheck output.
5. Successful lint output.
6. Successful unit-test output.
7. Successful Chromium E2E output.
8. Oxygen preview URL smoke-test result.
9. Shopify Admin order verification result.
10. Sentry event verification result or documented deferral.
11. Klaviyo signup verification result or documented deferral.
12. Analytics event verification result or documented deferral.
13. Content-truth approval.
14. Market-scope approval.
15. Owner launch approval.

---

## 21. Definition of Done

This implementation plan is complete when:

- Dependency installation works with normal `npm ci`.
- CI no longer relies on `--legacy-peer-deps`.
- Codegen, build, typecheck, lint, unit tests, and Chromium E2E pass.
- Oxygen preview is smoke-tested in a real browser.
- Required production environment variables are verified.
- A Shopify order is completed and verified in Shopify Admin.
- Third-party integrations are verified or explicitly deferred.
- Account/wishlist scope is verified or explicitly deferred.
- Public commercial claims are verified or removed.
- Market scope is owner-approved and reflected in code/copy.
- Launch docs are reconciled and evidence-backed.
- Owner gives explicit production-launch approval.
