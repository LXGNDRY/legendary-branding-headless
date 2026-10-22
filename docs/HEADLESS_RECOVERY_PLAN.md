# Headless Storefront Recovery Plan

**Status: planning complete; implementation not started under this recovery plan.**  
**Audit date:** 2026-10-22 (America/Chicago).  
**Repository:** `LXGNDRY/legendary-branding-headless`.  
**Audited baseline:** `dev` at `51ec8619233d78c7ee503c205f72627ba1444dea`.

## Start here — instructions for Claude

1. Read this document, [findings](audits/2026-10-22/FINDINGS.md), [verification limits](audits/2026-10-22/VERIFICATION.md), [every-file register](audits/2026-10-22/FILE_REVIEW.md), and `CLAUDE.md` before changing application code.
2. This plan replaces the earlier 11-gap TPS plan as the **execution index**. Historical plans remain evidence, not competing backlogs. Owner instructions and prohibited production/admin actions remain binding. Resolve conflicting rules using the latest explicit owner direction; do not silently rewrite governance.
3. Start R00, then R01–R08. Fix broken safety/quality/data contracts before component extraction or theme redesign. R22 runs continuously with every slice. Follow dependencies below; a task can be split into several coherent PRs.
4. Reproduce each finding on current dev before editing. `C` means observed source, `L` live corroboration, `H` a risk needing reproduction, `E` environment result. Never promote a hypothesis to confirmed root cause without evidence. Close disproven findings with the exact test/evidence.
5. Use one `claude/recovery-rXX-*` branch and focused PR into `dev` per vertical slice. Re-read current heads/open PRs; do not overwrite or duplicate their work. No direct protected-branch push, no force push. User authorization is **dev only when green**; this plan authorizes no merge to main or manual production deploy.
6. Maintain the per-slice status table below and add failing-before/passing-after evidence, verified head SHA, CI URL, deployed preview SHA/URL, acceptance results, risks and rollback in every PR. A green job whose test steps skipped is not a completed verification.
7. Do not execute a blanket rewrite. Replace a module only after its consumer/data contract and regression tests are explicit. Preserve working commerce journeys and public route compatibility; new architecture must reduce contradictions, not merely move literals.

## Why the storefront can pass checks and still behave incorrectly

The audit found **50 findings across 25 execution slices (R00–R24)**. The largest issue is inconsistent contracts across layers: session/market vs publicly cached responses, live API data vs saved USD/availability snapshots, selected language vs forced English checkout, published policy vs repeated marketing guarantees, and mocked provider requests vs real integration behavior.

Two quality gates are incomplete: ESLint has only ignores, and both generated GraphQL files have empty interfaces. Several tests verify mock shape rather than customer behavior. Consequently, the latest successful dev run establishes that the current checks passed; it does not establish complete storefront readiness. The new plan explicitly repairs these gates before using them to justify larger refactors.

The public homepage and shipping policy were checked read-only. Their shipping/duties statements conflict; current production settings and browser behavior have not been inspected. Source analysis does not prove every observed issue caused the owner's reported runtime errors. R00 records those symptoms and ties them to reproduced causes.

## Scope and boundaries

- All tracked text files at the pinned baseline were retrieved: application routes/components/hooks/libraries, styles/locales, type/config/generated files, package manifest/lock, workflows/scripts, all unit/E2E tests, and all documentation. See exact blob inventory and per-file treatment.
- Binary images/fonts were inventoried by path/blob/size, not visually or byte-decoded audited. Assets are not automatically defects because they are hardcoded. Their dimensions/rendering/network behavior are explicit R21 acceptance checks.
- Static checks and public HTML reads were performed. Local dependency install failed under Node 24/npm 11; build/typecheck/lint/Vitest/Playwright were **not rerun locally**. CI evidence is separately recorded. No fabricated coverage, performance score, test pass or provider confirmation.
- No application code, dependency, workflow, Shopify setting, policy, product, inventory, DNS, checkout/payment/tax configuration, live theme or customer record was changed by this planning deliverable.
- Do not access/export real customer data. Account/provider end-to-end verification uses an owner-approved synthetic account/address. No test email campaigns, purchases, payment submissions, paid service provisioning or production deployment without the corresponding authorization.

## Severity and completion rules

