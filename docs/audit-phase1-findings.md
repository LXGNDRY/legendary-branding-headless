# Audit Phase 1 — Static/Config Correctness: Findings

Ref: `docs/full-site-audit-plan.md` Phase 1. Status legend: **Pass** / **Gap** / **Fixed**.

| # | Item | Status | Detail |
|---|---|---|---|
| 1 | `tsconfig.json` `rootDirs` includes `.react-router/types` | Pass | Present (`"rootDirs": [".", "./.react-router/types"]`). `rm -rf .react-router && npm run build && npm run typecheck` clean. |
| 2a | No `console.log`/`debugger`/TODO in committed code | Pass | One `console.log` found (`app/lib/monitoring.ts:158`), gated behind `import.meta.env.DEV` — compliant dev-only diagnostic, not shipped to production. No `debugger`, no `TODO` comments. |
| 2b | No `@ts-ignore`/`eslint-disable` masking real errors | Pass | Zero `@ts-ignore`. 7 `eslint-disable-next-line` instances: 5 are `react/no-danger` on known, necessary `dangerouslySetInnerHTML` renders (JsonLd, ContentBlocks, policies/journal/pages routes rendering sanitized Shopify rich text) — the standard, expected suppression for that pattern. 1 is `react-hooks/exhaustive-deps` in `ProductGallery.tsx:62`, verified as a deliberate referential-stability choice (dep is `selectedImage?.url`, not the whole object, to avoid re-running on a new-but-equal-url object) — not hiding a bug. |
| 3a | `npm audit` — no high/critical | **Fixed** | 2 high-severity production-path advisories (`brace-expansion` DoS, `js-yaml` DoS) resolved via `npm audit fix` (lockfile-only, no `package.json` version bumps, non-breaking). Remaining 19 advisories are all dev-only tooling transitive deps (`undici`/`ws` via `miniflare`/`@shopify/mini-oxygen`) requiring a breaking major bump (`@shopify/mini-oxygen@0.0.5` same lineage as already-tracked PR #243/#247-style major bumps) — correctly left for separate major-version review per CLAUDE.md dependency-management rule, not bundled into this fix. Full gate (`build && typecheck && lint && test`, plus a clean `npm ci --legacy-peer-deps`) re-verified green after the lockfile update. |
| 3b | No `"latest"` version ranges in `package.json` | Pass | None found. |
| 3c | `package-lock.json` in sync (`npm ci` succeeds) | Pass | Re-verified with a clean `node_modules` + `.react-router` wipe and `npm ci --legacy-peer-deps`. |
| 4a | `.env.example` keys vs. `env.d.ts` `Env` interface | **Fixed** | `SHOP_ID` was declared in `env.d.ts` (part of Hydrogen's standard `HydrogenEnv` contract) but missing from `.env.example` — added as a placeholder (`SHOP_ID=`) with an explanatory comment. All other keys matched in both directions (double-checked with a full diff, not spot-check; an earlier regex pass had a false alarm on `PUBLIC_GA4_MEASUREMENT_ID` from an a digit-excluding pattern — confirmed present once the regex was corrected). |
| 4b | `.env.example` placeholders only, no real secrets | Pass | Visually confirmed — all values are empty, a label (`legendary-branding.com` is the public checkout domain, not a secret), or documented defaults. |
| 4c | `createAppLoadContext` fails fast on required vars | Pass | `app/lib/context.ts` throws individually for `SESSION_SECRET`, `PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_API_TOKEN`, and has a deliberate both-or-neither check for the Customer Account API pair. `SHOP_ID` is not validated here because it's unused by application code (Hydrogen-contract-only) — no action needed. |
| 5a | CI pipeline step order (build before typecheck) | Pass | Confirmed in `.github/workflows/oxygen-deployment-1000180490.yml`: Codegen → Build → Typecheck → Lint → Test, in that order. |
| 5b | No `secrets` context in step-level `if:` | Pass | The only step-level `if:` conditions reference `steps.*.outputs` or `github.event.*`/`github.ref_name`, never `secrets.*` directly. |
| 5c | `--legacy-peer-deps` on all `npm ci` calls | Pass | Present in all three jobs (`quality`, `deploy`, `e2e`). |
| 5d | Governance/validator scripts wired into CI, not orphaned | Pass | `scripts/validate-storefront-token.mjs` → `quality` + `e2e` jobs. `scripts/validate-release-env.mjs` → `deploy` job (main only). `scripts/validate-pr-governance.mjs` → separate `.github/workflows/pr-governance.yml` (`Branch Topology` check). All three have co-located passing tests. |

## Summary
2 real, fixed gaps (both low-risk, non-breaking): 2 high-severity npm advisories resolved via lockfile-only `npm audit fix`, and one missing `.env.example` placeholder (`SHOP_ID`) added. Everything else in Phase 1 passed as-is. No CLAUDE.md hard-constraint violations found. Full verification gate (`build && typecheck && lint && test`, plus a from-scratch `npm ci --legacy-peer-deps`) green throughout.

Next: Phase 2 — library layer (`app/lib/`, 14 implementation files / 7 tested).
