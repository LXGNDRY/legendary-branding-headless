# Verification record and limits

## Baseline and scope

- `dev`: `51ec8619233d78c7ee503c205f72627ba1444dea`; all file/source links are pinned to it.
- Full recursive GitHub tree returned `truncated: false`. Every tracked text file was retrieved through the authorized GitHub connector and materialized for local source review; exact register in FILE_REVIEW.md.
- `main...dev`: GitHub reports ahead 6/behind 7. Reverse comparison `dev...main` has **zero changed files** and the seven main-only commits are release merge commits. This is ancestry divergence, not evidence that main contains seven missing source fixes. Use GitHub's comparison and inspect future diffs; do not force-reset either branch.
- Read-only branch API returned `protected:false` / required checks enforcement off for dev and main, and repository rulesets returned `[]`. R23 includes an owner-reviewed enforcement contract; no settings were changed.
- Latest dev workflow [39789231991](https://github.com/LXGNDRY/legendary-branding-headless/actions/runs/39789231991) completed **success**, including quality/four E2E/deploy. Earlier run 39788698571 was cancelled after a subsequent dev push; do not present that cancelled run as overall success.
- PRs [#365](https://github.com/LXGNDRY/legendary-branding-headless/pull/365) and [#366](https://github.com/LXGNDRY/legendary-branding-headless/pull/366) are open with quality/four E2E/Branch Topology success and deployment skipped. No code PR was merged during this planning pass.

## Commands actually attempted

| Check | Result | Interpretation |
|---|---|---|
| `node --version`; `npm --version` | v24.19.0; 11.9.0 | Audit host differs from Node 22 CI |
| `npm ci --legacy-peer-deps --ignore-scripts --fetch-retries=0 --fetch-timeout=15000` | **Failed EUSAGE**, missing optional native platform packages | Reproduced contributor/toolchain portability issue; ignore-scripts used to avoid executing install lifecycle hooks during audit; does not establish CI Node 22 failure |
| `node --test scripts/*.test.mjs` | Failed: Vitest unavailable after failed install | These are Vitest suites, not native node:test suites; this attempted invocation establishes no application regression and is not the supported test command |
| `python3 scripts/locales.py --check` | **Passed**: English + 7 locales | Catalog parity/interpolation check only; not translation completeness, policy accuracy or UI localization |
| Static CSS custom-property scan | No unresolved `var(--...)` references found among scanned app files | Do not claim missing CSS variables; computed contrast/layout still unverified |
| Text source scans/inventory | 216 text files / 38,768 lines; 32 routes, 47 component modules, 35 test files | Includes docs/lockfile; not a measured coverage percentage |
| Coverage dependency/config scan | No @vitest/coverage provider or coverage thresholds | Existing plan's coverage command is not presently a ready verification gate |
| Local codegen/build/typecheck/lint/Vitest/Playwright | **Not executed successfully in this audit** | Blocked by clean install; remote CI successes are reported separately, not claimed as local results |
| Secret/dependency security certification | Not performed | No assertion of vulnerability-free dependencies or exhaustive secret-history scan; R01/R06 must produce the relevant evidence |

## Public live HTML corroboration (read-only, 2026-10-22)

1. [Homepage](https://www.legendary-branding.com/): unconditional free shipping and Friday-drop claims; visible products include 210GSM tees and prices below the chat prompt's $55 floor. This confirms content contradictions, not whether every marketed fabric claim is false for every product.
2. [Shipping policy](https://www.legendary-branding.com/policies/shipping-policy): standard $5 below $100, free at $100+; express $12; processing 1–3 business days plus production; duties/taxes added at checkout. These are published text, not verified current checkout/settings. They conflict with repeated frontend shipping/duties text and the owner's earlier 2–3 day processing instruction. R07 requires authoritative reconciliation.
3. Collection URL could not be retrieved through the public-page reader in this audit. Treat as a retrieval limitation, **not proof that the live collection is broken**. No authenticated browser, checkout/payment submission, subscription or account mutation was performed.
4. Public page content does not identify its deployment commit; do not equate public live HTML with dev preview SHA. R00/R23 must establish deployed provenance.

## External contract references

Use the **installed** versions/schema and pinned provider revision when implementing; do not copy latest examples blindly.

- [Shopify Hydrogen codegen CLI](https://shopify.dev/docs/api/shopify-cli/hydrogen/hydrogen-codegen).
- [Shopify graphql-codegen source/usage](https://github.com/Shopify/graphql-codegen): shared preset/pluck/module-augmentation model. Consult the installed Hydrogen-specific preset/schema configuration before changing .graphqlrc.ts.
- [Shopify cart handler setup](https://shopify.dev/docs/storefronts/headless/legacy/hydrogen/cart/setup): reference for cart ID persistence; legacy page, verify against installed 2026.4.7 implementation.
- [Klaviyo pinned 2024-02-15 Subscribe Profiles](https://developers.klaviyo.com/en/v2024-02-15/reference/subscribe_profiles): asynchronous 202 and list double opt-in behavior. Request nesting still requires expanded schema validation; no live provider acceptance was tested.
- [React Router error reporting](https://reactrouter.com/how-to/error-reporting): entry handleError is required for handled route failures. [Framework error boundaries](https://reactrouter.com/how-to/error-boundary) can receive error props; the root's error prop is **not automatically a bug**.

Shopify skill reference was read. Its retrieved Hydrogen reference was predominantly API type declarations; bundled search/feedback scripts were not available as local executable files through this cloud package. Official connector documentation search and primary-source web reads were used instead. No Shopify application/GraphQL code was generated in this documentation-only deliverable.

## What would be required to call the whole storefront verified

Supported clean install; effective lint and schema generation; all P0/P1 regression tests; full four-browser execution; controlled configured auth/provider flows; semantic deployed preview smoke and runtime config parity; all-route screenshots/keyboard/computed contrast; real iOS evidence if claimed; measured performance/coverage budgets; owner commercial/content decisions closed. None may be substituted with a green docs PR or a single HTTP 200.