| Priority | Meaning | Release consequence |
|---|---|---|
| P0 | Core quality, security boundary, cart/lead correctness or demonstrably contradictory commerce contract | Fix or explicitly resolve with owner evidence before recovery promotion |
| P1 | Major functional, market, auth, data integrity, cost or deployment reliability | Required for affected feature to be called ready; disable/omit unsupported promise only through reviewed scope |
| P2 | Remaining UX, SEO, content, accessibility and maintainability consistency | Close before declaring full recovery; approved owner blockers stay visible |

Every slice has a named implementation owner, dependencies, acceptance and rollback below. **Claude owns repo work; the business owner owns platform settings, commercial truth and final assets.** External dependencies block only the dependent slice; continue independent authorized repo work.

## Target contracts to establish

| Contract | Authority | Consumers | Failure behavior |
|---|---|---|---|
| Product/variant/current price/availability | Storefront API in validated active market; generated types | PDP, quick-add, product/search/wishlist cards, schema | Explicit unavailable/error; never fabricated stock/currency |
| Shipping/duties/processing/returns claims | Owner-approved structured facts reconciled with published/native policy and actual checkout evidence | All UI/locales/chat/schema/policies | Neutral policy link or omit unsupported guarantee |
| Country/language/currency | Supported Shopify localization + signed session; cart buyer identity | Root/data routes/rendering/checkout | Consistent prior state or validated fallback with explanation |
| Public origin/content route identity | One validated storefront contract, separate checkout-domain setting | Meta/OG/schema/sitemap/robots/nav/legal links | No malformed URL, unintended indexing or duplicate authority |
| Customer/session data | Supported Customer Account API + cookie contract | Account, cart identity, wishlist | Private no-store, bounded auth errors; no cross-account state |
| Signup/restock | Revision-specific provider contract + explicit consent + durable variant requests | Lead forms, Klaviyo client, provider flows | Never claim stored/subscribed/delivery from mocked or merely accepted response |
| Analytics | Category consent + production/test environment + channel event adapter | Shopify/GA4/Meta/TikTok/Klaviyo onsite | No unconsented or preview production events; revocation honored |
| Optional external data | Typed server adapters with timeout, cache and safe error pipeline | Nav enrichments, reviews, discounts, chat | Catalog/commerce remains usable; error is observable |
| UI foundation | Shared semantic tokens, controls, topmost overlay manager | All pages/states | Keyboard/touch/JS-failure usable; approved empty/loading/error states |

Do not externalize every number into environment variables. Protocol identifiers, security allowlists and validated bounded limits can remain named code constants. Merchant-managed content belongs in a validated content contract; environment identity/secrets belong in runtime configuration; shopper state belongs in session/storage with schema/version control.

## Execution order

| Stage | Slices | Exit |
|---|---|---|
| Baseline | R00 | Reported symptoms, source/deploy identity and initial failures recorded |
| Restore trust in checks | R01, R02, R03; begin R22 | Deterministic install, effective lint, real GraphQL validation/types |
| Critical correctness | R04, R05, R06, R07, R08 | Cart/cookie/rendering/commerce claims/lead contracts verified |
| Customer journeys | R09–R18 with dependencies | Market/search/wishlist/auth/provider/consent/cost behavior verified |
| Consistency and readiness | R19, R20, R21, R23; finalize R22/R24 | SEO/UI/content/deployment verified against reviewed preview |

Run independent repo work while waiting for owner decisions; do not weaken gates to get around a dependency. Tests and documentation ship alongside fixes, not as an unfunded final phase.

## Work packages

### R00 — Freeze the execution baseline and reproduce reported failures

- **Priority:** P0
- **Dependencies:** None
- **Owner:** Claude; owner supplies reproducible symptoms if unavailable
- **Scope:** Record dev/main SHA, deployed SHA/URL, latest CI jobs and environment identity. Read this plan, CLAUDE and open PRs. Run the same browsers/session/market steps the owner reports. Establish synthetic fixtures and a problem log before editing. Confirm which production features are enabled using presence-only diagnostics.
- **Acceptance:** One reproducible failing journey or an explicitly unverified hypothesis per symptom; saved status, request ID, console/worker error, route, market, viewport and expected behavior. No secrets/customer data.
- **Rollback:** None; read-only.

### R01 — Restore deterministic installs

- **Priority:** P0
- **Dependencies:** R00
- **Owner:** Claude; owner review package/lock
- **Scope:** Resolve F01 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** CI Node 22/npm baseline plus a clean supported contributor install; lock diff and peer/audit evidence.
- **Rollback:** Revert package/lock/toolchain change together; do not keep a manually altered lock.

### R02 — Make lint a real gate

- **Priority:** P0
- **Dependencies:** R01
- **Owner:** Claude; owner review dependency changes
- **Scope:** Resolve F02 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Temporary negative lint probes fail; normal source gate green with actual TSX rules enabled.
- **Rollback:** Revert tooling and related cleanup atomically; retain finding open if no real lint remains.

### R03 — Restore schema validation and generated API types

- **Priority:** P0
- **Dependencies:** R01
- **Owner:** Claude; owner review codegen/workflow/package
- **Scope:** Resolve F03 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Nonempty generated output and operation binding, negative drift/schema probes; discover newly exposed defects before further refactors.
- **Rollback:** Revert complete config/generated/types slice; do not mark stub output healthy.

### R04 — Make all cart mutations failure-safe

- **Priority:** P0
- **Dependencies:** R03
- **Owner:** Claude
- **Scope:** Resolve F04 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Meaningful action + browser errors/empty/success contracts; reconcile PR #365 instead of duplicating it.
- **Rollback:** Revert cart slice; avoid reverting unrelated schema fixes.

### R05 — Preserve session and cart cookies across responses

- **Priority:** P0
- **Dependencies:** R04
- **Owner:** Claude; owner review server/session
- **Scope:** Resolve F05 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Real multiple-cookie persistence and redirect tests with pending session and cart together.
- **Rollback:** Revert cookie composition slice; record session migration implications.

### R06 — Close unsafe rendering and request boundaries

- **Priority:** P0
- **Dependencies:** R02, R03
- **Owner:** Claude; owner review security/server
- **Scope:** Resolve F06, F07, F46 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Independent JSON-LD and rich HTML malicious fixtures; normal merchant content visual comparisons; malformed/oversized request matrix.
- **Rollback:** Revert per boundary; never globally bypass sanitation/CSP to make fixtures pass.

### R07 — Resolve commerce truth and contradictory policies

- **Priority:** P0
- **Dependencies:** R00
- **Owner:** Claude inventory/neutral code; owner resolves policy/settings authority
- **Scope:** Resolve F08, F09, F49 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Approved truth matrix plus every claim consumer/locale/schema checked; do not change admin shipping/taxes/policies.
- **Rollback:** Revert claim source/consumers together; retain neutral policy links while unresolved.

### R08 — Prove lead signup and variant restock behavior

- **Priority:** P0
- **Dependencies:** R03, R06
- **Owner:** Claude code/contracts; owner-controlled test address/provider-flow decision
- **Scope:** Resolve F10, F11 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Provider-revision contract and controlled end-to-end acceptance; accepted job distinguished from completed signup; multiple variant requests preserved.
- **Rollback:** Revert request and UI contract together; disable unsupported promise rather than fabricate success.

### R09 — Correct resource and document cache isolation

- **Priority:** P1
- **Dependencies:** R03, R05
- **Owner:** Claude
- **Scope:** Resolve F12 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Two-market/two-session same-URL cache tests plus deployed header checks; private and errors never shared.
- **Rollback:** Revert cache-policy slice or use conservative no-store while isolating root cause.

### R10 — Repair wishlist/persistence data contracts

- **Priority:** P1
- **Dependencies:** R03, R05, R09
- **Owner:** Claude; synthetic account only
- **Scope:** Resolve F13, F14, F15, F41 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Live active-market card adapters; state-machine race tests; corrupted storage; account transitions and byte limits.
- **Rollback:** Versioned reversible storage migration; retain recoverable guest data; revert API/UI together.

### R11 — Align market, locale and checkout context

- **Priority:** P1
- **Dependencies:** R03, R04, R05, R09
- **Owner:** Claude; no Shopify Markets/settings mutation
- **Scope:** Resolve F16, F17 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** EN/FR/DE/PT-BR + two countries; failed buyer update; refresh/back/login/cart identity remains coherent.
- **Rollback:** Revert context/helper/UI slice; preserve backward-compatible session reading.

### R12 — Make PDP/quick-add accurate for the full catalog

- **Priority:** P1
- **Dependencies:** R03, R04, R09
- **Owner:** Claude
- **Scope:** Resolve F18, F19, F47 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Price/inventory freshness and >100-variant fixtures; no default variant purchasing; reconcile PR #366.
- **Rollback:** Revert freshness/variant slice separately from later component extraction.

### R13 — Repair full search, predictive search and collection filtering

- **Priority:** P1
- **Dependencies:** R03, R09, R11
- **Owner:** Claude
- **Scope:** Resolve F20, F21, F22 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** All exposed sort choices schema-valid; mixed results; finite input bounds; request race and facet/cursor back/forward tests.
- **Rollback:** Revert one route capability at a time; use validated default sort on invalid URLs.

### R14 — Isolate optional dependencies and report real errors

- **Priority:** P1
- **Dependencies:** R03, R05
- **Owner:** Claude; owner review server
- **Scope:** Resolve F23, F24 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Inject independent upstream failures; real redacted error reporting; bounded TTFB; no optional failure takes catalog shell down.
- **Rollback:** Revert dependency/reporting slice; no request/customer secrets in rollback logs.

### R15 — Repair consent and channel event integrity

- **Priority:** P1
- **Dependencies:** R03, R05, R11, R14
- **Owner:** Claude; owner verifies test analytics/property settings
- **Scope:** Resolve F25, F26 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Consent state/network matrix and mapped channel event contracts; no preview production traffic; purchase ownership documented.
- **Rollback:** Revert SDK/adapter/consent slice; preserve deny-by-default rather than enable all tracking.

### R16 — Protect and correctly ground paid chat

- **Priority:** P1
- **Dependencies:** R06, R14
- **Owner:** Claude local layer; owner shared-control/spend-cap choice
- **Scope:** Resolve F27, F28 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Nondefault cleanup window; multi-isolate/control proof; current catalog/Unicode; provider-readiness behavior and spend evidence.
- **Rollback:** Revert policy slice; disable unavailable/cost-exposed feature if approved rather than pretending global enforcement.

### R17 — Verify account flows, lists and private-route boundaries

- **Priority:** P1
- **Dependencies:** R03, R05, R06, R11
- **Owner:** Claude tests/code; owner synthetic-account authorization/config
- **Scope:** Resolve F29, F30 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** OAuth expiry/callback/logout + profile/address CRUD, complete lists, private headers/meta, validated country/zone fields.
- **Rollback:** Revert one account capability; preserve known working OAuth/session config.

### R18 — Make review attribution and aggregation truthful

- **Priority:** P1/P2
- **Dependencies:** R03, R14
- **Owner:** Claude; owner approves neutral attribution/curation policy
- **Scope:** Resolve F31, F32 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** No invented name; aggregate/list/source consistency; invalid/out-of-range/truncated provider data and cached outage behavior.
- **Rollback:** Revert adapters/display together; omit unverifiable testimonial/aggregate rather than invent it.

### R19 — Unify public URLs, policy routes and SEO

- **Priority:** P2
- **Dependencies:** R03, R07, R09, R11
- **Owner:** Claude; owner approved canonical/content contract
- **Scope:** Resolve F33, F34, F35 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** All canonical/OG/schema/sitemap/robots agree; every legal/help link verified; no missing logo or invalid image transform.
- **Rollback:** Revert alias/metadata slice; preserve existing public route compatibility.

### R20 — Unify interactive and overlay accessibility

- **Priority:** P2
- **Dependencies:** R04, R10, R13, R17
- **Owner:** Claude
- **Scope:** Resolve F36, F37 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Keyboard + axe across real filled/error/private/dialog states; single interactive controls; topmost trap/restore semantics.
- **Rollback:** Revert control/overlay capability individually with keyboard behavior rechecked.

### R21 — Reconcile theme, active sections and merchant content

- **Priority:** P2
- **Dependencies:** R07, R11, R12, R20
- **Owner:** Claude implementation; owner final campaign/assets
- **Scope:** Resolve F38, F39, F40, F48 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Computed contrast; JS-disabled content; hydration; active/dormant registry; representative desktop/mobile screenshots and measured CLS.
- **Rollback:** Revert token/component/content slices independently; never commit new imagery without approval.

### R22 — Replace false-confidence tests with regression evidence

- **Priority:** P1 ongoing
- **Dependencies:** Start after R01; runs with every slice
- **Owner:** Claude; owner test-account/provider evidence only
- **Scope:** Resolve F42, F43 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Measured coverage floor, hermetic unit tests, semantic deployed smoke, explicit skips/retries and all four browser projects.
- **Rollback:** Revert incorrect assertions only with replacement evidence; never quarantine a failing behavior to obtain green.

### R23 — Bind deployment evidence to tested code/configuration

- **Priority:** P0/P1
- **Dependencies:** R01, R03, R14, R22
- **Owner:** Claude workflow; owner environment/rules review
- **Scope:** Resolve F44, F50 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Head/source/artifact identity, runtime presence checks, successful deploy and semantic smoke; tested recovery from failed smoke.
- **Rollback:** Restore last known healthy SHA through normal PR/CI; never force-push or manually deploy production.

### R24 — Reconcile instructions and close recovery with evidence

- **Priority:** P2 ongoing
- **Dependencies:** Update alongside every slice; final after R23
- **Owner:** Claude docs; owner governance decisions
- **Scope:** Resolve F45 using the linked findings; preserve each observation, adjustment and acceptance contract.
- **Acceptance:** Current docs reflect code and actual gates; all findings closed/blocked with evidence; named owner for every unresolved dependency.
- **Rollback:** Revert inaccurate documentation only; historical audit remains immutable.

## Mandatory verification matrix

| Surface | Required scenarios | Evidence |
|---|---|---|
| Boot and root | Missing/invalid env, optional upstream down, cart/auth/localization errors, cold/warm cache | Controlled status, bounded response, correlated redacted log |
| Homepage and collections | Empty/partial data, dynamic content, all sorts/filters/pagination, Back/Forward | Contract tests + four browser projects |
| PDP and quick-add | All option states, >100 variants, sold out, changed price/inventory, missing images/metadata, provider delay | Correct selected variant/price/image, no default accidental purchase |
| Cart and permalink | Add/update/remove/discount invalid + success, expired cart, pending session, concurrent clicks, invalid link | Both cookies persist; structured errors/warnings; truthful totals; safe handoff |
| International | Two countries and EN/FR/DE/PT-BR, same URL across sessions, market update failure | Currency/language/session/cart/checkout consistent; no shared personalized cache |
| Account and wishlist | Configured/unconfigured, OAuth expiry/callback/logout, CRUD, >10 lists, cross-account transition | Synthetic account only; no data loss or public caching |
| Lead/restock | Bad body/email/IDs, missing env, 4xx/429/timeouts, double opt-in, multi-variant requests | Contract validation + controlled provider evidence; no false confirmation |
| Consent/analytics | Undecided, reject, category subset, accept, revoke elsewhere, storage denied, preview | Network and event-schema assertions; no production contamination |
| Content/SEO | Every public/help/legal route, duplicates/404, missing facts, malicious HTML/JSON-LD | Semantic HTML/status/canonical/schema/sitemap and safe serialization |
| Accessibility/visual | 320/390/768/1440px, 200% zoom, touch/keyboard, reduce motion, JS disabled, filled/error/dialog states | Axe + computed contrast + reviewed screenshots; real iOS listed separately |
| Performance | Cold/warm homepage/PDP/PLP, slow optional integrations, long catalog, deployed assets | Capture baseline and p75 LCP/INP/CLS/TTFB; agree budget before optimizing; target good CWV where measurable |
| Deployment | Exact head/CI/test execution, runtime config presence, semantic preview smoke, rollback | Successful published deploy and smoke for reviewed SHA, not PR-skipped deploy |

### Quality command sequence

Use documented supported Node/npm and real local runtime config without committing it. Start clean with `npm ci --legacy-peer-deps`, run `npm run codegen`, inspect generated diff, then `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run locales:check`, and applicable `npm run test:e2e` against a built Hydrogen preview. Build must precede typecheck. Add coverage command/provider only in R22 after a measured baseline. CI equivalent must pass for the exact PR head and merge result. Record skipped tests, retries, provider calls and runtime limitations explicitly.

Do not put unredacted secrets into PRs, artifacts, command logs or the plan. Credential/schema tools may validate read-only API shape; live subscriptions, auth identities and payment/order actions need the corresponding controlled verification setup.

### Definition of done for a slice

- [ ] Current-source reproduction and classification agree with the finding.
- [ ] Regression tests fail on the old behavior and pass on the fix; input/error/cache/security paths covered.
- [ ] Generated/API contracts match installed versions; no broad suppression or fabricated data.
- [ ] Local supported-toolchain checks and exact-head full CI are green, or concrete blocker is recorded and slice remains open.
- [ ] Full applicable four-project E2E matrix actually executed; deployed-preview semantic smoke completed after dev merge.
- [ ] Screenshots/keyboard/real-device evidence provided where the task needs it.
- [ ] Owner decision/review requirements satisfied under current conversation/repo policy.
- [ ] PR includes risk, rollback, SHA, CI/deployment URLs and updated task/finding status.

## Open decisions and external blockers

| Decision/evidence | Owner | Blocks | Work that can proceed now |
|---|---|---|---|
| Actual shipping/duties/processing/return authority where policy and instructions disagree | Business owner | R07 final guarantees | Inventory every consumer, neutral copy proposal, contract and tests |
| Shared rate-limit platform and Anthropic spend-cap verification | Business owner/platform access | R16 global protection | Local expiration fix, bounded policies, feature readiness and tests |
| Approved synthetic account and controlled subscriber address/provider flow | Business owner | R08/R17 live acceptance | Hermetic schema/response/consent tests and error handling |
| Final campaign imagery, merchant content source and active section decisions | Business owner | R21 final assets | Dimensions/fallback/reachability/visual consistency inventory |
| Confirm supported production feature set and Oxygen runtime env presence | Business owner/platform access | R00/R23 parity | Presence-only diagnostics design; no values printed |

## Existing work and previous TPS mapping

At audit time, PR #365 (cart tests) and #366 (quick-add tests) remain open and have green quality/four-browser checks; deploy is correctly skipped on PR events. Inspect their current diffs before reuse. They do not fix the newly documented null-cart, provider-contract or cache-consistency problems. Dependency PRs #353/#348/#347/#346/#312/#311 need release-note/peer/runtime verification under R01/R03/R22/R23; do not mass-merge them as remediation.

| Previous WI | Recovery disposition |
|---|---|
| WI-0 baseline | R00/R01/R22; prior baseline incomplete |
| WI-1 GraphQL | R03; remove assumption that local bundled-schema generation inherently requires live secrets |
| WI-2 locale gate | Already merged; locale coverage passes; R11 still addresses untranslated/incorrect claims and reviewable formatting |
| WI-2b smoke | Already merged; latest dev run passed; R22 strengthens semantic assertions rather than counting HTTP 200 as correctness |
| WI-3 rate limit | R16; correct local cleanup as well as shared enforcement |
| WI-4 tests | R22 alongside all fixes, with accurate current file counts and meaningful coverage |
| WI-5 Klaviyo/logging | R08/R14; shared helper exists, but request contract and server reporting remain unproven/incomplete |
| WI-6 HTML | R06; separate content HTML from JSON-LD; avoid regex sanitizer requirement |
| WI-7 PDP split | Only after R04/R12/R22; extract tested responsibilities, preserve behavior and verify visuals |
| WI-8 docs | R24; source-of-truth reconciliation, not only archival |
| WI-9 imagery | R21; inventory active vs dormant, owner assets still required |
| WI-10 upgrades | R01/R22/R23; checklist + semantic test execution/provenance, not merely another green label |

## Status tracker

Initial status for every recovery task is **Not started**; this document and its audit are the completed planning deliverable. Do not infer implementation completion from an older milestone or this plan's merge.

| Slice | Status | Branch/PR | Verification evidence | Owner blocker |
|---|---|---|---|---|
| R00 | Not started | — | — | See package/decision table |
| R01 | Merged to dev (#368) | claude/recovery-r01-r03-gates | Node 22.22/npm 10.9 `npm ci --legacy-peer-deps` clean; Node 24 failure not reproduced here (no Node 24); `.nvmrc` added | See package/decision table |
| R02 | Merged to dev (#368) | claude/recovery-r01-r03-gates | oxlint replaces ESLint (typescript-eslint cannot run on TS 7.0); hooks/correctness errors gate; a11y + React-compiler rules are warnings until R20/R21; probe with conditional hook fails | See package/decision table |
| R03 | Merged to dev (#368) | claude/recovery-r01-r03-gates | `.graphqlrc.ts` uses `getSchema`; generated files are now 78 KB/21 KB; surfaced search-sort and URL-scalar type errors, fixed | See package/decision table |
| R04 | Merged to dev (#369); preview check owed | claude/recovery-r04-cart-safe | Shared `handleCartMutation`: input validation, null-cart and provider-throw handling, cart cookie only for a returned cart; 23 new tests | See package/decision table |
| R05 | Merged to dev (#369); preview check owed | claude/recovery-r05-cookies | `server.ts` appends (not replaces) the session cookie and copies cookies through 404 redirects; `commit()` clears `isPending`; 8 new tests. Real-browser/OAuth cookie checks still owed (needs preview) | See package/decision table |
| R06 | Merged to dev (#370); visual comparison owed | claude/recovery-r06-html-safety | `serializeJsonLd`, parse5-based `sanitizeHtml` + `SafeHtml` (only raw sinks: SafeHtml, JsonLd), validated CMS content blocks; 47 new tests incl. 24 attack fixtures. Remaining from F46: body-size/method bounds on other actions, nonce CSP (follow-up) | See package/decision table |
| R07 | Merged to dev (#371); owner decision on shipping/duties still needed | claude/recovery-r07-claims | Unconditional free-shipping and duties-included claims removed from announcement, marquee, stat strip, cart drawer, PDP, trust signals and all 8 locales; neutral "calculated at checkout" copy; discount popup discloses conditions; source-scan regression test. **Final claims still need owner decision** (see open decisions) | Owner: shipping/duties/processing/returns authority |
| R08 | Merged to dev (#372); live acceptance owed | claude/recovery-r08-leads | Subscribe payload fixed to the documented 2024-02-15 shape (profiles at `data.attributes.profiles.data`); restock now uses Klaviyo's per-variant back-in-stock endpoint with server-side variant/product/sold-out validation and no marketing opt-in; 202 treated as accepted not confirmed. **Live acceptance with a controlled address and the account's Back in Stock flow still owed** | Owner: test address, Klaviyo catalog sync + Back in Stock flow |
| R09 | Merged to dev (#373); deployed header check owed | claude/recovery-r09-cache | Predictive search and quick-add are `private` on success and `no-store` on every error; `withDefaultCacheControl` gives all other non-asset responses `private, max-age=0, must-revalidate` (errors `no-store`) unless a route sets its own. Deployed header/two-market check on the preview still owed | — |
| R10 | Merged to dev (#374); synthetic-account acceptance owed | claude/recovery-r10-wishlist | Identity-only wishlist (validated, versioned, migrates legacy snapshots); read-merge-then-write provider with cancellation, retry/error status and account isolation (found+fixed a logout leak); API validates/bounds (405/413/400), private no-store, no provider messages; live-market cards via `/api/wishlist-products` with honest unavailable/error states; RecentlyViewed cookie validated and size-bounded. Real synthetic-account and two-tab acceptance still owed | Owner: synthetic account |
| R11 | Merged to dev (#376); translations + browser journeys owed | claude/recovery-r11-market | Checkout locale, `<html lang>`, dates, money and review counts follow the selected language (`locale.ts`); market switch updates the cart first and commits session + returned cart id together or keeps the previous market; stale saved markets/languages are cleared. Still open: translating the untranslated UI strings (footer, cart, account, forms, errors) and EN/FR/DE/PT-BR browser journeys on the preview | Owner: translation review |
| R12 | Merged to dev (#377); preview verification owed | claude/recovery-r12-pdp | PDP split into long-cache editorial + short-cache (30s, no stale-if-error) commerce query; variants and quick-add paginate past 100; search uses the shared ProductCard fragment (same-variant sale pair) with PRODUCT-only results, validated sort/price/text params; cards never pair range minima. Late-variant purchase and price/stock freshness on the preview still owed | — |
| R13 | Merged to dev (#378); device checks owed | claude/recovery-r13-search-filters-v2 | Typeahead aborts stale requests, never reopens after clear/unmount, uses API currency + language, unique ARIA ids; collection sort/filter/clear reset `cursor` AND `direction`; price/type/tag params validated; mobile filter drawer is a focus-trapped, scroll-locked dialog. Still open: canonical facet `input` values (labels still used for productType) and real-device keyboard/touch + back/forward checks | — |
| R14 | Merged to dev (#379); preview Sentry verification owed | claude/recovery-r14-resilience | Root loader: localization stays critical; cart, menu, nav lookups, analytics shop and auth are bounded (3 s) with safe fallbacks and reporting (`optional()`); one server error pipeline (redacted URL/message/extras, real release + preview/production environment, 3 s send timeout, `waitUntil` drain) fed by `handleError`, render errors and `captureError`. Still open: preview-tagged event verification with a real Sentry DSN, cold/warm TTFB measurements, streaming-render errors that occur after the response starts | Owner: Sentry DSN for preview test |
| R15 | Merged to dev (#380); vendor-debugger verification owed | claude/recovery-r15-consent | Three independent consent categories (analytics / marketing / preferences) with legacy migration, Customize panel and footer "Cookie preferences"; trackers load only for granted categories and are switched off on revocation (GA4 opt-out + Consent Mode, Meta/TikTok revoke); Shopify decisions override a stale local one; GA4/Meta/TikTok ids withheld on preview/local hosts; per-channel event mappers (view, search, add/remove, cart, checkout) with unit-delta quantities, once-only subscription and no doubled load page view. Still open: vendor-debugger verification on test IDs, Meta/TikTok catalog id confirmation, checkout-side purchase verification, Klaviyo cannot be unloaded until next page load | Owner: test analytics properties |
| R16 | Merged to dev (#381); owner spend cap owed | claude/recovery-r16-chat | Named rate-limit policies with per-entry expiry, bounded storage and no spoofable identity (edge header only; unidentified requests share one bucket); chat adds hourly + per-isolate ceilings, body cap, one 20 s deadline, provider-readiness (widget hidden and 503 when unconfigured), live collections/price range in the prompt, Unicode keyword search, valid alternating history, status-and-type-only provider error logs. Still open: owner choice of a shared control or provider spend cap with evidence (docs/CHAT_PROTECTION.md); local limits are not a spend guarantee | Owner: spend cap / shared limit |
| R17 | In PR (code + mocked-API tests only) | claude/recovery-r17-account | Account loaders/mutations guarded (API errors, null data and thrown failures become retry states; expired-session redirects pass through); orders and addresses paginate with a validated `after` cursor (default address kept on page 1); address country comes from the saved ISO code (no name reversal, no silent US), US/CA/AU states are required lists, other countries take an optional short region code, field lengths bounded, Unicode kept, address ids validated; callback failure no longer loops or 500s; logout is POST + same-origin (GET only redirects); every account/cart response (errors and redirects included) is `private, no-store` + `X-Robots-Tag: noindex`, child meta repeats noindex and drops public canonicals; account ErrorBoundary. Still open: successful OAuth/profile/address CRUD/logout, expired sessions and international addresses against an approved synthetic account (none run in CI), full state/province lists for other countries | Owner: synthetic account |
| R18 | Not started | — | — | See package/decision table |
| R19 | In PR (code + tests; e2e gate added) | claude/recovery-r19-seo | One public origin (`lib/site.ts`) drives canonicals, og:url, JSON-LD, sitemap and robots (no more checkout-domain derivation); previews are noindex by header as well as robots.txt; `/policies/:handle` owns the policy handles (built-in store policy beats a stale same-handle Page, required page with no content is 503, `/pages/<policy>` and `/policies/<page>` redirect 301, sitemap lists only usable pages once); URL-aware CDN transforms; real fallback logo; no article lastmod; return policy names only the active market and is never defaulted to US; footer/legal links verified by a source scan and an e2e gate. Still open: owner approval of the policy-authority rule (docs/PUBLIC_URLS.md), merchant-managed contact/social/handles as configuration | Owner: policy content authority |
| R20 | Not started | — | — | See package/decision table |
| R21 | Not started | — | — | See package/decision table |
| R22 | Not started | — | — | See package/decision table |
| R23 | Not started | — | — | See package/decision table |
| R24 | Not started | — | — | See package/decision table |

## Full recovery exit

All P0/P1 findings reproduced and corrected or explicitly scoped/blocked with owner decision; all P2 completed before declaring the entire effort done; every tracked file accounted for; no known unsupported commerce/consent/provider promise; supported clean install and effective gates; all critical journeys verified on the reviewed deployed dev preview; runtime/configuration identity recorded; documentation matches implementation. Only the owner can authorize any later production promotion beyond the dev-only instruction in this conversation.
