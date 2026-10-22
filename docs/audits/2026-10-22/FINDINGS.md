# Findings register — 2026-10-22

Baseline: `dev` at `51ec8619233d78c7ee503c205f72627ba1444dea`. Source properties are confirmed at that revision; production symptoms need their own evidence.

Evidence labels: **C** = directly observed code/config property; **L** = corroborated public live HTML; **H** = code-backed risk requiring a focused reproduction; **E** = reproduced environment result with its stated limits. A C finding is not a claim that a live exploit or outage was reproduced. P0 = repair safety/quality/revenue correctness gates first; P1 = major functional/integration reliability; P2 = remaining consistency/UX/maintainability. No finding is closed by documentation alone.

See [execution plan](../../HEADLESS_RECOVERY_PLAN.md), [verification](VERIFICATION.md), and [complete file inventory](FILE_REVIEW.md).

## Prioritized register

| ID | Priority | Evidence | Finding | Execution slice |
|---|---|---|---|---|
| [F01](#f01) | P0 | E | Clean installation is not reproducible in the audit environment | R01 |
| [F02](#f02) | P0 | C | The lint command has no effective application rule set | R02 |
| [F03](#f03) | P0 | C | Both generated GraphQL outputs are empty and do not bind operation types | R03 |
| [F04](#f04) | P0 | C | Cart mutation errors can throw before they reach the customer | R04 |
| [F05](#f05) | P0 | H | Central session commit can overwrite the cart cookie | R05 |
| [F06](#f06) | P0 | C | JSON-LD serialization permits an HTML script closing delimiter | R06 |
| [F07](#f07) | P0 | C | Shopify and CMS HTML is rendered without a shared trust boundary | R06 |
| [F08](#f08) | P0 | L | Free shipping claims conflict with the published shipping policy | R07 |
| [F09](#f09) | P0 | L | Duties and processing text has multiple contradictory authorities | R07 |
| [F10](#f10) | P0 | H | Klaviyo subscription payload needs provider-contract verification | R08 |
| [F11](#f11) | P0 | C | Back-in-stock promise is not backed by a variant subscription contract | R08 |
| [F50](#f50) | P0 | C | Protected-branch and required-check policy is not enforced in repository settings | R23 |
| [F12](#f12) | P1 | C | Predictive search publicly caches session-dependent market data | R09 |
| [F13](#f13) | P1 | C | Wishlist displays fabricated availability and USD prices from stale snapshots | R10 |
| [F14](#f14) | P1 | C | Wishlist synchronization races and does not isolate account transitions | R10 |
| [F15](#f15) | P1 | C | Wishlist API accepts unvalidated item contents and lacks explicit privacy headers | R10 |
| [F16](#f16) | P1 | C | Checkout locale and document language ignore selected locale | R11 |
| [F17](#f17) | P1 | H | Market change is committed before cart identity success is established | R11 |
| [F18](#f18) | P1 | C | PDP caches commerce-sensitive price and inventory with long stale windows | R12 |
| [F19](#f19) | P1 | C | Variant and image retrieval has silent catalog-size caps | R12 |
| [F20](#f20) | P1 | C | Search sort and filter variables lack schema-aware validation | R13 |
| [F21](#f21) | P1 | C | Predictive search has stale-result and currency-display bugs | R13 |
| [F22](#f22) | P1 | H | Collection pagination reset and mobile filter behavior need contract verification | R13 |
| [F23](#f23) | P1 | C | Root loader makes optional integrations sitewide failure dependencies | R14 |
| [F24](#f24) | P1 | C | Server route errors are not consistently reported and may expose sensitive context | R14 |
| [F25](#f25) | P1 | C | Consent is flattened to one flag and revocation does not stop loaded trackers | R15 |
| [F26](#f26) | P1 | C | Commerce analytics uses raw Hydrogen payloads rather than a tested channel mapping | R15 |
| [F27](#f27) | P1 | C | Rate limiter has fixed cleanup semantics and cannot protect paid chat globally | R16 |
| [F28](#f28) | P1 | C | Chat prompt hardcodes obsolete catalog facts and search is English-only | R16 |
| [F29](#f29) | P1 | C | Account flows are not covered by a successful authenticated integration test | R17 |
| [F31](#f31) | P1 | C | Review attribution fabricates plausible customer names | R18 |
| [F42](#f42) | P1 | C | Green tests miss the failing contracts and coverage cannot currently be measured as planned | R22 |
| [F43](#f43) | P1 | C | E2E and postdeploy smoke accept weak success conditions | R22 |
| [F44](#f44) | P1 | H | CI rebuilds after verification and validates a different environment source than Oxygen runtime | R23 |
| [F47](#f47) | P1 | C | Product-card sale comparison still permits mismatched variant prices on search and wishlist | R12 |
| [F30](#f30) | P2 | C | Account lists silently truncate and private SEO metadata is inconsistent | R17 |
| [F32](#f32) | P2 | C | Review aggregates can describe a truncated or timing-dependent subset | R18 |
| [F33](#f33) | P2 | C | Canonical origins, policy aliases, blog/menu handles and social links are duplicated | R19 |
| [F34](#f34) | P2 | C | Policy routing can show stale custom content or soft-success placeholders | R19 |
| [F35](#f35) | P2 | C | SEO includes unsafe URL transforms and a missing fallback logo asset | R19 |
| [F36](#f36) | P2 | C | Root/account/collection controls violate common interactive semantics | R20 |
| [F37](#f37) | P2 | C | Overlay focus traps can restart on every render and conflict with one another | R20 |
| [F38](#f38) | P2 | C | Dark theme still contains low-contrast light-theme remnants | R21 |
| [F39](#f39) | P2 | H | Reveal animation and dormant sections can hide or hydrate content incorrectly | R21 |
| [F40](#f40) | P2 | C | Campaign assets and product copy remain deployment-bound | R21 |
| [F41](#f41) | P2 | C | Browser persistence trusts malformed and oversized saved data | R10 |
| [F45](#f45) | P2 | C | Operational instructions contradict each other and current implementation | R24 |
| [F46](#f46) | P2 | C | Security and request contracts need consistent method/body/cache boundaries | R06 |
| [F48](#f48) | P2 | C | Dynamic Tailwind class construction is not a reliable generated-style contract | R21 |
| [F49](#f49) | P2 | H | Advertised discount availability is broader than demonstrated shopper eligibility | R07 |

<a id="f01"></a>

## F01 — Clean installation is not reproducible in the audit environment

**P0 · E · R01**

Evidence: [`package-lock.json:4256`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/package-lock.json#L4256), [`package.json:70`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/package.json#L70)

**Observed:** `npm ci --legacy-peer-deps --ignore-scripts --fetch-retries=0 --fetch-timeout=15000` fails with EUSAGE and missing platform packages (Tailwind oxide, TypeScript native targets, fsevents, workerd). Host is Node 24.19.0/npm 11.9.0; CI uses Node 22 and its current run passes. This proves a portability failure, not a reproduced Node 22 CI failure.

**Adjustment:** Reproduce with the exact CI Node/npm versions and a supported contributor platform. Regenerate the lock through npm on a clean checkout if necessary; pin/document the supported toolchain. Never hand-edit the lock or bypass npm ci.

**Acceptance:** Clean install passes on Node 22 CI and documented contributor platforms; package/lock remain unchanged by a second install; audit/peer reports attached.

<a id="f02"></a>

## F02 — The lint command has no effective application rule set

**P0 · C · R02**

Evidence: [`eslint.config.js:4`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/eslint.config.js#L4), [`package.json:8`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/package.json#L8)

**Observed:** `eslint.config.js` contains only an ignore entry: no TS/TSX parser, file matcher, React/hooks/accessibility rules, or recommended JS rules. A green `eslint .` does not demonstrate application lint coverage.

**Adjustment:** Configure supported ESLint/TypeScript/React/hooks/a11y rules; inventory and repair real violations in small slices. Keep tooling scripts separately configured. Do not add blanket disables to obtain green.

**Acceptance:** eslint --print-config on a TSX route shows parser/rules; a temporary hook violation and undefined JS identifier fail lint; removed probes restore green.

<a id="f03"></a>

## F03 — Both generated GraphQL outputs are empty and do not bind operation types

**P0 · C · R03**

Evidence: [`.graphqlrc.ts:18`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/.graphqlrc.ts#L18), [`storefrontapi.generated.d.ts:1`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/storefrontapi.generated.d.ts#L1), [`customeraccountapi.generated.d.ts:1`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/customeraccountapi.generated.d.ts#L1)

**Observed:** Both files contain only empty query/mutation interfaces. The config directly lists a plugin, and the drift check compares these stubs. Query discovery/preset/module augmentation must be diagnosed. Schemas are local package JSON files; the old plan incorrectly treats live secrets as an inherent requirement for generation.

**Adjustment:** Use the installed Hydrogen codegen documentation and correct preset/pluck configuration. Separate Storefront and Customer Account projects and explicitly validate the optional Admin discount query against its own schema. Do not guess schema fields or remove validation.

**Acceptance:** Nonempty generated operation/result/variable types and client augmentation; changing an operation without regeneration fails drift; invalid query fails validation; PDP/collection/cart use generated contracts without unchecked assertions.

<a id="f04"></a>

## F04 — Cart mutation errors can throw before they reach the customer

**P0 · C · R04**

Evidence: [`app/routes/cart.tsx:50`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/cart.tsx#L50), [`app/routes/products.$handle.tsx:225`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/products.%24handle.tsx#L225)

**Observed:** Both actions dereference result.cart.id without guarding null cart/error responses. The PDP-specific action returns an empty 200 and discards user errors/warnings. Cart form decoding and submitted arrays are trusted casts.

**Adjustment:** One validated cart mutation contract: guard malformed input, missing cart, expired ID, upstream/user errors, and warnings; set cart cookie only for a returned cart; preserve safe structured errors. Reuse it from both actions or remove the redundant path after call-site proof.

**Acceptance:** Malformed CartForm, null cart, sold-out, quantity rejection, provider failure, missing/expired cart, and successful add/update/remove/discount cases produce controlled responses; no false success.

<a id="f05"></a>

## F05 — Central session commit can overwrite the cart cookie

**P0 · H · R05**

Evidence: [`server.ts:38`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/server.ts#L38), [`app/lib/session.ts:91`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/session.ts#L91), [`app/routes/cart.tsx:50`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/cart.tsx#L50)

**Observed:** server.ts replaces Set-Cookie when a session is pending, whereas cart actions can already return a separate cart cookie. A request that changes both may lose cart persistence. The market action also commits explicitly and leaves isPending true. Redirect handling must preserve both cookies.

**Adjustment:** Reproduce concurrent pending session plus cart mutation and OAuth callbacks. Compose multiple Set-Cookie headers through the supported Hydrogen/session contract, commit once per lifecycle, and preserve headers through redirects.

**Acceptance:** Browser/request tests show cart and session cookies both survive add, market switch, OAuth authorize/logout and 404 redirect; repeat navigation retains cart.

<a id="f06"></a>

## F06 — JSON-LD serialization permits an HTML script closing delimiter

**P0 · C · R06**

Evidence: [`app/components/ui/JsonLd.tsx:10`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/JsonLd.tsx#L10)

**Observed:** JSON.stringify does not escape `<`; API-derived titles/descriptions can contain a closing script delimiter inside an application/ld+json element. That is an unsafe serialization sink. No live exploit was attempted.

**Adjustment:** Use a script-context-safe JSON serializer (at minimum escape `<` as a JSON Unicode escape) and keep JSON-LD separate from rich HTML sanitation.

**Acceptance:** SSR fixtures containing closing script tags and Unicode edge cases remain one inert JSON-LD script, parse as the original JSON, and create no executable nodes.

<a id="f07"></a>

## F07 — Shopify and CMS HTML is rendered without a shared trust boundary

**P0 · C · R06**

Evidence: [`app/components/sections/ContentBlocks.tsx:62`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/sections/ContentBlocks.tsx#L62), [`app/routes/pages.$handle.tsx:122`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/pages.%24handle.tsx#L122), [`app/routes/policies.$handle.tsx:158`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/policies.%24handle.tsx#L158), [`app/routes/journal.$articleHandle.tsx:184`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/journal.%24articleHandle.tsx#L184), [`app/routes/products.$handle.tsx:959`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/products.%24handle.tsx#L959)

**Observed:** Rich HTML enters multiple raw rendering sinks; CMS JSON is cast after only Array.isArray. CSP permits inline scripts, so it is not a substitute for sanitization. The old requirement for exactly one raw sink incorrectly conflates JSON-LD with content HTML.

**Adjustment:** Establish a tested, parser-based Workers-compatible HTML allowlist and SafeHtml boundary. Validate content block types, URLs, dimensions and required fields before rendering. Preserve necessary product tables/details/images. Do not implement a regex-only sanitizer or strip all merchant styling without comparison.

**Acceptance:** Malicious script/event/SVG/encoded javascript/data URL fixtures are neutralized; normal product descriptions, size tables and policies remain readable; raw sinks limited to audited SafeHtml and safe JsonLd.

<a id="f08"></a>

## F08 — Free shipping claims conflict with the published shipping policy

**P0 · L · R07**

Evidence: [`app/routes/_index.tsx:183`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/_index.tsx#L183), [`app/components/layout/CartDrawer.tsx:359`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/layout/CartDrawer.tsx#L359), [`app/components/sections/StatStrip.tsx:16`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/sections/StatStrip.tsx#L16), [`app/components/ui/TrustSignals.tsx:34`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/TrustSignals.tsx#L34), [`app/locales/en.json:13`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/locales/en.json#L13)

**Observed:** Homepage, announcement, cart drawer, stats, trust signals and all catalogs claim unconditional free shipping. Public shipping policy observed 2026-10-22 lists $5 below $100, free standard at $100+, $12 express. Shared trust comments claim settings-derived shipping, but the shipping string is unconditional.

**Adjustment:** Create one approved commerce-claims source with market/threshold/currency semantics, or use neutral policy-link copy until approved structured facts exist. Remove contradictory claims at every surface and translation. Do not change Shopify shipping settings.

**Acceptance:** All visible claims agree with the approved policy and tested checkout examples below/at/above threshold; discounts and international currencies covered; failure to load facts emits no guarantee.

<a id="f09"></a>

## F09 — Duties and processing text has multiple contradictory authorities

**P0 · L · R07**

Evidence: [`app/locales/en.json:38`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/locales/en.json#L38), [`app/routes/products.$handle.tsx:965`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/products.%24handle.tsx#L965), [`app/routes/policies.$handle.tsx:86`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/policies.%24handle.tsx#L86)

**Observed:** PDP/locale copy says duties are included; public shipping policy says duties/taxes are added at checkout. Policy loader prefers custom Page over native shop policy, while return trust parses shop.refundPolicy. Public processing copy says 1–3 days plus production; owner instruction in this conversation history specifies 2–3 days. Current tax/configuration was not inspected.

**Adjustment:** Build an explicit truth matrix from current public/native policies, owner-approved processing requirement and checkout evidence. Select one authority per fact; surface unresolved contradictions as blocked decisions. Do not infer actual duties settings from copy or autonomously edit admin policies/settings.

**Acceptance:** Approved shipping/duties/tax/processing/returns statements agree across policies, PDP, trust, locales and schema; disagreements are resolved with evidence before guarantees return.

<a id="f10"></a>

## F10 — Klaviyo subscription payload needs provider-contract verification

**P0 · H · R08**

Evidence: [`app/lib/klaviyo.ts:52`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/klaviyo.ts#L52), [`app/lib/klaviyo.test.ts:34`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/klaviyo.test.ts#L34)

**Observed:** The helper places profiles in top-level included and puts only custom_source in job attributes. No real provider validation is present; current tests mock 202 and assert this same structure. Verify required profiles nesting against the explicitly pinned 2024-02-15 schema before treating subscriptions as functional. This payload existed before and was preserved by PR #364; its new tests did not establish provider validity.

**Adjustment:** Validate the precise request against the revision-specific official schema. Implement that contract, distinguish accepted job from confirmed subscription/double opt-in, and verify with an owner-controlled test address. No bulk sending or customer-data export.

**Acceptance:** Schema-based request test rejects the old shape if invalid; controlled signup appears in intended list with correct consent/confirmation state; 4xx/429/timeouts never show success.

<a id="f11"></a>

## F11 — Back-in-stock promise is not backed by a variant subscription contract

**P0 · C · R08**

Evidence: [`app/components/ui/WaitlistForm.tsx:69`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/WaitlistForm.tsx#L69), [`app/routes/api.waitlist.ts:57`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/api.waitlist.ts#L57), [`app/lib/klaviyo.ts:37`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/klaviyo.ts#L37)

**Observed:** The UI promises only item-specific restock email, but the route subscribes to email marketing and stores one product/variant pair as profile properties. Later requests can overwrite that pair. No variant-restock subscription API or trigger contract exists in this repo; an external flow was not inspected.

**Adjustment:** Separate marketing signup consent from restock requests. Verify configured provider catalog/flow and choose a durable per-profile/per-variant model or official back-in-stock API. Validate variant ownership server-side; use accurate copy until delivery is proven.

**Acceptance:** One controlled address can request two variants independently; intended restock trigger targets only subscribed variant; no unrelated marketing opt-in; acceptance and delivery states match UI.

<a id="f12"></a>

## F12 — Predictive search publicly caches session-dependent market data

**P1 · C · R09**

Evidence: [`app/routes/api.search.ts:89`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/api.search.ts#L89), [`app/routes/api.search.ts:62`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/api.search.ts#L62)

**Observed:** Same URL responds with country/language-sensitive data from session context but advertises public cacheability without a market cache key. Even error responses receive that header. CDN behavior needs runtime confirmation; the response contract itself is unsafe for shared caching.

**Adjustment:** Make personalized resource responses private/no-store or encode verified market dimensions in cache key and URL; errors no-store. Audit all document/data responses, not only this endpoint. Internal Storefront query caching is a separate layer.

**Acceptance:** Two isolated cookie sessions requesting the same q in different markets never share currency/language or cache error bodies; inspect deployed Cache-Control/Vary/cache keys.

<a id="f13"></a>

## F13 — Wishlist displays fabricated availability and USD prices from stale snapshots

**P1 · C · R10**

Evidence: [`app/routes/wishlist.tsx:111`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/wishlist.tsx#L111), [`app/routes/wishlist.tsx:118`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/wishlist.tsx#L118)

**Observed:** Wishlist reconstructs ProductCard data from local snapshots and forces USD and availableForSale true, bypassing live market pricing, availability, compare-at and review data.

**Adjustment:** Persist product/variant identity and fetch current published products in the active market; render unavailable/deleted items honestly. Use the common product-card fragment/adapter across search and wishlist.

**Acceptance:** Switch market and update/sell out/unpublish a fixture: wishlist shows correct current price/currency/status; no saved stale price is presented as current commerce data.

<a id="f14"></a>

## F14 — Wishlist synchronization races and does not isolate account transitions

**P1 · C · R10**

Evidence: [`app/components/ui/Wishlist.tsx:102`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/Wishlist.tsx#L102), [`app/components/ui/Wishlist.tsx:119`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/Wishlist.tsx#L119), [`app/components/ui/Wishlist.tsx:150`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/Wishlist.tsx#L150)

**Observed:** POST sync can run before initial server merge; cancelled is never checked after await; initial-fetch flag is never reset on logout; local storage is not scoped by account; sync ignores non-2xx. Comments promise logout clearing but no clearing effect exists.

**Adjustment:** Define explicit guest/loading/merged/dirty/syncing/error states. Wait for read/merge before writes; cancel stale reads; reset on identity changes; reconcile cross-tab changes and conflicts; keep retryable failures visible without deleting local data.

**Acceptance:** Slow GET + immediate edit, StrictMode, failed read/write, logout/login to another synthetic account and two tabs do not lose or cross-copy lists.

<a id="f15"></a>

## F15 — Wishlist API accepts unvalidated item contents and lacks explicit privacy headers

**P1 · C · R10**

Evidence: [`app/routes/api.wishlist.ts:126`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/api.wishlist.ts#L126), [`app/routes/api.wishlist.ts:95`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/api.wishlist.ts#L95)

**Observed:** POST validates only array shape then slices 100 items; individual lengths/types/URLs and byte size are unchecked. GET filters only presence of handle/id. Customer responses do not explicitly state no-store; provider errors can be returned verbatim.

**Adjustment:** Validate shared identity-only schema, size and supported method; private no-store for account/wishlist responses; sanitize provider errors. Validate required Customer Account metafield permissions using synthetic data only.

**Acceptance:** Malformed and oversized records produce bounded 400/413/405; no arbitrary URL/markup survives; auth failures do not leak state; all customer responses and errors are no-store.

<a id="f16"></a>

## F16 — Checkout locale and document language ignore selected locale

**P1 · C · R11**

Evidence: [`app/lib/cart.ts:64`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/cart.ts#L64), [`app/root.tsx:293`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/root.tsx#L293), [`app/lib/i18n.tsx:16`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/i18n.tsx#L16)

**Observed:** Market selector persists a language, yet checkout URLs always add locale=en and the document language stays en. Much of footer/cart/account/forms and errors is untranslated; date/money formatting also uses en-US.

**Adjustment:** Thread validated active language through document metadata, UI catalogs, formatter and checkout URL helper. Keep honest fallback for unsupported catalogs; do not equate Shopify-published languages with full UI translation.

**Acceptance:** EN/FR/DE/PT-BR flows have matching html lang, UI, product data and checkout locale; refresh, navigation and account pages retain selection; missing keys/placeholder failures block CI.

<a id="f17"></a>

## F17 — Market change is committed before cart identity success is established

**P1 · H · R11**

Evidence: [`app/routes/api.market.ts:48`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/api.market.ts#L48), [`app/routes/api.market.ts:57`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/api.market.ts#L57), [`app/lib/context.ts:87`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/context.ts#L87)

**Observed:** Session country/language are set before updateBuyerIdentity; errors/warnings and possibly rotated cart ID are not handled. Existing session/edge country is validated as a region but not against current availableCountries on context creation.

**Adjustment:** Define atomic success/partial-failure behavior, validate current supported market, reconcile cart currency after reload, persist returned ID where required, and bound malformed form/provider errors. Do not change Markets configuration.

**Acceptance:** Existing cart switching countries either updates both session/cart successfully or reports and preserves a consistent prior state; removed markets and unsupported locales fall back explicitly.

<a id="f18"></a>

## F18 — PDP caches commerce-sensitive price and inventory with long stale windows

**P1 · C · R12**

Evidence: [`app/routes/products.$handle.tsx:239`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/products.%24handle.tsx#L239), [`app/lib/cache.ts:30`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/cache.ts#L30), [`app/routes/products.$handle.tsx:550`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/products.%24handle.tsx#L550)

**Observed:** Combined PDP query includes price, availableForSale and quantityAvailable under one-hour fresh/24-hour SWR/seven-day stale-if-error strategy. Low-stock and sale claims can disagree with cart. A coarse low-stock label does not remove stale-data risk.

**Adjustment:** Split stable editorial content from fresh variant commerce data or use a bounded short strategy with explicit invalidation. Keep Shopify mutation validation authoritative and remove stale urgency guarantees.

**Acceptance:** Restock, sellout and price-change fixtures converge within an agreed measured freshness budget; cart rejection explains changes; no obsolete low-stock or sale claim persists through a simulated outage.

<a id="f19"></a>

## F19 — Variant and image retrieval has silent catalog-size caps

**P1 · C · R12**

Evidence: [`app/routes/products.$handle.tsx:178`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/products.%24handle.tsx#L178), [`app/routes/api.quick-add.ts:23`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/api.quick-add.ts#L23), [`app/routes/products.$handle.tsx:153`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/products.%24handle.tsx#L153)

**Observed:** PDP and quick-add only read the first 100 variants without pageInfo; later options/variants can be unavailable in client selection despite being purchasable. Gallery displays a selected image outside the first ten but does not provide the full image set.

**Adjustment:** Use installed Hydrogen supported selected/adjacent/encoded variant patterns or bounded pagination; distinguish intentional gallery cap from silently missing selectable variants. Avoid downloading all variants without budget.

**Acceptance:** A synthetic product with >100 variants can select and buy a late variant in PDP and quick-add; selected price/image/options agree; gallery and payload remain within measured budgets.

<a id="f20"></a>

## F20 — Search sort and filter variables lack schema-aware validation

**P1 · C · R13**

Evidence: [`app/routes/search.tsx:174`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/search.tsx#L174), [`app/routes/search.tsx:119`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/search.tsx#L119), [`app/routes/collections.$handle.tsx:146`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/collections.%24handle.tsx#L146)

**Observed:** Search forwards arbitrary sort directly to SearchSortKeys and exposes TITLE/CREATED_AT/BEST_SELLING choices whose validity must be checked against the installed Storefront schema. Price inputs allow NaN/Infinity/negative/inverted ranges. Mixed search node types are cast as Product without __typename narrowing.

**Adjustment:** Generate enum/input types, whitelist supported sorts, parse bounded finite ranges, filter supported node types or request products only, and return friendly invalid-query behavior. Use provider facet input rather than labels consistently.

**Acceptance:** Every displayed sort is accepted by installed schema; malicious/invalid URL params return controlled results; mixed article/page/product results do not crash ProductCard; locale facet round-trip tested.

<a id="f21"></a>

## F21 — Predictive search has stale-result and currency-display bugs

**P1 · C · R13**

Evidence: [`app/components/ui/SearchTypeahead.tsx:74`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/SearchTypeahead.tsx#L74), [`app/components/ui/SearchTypeahead.tsx:268`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/SearchTypeahead.tsx#L268), [`app/components/ui/SearchTypeahead.tsx:43`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/SearchTypeahead.tsx#L43)

**Observed:** Requests are debounced but not aborted or sequence-guarded, so older results may overwrite newer input or reappear after clear/close. Display prefixes a dollar sign regardless of API currency; IDs are fixed across possible instances.

**Adjustment:** Abort/ignore stale responses; clear pending/loading/results coherently; render Money using API currency and active locale; per-instance IDs and keyboard focus contract.

**Acceptance:** Delayed old request never replaces new query; clear/close/unmount remain closed; non-USD prices render correctly; duplicate instances have unique ARIA relationships.

<a id="f22"></a>

## F22 — Collection pagination reset and mobile filter behavior need contract verification

**P1 · H · R13**

Evidence: [`app/routes/collections.$handle.tsx:213`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/collections.%24handle.tsx#L213), [`app/routes/collections.$handle.tsx:207`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/collections.%24handle.tsx#L207), [`app/routes/collections.$handle.tsx:340`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/collections.%24handle.tsx#L340)

**Observed:** Collection code removes cursor on sort/filter, while getPaginationVariables/Pagination owns its cursor/direction naming; verify exact installed contract. Collection facets submit labels instead of canonical input. Mobile drawer lacks shared focus/scroll behavior used by search.

**Adjustment:** Reset every installed pagination dimension on filter/sort, consume canonical facet inputs, and share an accessible filter drawer. Verify previous/next and browser Back rather than assuming a specific cursor name.

**Acceptance:** Change filters on page two and return to page one; forward/back sort stays correct; translated facets match; mobile drawer traps/restores focus and scroll with keyboard/touch.

<a id="f23"></a>

## F23 — Root loader makes optional integrations sitewide failure dependencies

**P1 · C · R14**

Evidence: [`app/root.tsx:123`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/root.tsx#L123), [`app/root.tsx:187`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/root.tsx#L187), [`app/root.tsx:251`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/root.tsx#L251)

**Observed:** Root awaits cart, localization, analytics shop lookup and menu as one rejecting Promise.all; account checks precede these. Follow-up nav node resolution is awaited unguarded and all published-collection pages are awaited. Only trust and discounts have explicit isolation/budgets.

**Adjustment:** Classify root dependencies critical/optional; retain essential localization correctness while providing bounded nav/cart/auth/analytics degradation. Stream optional enrichments; ensure failures are observable. Do not cache personalized root data publicly.

**Acceptance:** Inject timeout/rejection/null for each optional dependency: catalog/PDP shell still renders with honest fallbacks and retry; auth data never falls through as another customer; measure cold/warm TTFB.

<a id="f24"></a>

## F24 — Server route errors are not consistently reported and may expose sensitive context

**P1 · C · R14**

Evidence: [`app/entry.server.tsx:17`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/entry.server.tsx#L17), [`server.ts:6`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/server.ts#L6), [`app/lib/monitoring.ts:94`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/monitoring.ts#L94), [`app/lib/sentry.server.ts:110`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/sentry.server.ts#L110)

**Observed:** Most route logging uses console; monitoring.captureError routes server calls only to console, not server Sentry. server.ts outer catch does not see all React Router-handled loader failures. Manual Sentry captures raw URL/query and fixed production/release, initializes DSN once and has no send timeout. OAuth URL parameters require redaction.

**Adjustment:** Use one server error pipeline with entry handleError and waitUntil, safe URL/error/context redaction, real release/environment identity and bounded delivery; keep client module distinct. Avoid double reporting and render-time telemetry side effects.

**Acceptance:** A handled loader exception and pre-context failure each produce one redacted preview-tagged event; OAuth tokens/email/query secrets absent; missing/broken Sentry never breaks response.

<a id="f25"></a>

## F25 — Consent is flattened to one flag and revocation does not stop loaded trackers

**P1 · C · R15**

Evidence: [`app/components/seo/Analytics.tsx:254`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/seo/Analytics.tsx#L254), [`app/components/seo/Analytics.tsx:296`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/seo/Analytics.tsx#L296), [`app/components/seo/Analytics.tsx:193`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/seo/Analytics.tsx#L193)

**Observed:** Persisted accepted/rejected is derived only from analytics and used to load GA4, Meta, TikTok and Klaviyo together; marketing/preferences choices are not independent. A later Shopify rejection updates storage but does not disable loaded SDKs. No explicit preference-reopen control is wired in this component.

**Adjustment:** Model provider consent categories and readiness explicitly; reconcile without granting unchosen categories; implement supported disable/revocation and preferences access; validate tracking in preview using test IDs. This is a code behavior finding, not a legal compliance conclusion.

**Acceptance:** No pre-choice or rejected-category requests; analytics-only does not enable marketing; external revocation stops applicable future events; saved consent and unavailable storage behave deterministically.

<a id="f26"></a>

## F26 — Commerce analytics uses raw Hydrogen payloads rather than a tested channel mapping

**P1 · C · R15**

Evidence: [`app/components/seo/Analytics.tsx:136`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/seo/Analytics.tsx#L136), [`app/components/seo/Analytics.tsx:205`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/seo/Analytics.tsx#L205), [`app/lib/analytics-environment.ts:63`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/analytics-environment.ts#L63)

**Observed:** GA4 bridge emits cart/item objects without an explicit GA4 ecommerce item/currency/value adapter. Meta/TikTok snippets only initialize/page-view; no equivalent commerce-event bridge is implemented. Preview suppression controls Shopify shop only; third-party IDs are still returned. Host policy assumes any unrecognized nonlocal host is live.

**Adjustment:** Define event schemas per channel, explicit production allowlist/test environment, consent-aware subscription lifecycle and dedupe. Verify Shopify/GA4/Meta/TikTok independently; purchase must come from verified checkout-side integration rather than inventing it in this repo.

**Acceptance:** Synthetic view/add/remove/cart/checkout produce one correctly shaped event per enabled test channel; preview never hits production IDs; purchase ownership documented and verified separately without placing an order.

<a id="f27"></a>

## F27 — Rate limiter has fixed cleanup semantics and cannot protect paid chat globally

**P1 · C · R16**

Evidence: [`app/lib/rate-limit.ts:16`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/rate-limit.ts#L16), [`app/lib/rate-limit.ts:30`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/rate-limit.ts#L30), [`app/routes/api.chat.ts:98`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/api.chat.ts#L98)

**Observed:** Per-isolate Map resets across isolates; cleanup always uses 60 seconds even for caller windowMs >60 seconds; user-agent fallback is a substring, not the hash the comment describes. Best-effort headers and memory growth need bounded policy. App limits are duplicated call-site literals.

**Adjustment:** Centralize named route policies, correct per-entry expiration and bounded storage. Owner chooses available shared edge/store control and provider spend cap; retain a tested local layer. Do not claim shared enforcement from unit tests or provision a paid binding without authorization.

**Acceptance:** Nondefault-window fake-clock test survives cleanup; trusted-proxy assumptions documented; deployed multi-isolate limit or provider cap has owner evidence; no bypass via missing/spoofed identity.

<a id="f28"></a>

## F28 — Chat prompt hardcodes obsolete catalog facts and search is English-only

**P1 · C · R16**

Evidence: [`app/routes/api.chat.ts:87`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/api.chat.ts#L87), [`app/routes/api.chat.ts:44`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/api.chat.ts#L44), [`app/routes/api.chat.ts:59`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/api.chat.ts#L59)

**Observed:** Prompt fixes price range and collection names while live homepage shows lower prices and different collections; English-only keyword normalization strips non-Latin terms. Client widget is always shown even when provider is unavailable. Provider body errors are logged verbatim.

**Adjustment:** Ground approved store facts in current context, preserve Unicode, externalize reviewed model/budget policy and feature readiness, sanitize logging; add request total deadline/body/token budget and safe failure copy.

**Acceptance:** Price/collection changes require no prompt edit; accented/non-Latin search works within defined scope; unset provider hides or accurately disables feature; rate/timeout/injection fixtures cannot fabricate transactional facts.

<a id="f29"></a>

## F29 — Account flows are not covered by a successful authenticated integration test

**P1 · C · R17**

Evidence: [`e2e/golden-journeys.spec.ts:105`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/e2e/golden-journeys.spec.ts#L105), [`app/routes/account._index.tsx:50`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/account._index.tsx#L50), [`app/routes/account.addresses.tsx:295`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/account.addresses.tsx#L295)

**Observed:** CI deliberately considers login failure the expected scenario because auth is not configured. Account loaders/mutations cast successful data without general null/error guards. Address selection reverses localized country names to a fixed list and silently defaults US; zoneCode input uses a free-text province label. These paths need synthetic-account proof.

**Adjustment:** Separate expected-unconfigured test from successful OAuth/auth scenarios. Validate Customer Account schema, scopes, session payload size and callback settings without exposing credentials; country codes must be authoritative and province fields country-aware.

**Acceptance:** Approved synthetic-account login/callback/profile/address CRUD/logout, expired sessions, API errors, Unicode names and international addresses pass; no live customer records inspected/exported.

<a id="f30"></a>

## F30 — Account lists silently truncate and private SEO metadata is inconsistent

**P2 · C · R17**

Evidence: [`app/routes/account.orders.tsx:102`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/account.orders.tsx#L102), [`app/routes/account.addresses.tsx:40`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/account.addresses.tsx#L40), [`app/routes/account.tsx:4`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/account.tsx#L4)

**Observed:** Orders queries pageInfo but has no pagination UI; addresses are first ten only. Account children define meta that may replace parent noindex rather than merge. Account/cart responses lack a common explicit no-store/noindex contract.

**Adjustment:** Implement paginated account lists or disclose bounded behavior, explicit private-route headers/meta composition, and safe empty/error states. Do not derive public canonicals for private customer content as a substitute for noindex.

**Acceptance:** Synthetic account with >10 orders/addresses can access all permitted entries; final rendered private-route robots/header contracts checked, including errors.

<a id="f31"></a>

## F31 — Review attribution fabricates plausible customer names

**P1 · C · R18**

Evidence: [`app/lib/judgeme.ts:90`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/judgeme.ts#L90), [`app/lib/judgeme.ts:120`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/judgeme.ts#L120)

**Observed:** Missing/single-token reviewer names are replaced by deterministic invented personal names. This contradicts components/docs claiming real or merely masked names. The review text can be genuine while attribution is still false.

**Adjustment:** Use an honest neutral anonymous label or provider-approved masked identity; do not replace real single-token identity with a different person. Document quote selection and authenticity policy.

**Acceptance:** Missing/single/CJK/Unicode name fixtures never invent identities; visible attributions and privacy transformations are truthful and consistent.

<a id="f32"></a>

## F32 — Review aggregates can describe a truncated or timing-dependent subset

**P2 · C · R18**

Evidence: [`app/lib/judgeme.ts:373`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/judgeme.ts#L373), [`app/lib/judgeme.ts:39`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/judgeme.ts#L39), [`app/routes/products.$handle.tsx:261`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/products.%24handle.tsx#L261)

**Observed:** Public review fetch caps pages; summary count/average is recomputed from returned text-bearing reviews and may replace all-review badge totals. Initial review budget determines which source wins. Homepage aggregate is just four selected rated products, not necessarily storewide. Fetch cache options are cast, without an observed Oxygen cache-hit test.

**Adjustment:** Distinguish provider total aggregate from displayed/paginated reviews and label selected quotes honestly; expose truncation; validate ratings 0–5/count and provider response shape; use supported cache wrapper with measured hits.

**Acceptance:** Many-page/missing-page/empty-body/out-of-range fixtures preserve correct aggregate; fast and slow initial render agree on semantics; optional reviews do not delay commerce or fan out unbounded requests.

<a id="f33"></a>

## F33 — Canonical origins, policy aliases, blog/menu handles and social links are duplicated

**P2 · C · R19**

Evidence: [`app/components/seo/SeoSchema.tsx:15`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/seo/SeoSchema.tsx#L15), [`app/routes/[sitemap.xml].tsx:73`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/[sitemap.xml].tsx#L73), [`app/routes/journal._index.tsx:63`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/journal._index.tsx#L63), [`app/components/layout/Footer.tsx:44`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/layout/Footer.tsx#L44)

**Observed:** 29 production-origin literals exist in non-test app source; robots/sitemap derive another origin from checkout-domain env and force www. Handles, contact/social URLs and claim copy have multiple authorities. Not every stable route/protocol literal should become an env variable.

**Adjustment:** Separate canonical public storefront origin from checkout domain, centralize named route/content contracts, source merchant-managed values through a validated configuration/metafield/menu adapter, and preserve intentional security allowlists.

**Acceptance:** One origin config drives canonical/OG/JSON-LD/sitemap/robots; preview points canonical to approved live origin but is noindex; invalid/missing config cannot emit malformed or untrusted URLs.

<a id="f34"></a>

## F34 — Policy routing can show stale custom content or soft-success placeholders

**P2 · C · R19**

Evidence: [`app/routes/policies.$handle.tsx:90`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/policies.%24handle.tsx#L90), [`app/routes/policies.$handle.tsx:108`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/policies.%24handle.tsx#L108), [`app/routes/pages.$handle.tsx:47`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/pages.%24handle.tsx#L47)

**Observed:** Known policy handles can return 200 with unavailable content; custom Page overrides native policy; /pages equivalents stay directly reachable and self-canonicalize even when excluded from sitemap. Policy ownership needs one explicit rule.

**Adjustment:** Define canonical route/authority for each policy/page alias, intentional contact rendering and missing critical-policy behavior; redirect duplicate aliases without touching Shopify Admin redirects until approved.

**Acceptance:** Every footer/help/legal link resolves to intended content; missing required policy fails an acceptance gate; duplicate paths redirect or canonicalize coherently; existing external links preserve compatibility.

<a id="f35"></a>

## F35 — SEO includes unsafe URL transforms and a missing fallback logo asset

**P2 · C · R19**

Evidence: [`app/components/seo/SeoSchema.tsx:18`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/seo/SeoSchema.tsx#L18), [`app/routes/products.$handle.tsx:205`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/products.%24handle.tsx#L205), [`app/routes/[sitemap.xml].tsx:27`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/[sitemap.xml].tsx#L27)

**Observed:** Organization fallback points to favicon.ico, absent from tracked assets; OG image transforms append & regardless of existing query string. Sitemap uses publishedAt as article updatedAt and emits every known policy handle regardless of usable content. Product return eligibility is inferred from all available market countries.

**Adjustment:** Use URL-aware CDN transforms, a real supported logo, accurate modified timestamps and truthful return-region policy; validate schema and sitemap against actual routes. Do not invent identifiers or merchant guarantees to silence validators.

**Acceptance:** Asset links resolve; queryless/queryful image fixtures yield valid URLs; sitemap has only canonical available pages and truthful dates; schema agrees with visible active-market product data.

<a id="f36"></a>

## F36 — Root/account/collection controls violate common interactive semantics

**P2 · C · R20**

Evidence: [`app/routes/account._index.tsx:76`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/account._index.tsx#L76), [`app/routes/collections.$handle.tsx:421`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/collections.%24handle.tsx#L421), [`app/components/ui/Button.tsx:111`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/Button.tsx#L111)

**Observed:** Account and pagination wrap native buttons in links. Button link/anchor variants set aria-disabled but still navigate, while checkout relies on pointer-events wrappers rather than a complete keyboard disabled contract. Labels in address forms lack htmlFor/input IDs.

**Adjustment:** Use semantic single interactive controls, native form semantics and accessible disabled/loading behavior; associate all labels and announce mutation errors. Preserve checkout modifier/new-tab/back behavior.

**Acceptance:** Axe and keyboard tests cover filled cart, account, collection pagination, dialogs and failure states; no nested interactive controls; disabled controls cannot activate with Enter, click or assistive technology.

<a id="f37"></a>

## F37 — Overlay focus traps can restart on every render and conflict with one another

**P2 · C · R20**

Evidence: [`app/hooks/useFocusTrap.ts:82`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/hooks/useFocusTrap.ts#L82), [`app/components/ui/DiscountsPopup.tsx:61`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/DiscountsPopup.tsx#L61), [`app/root.tsx:425`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/root.tsx#L425)

**Observed:** Focus effect depends on callback identity and several callers pass inline callbacks, so re-renders can cleanup/restore/refocus unexpectedly. Initial-focus timeout is not cancelled. Scroll lock is counted but focus traps have no topmost-dialog stack; chat does not share scroll/overlay coordination.

**Adjustment:** Stabilize callback refs, cancel initial timers, manage topmost focus/inert background and restoration, and coordinate cart/menu/quick-add/popup/chat/size/filter overlays.

**Acceptance:** Typing and cart revalidation retain focus; closing nested/topmost overlay restores correct trigger; Escape affects one active dialog; reduced motion, touch and real mobile Safari verified.

<a id="f38"></a>

## F38 — Dark theme still contains low-contrast light-theme remnants

**P2 · C · R21**

Evidence: [`app/components/ui/WaitlistForm.tsx:58`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/WaitlistForm.tsx#L58), [`app/routes/account.orders.tsx:183`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/account.orders.tsx#L183), [`app/root.tsx:454`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/root.tsx#L454), [`app/routes/[site.webmanifest].ts:18`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/[site.webmanifest].ts#L18)

**Observed:** Waitlist button uses near-black text on dark gray; unfulfilled status uses black on dark surface; error boundary/manifest still use old light palette. Duplicate CSS aliases/legacy section variants remain. Static scan found no unresolved CSS variables, so missing variables are not a verified defect.

**Adjustment:** Reconcile one token system and all semantic state variants before visual polish; audit actual computed contrast, not comments or token existence. Keep brand/logo assets unchanged without approval.

**Acceptance:** Computed contrast passes applicable AA in normal/hover/focus/error/disabled states; desktop/mobile screenshots of every route and overlay reviewed; no unintended palette changes.

<a id="f39"></a>

## F39 — Reveal animation and dormant sections can hide or hydrate content incorrectly

**P2 · H · R21**

Evidence: [`app/styles/app.css:552`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/styles/app.css#L552), [`app/hooks/useReveal.ts:12`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/hooks/useReveal.ts#L12), [`app/components/sections/DropTimer.tsx:36`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/sections/DropTimer.tsx#L36)

**Observed:** Reveal CSS hides until class activation; hook assumes IntersectionObserver and has new default options identity each render. Several legacy sections include h-reveal without their own hook. DropTimer initializes from current time on server/client and invalid dates yield NaN. These components may be dormant; inspect reachability before spending on rewrites.

**Adjustment:** Default important content visible, progressively enhance animation, guard unavailable observer/reduced motion, and use deterministic countdown hydration/invalid-date handling. Remove proven unused sections only after owner/design intent review.

**Acceptance:** JS-disabled/observer-unavailable and slow-hydration pages retain essential content; invalid/expired countdown renders safely; active section registry/reachability is documented.

<a id="f40"></a>

## F40 — Campaign assets and product copy remain deployment-bound

**P2 · C · R21**

Evidence: [`app/components/sections/HeroSplit.tsx:16`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/sections/HeroSplit.tsx#L16), [`app/components/ui/Placeholder.tsx:10`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/Placeholder.tsx#L10), [`app/components/sections/StreetHero.tsx:4`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/sections/StreetHero.tsx#L4), [`app/routes/_index.tsx:262`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/_index.tsx#L262)

**Observed:** Hero stores two specific Shopify File URLs in source; homepage repeats GSM/drop cadence/no-restocks claims; placeholders and generic image fallbacks remain in several components. Presence of fallback code does not prove every live page displays placeholders. Raw picture/img is deliberate art direction, not automatically a functional bug.

**Adjustment:** Inventory runtime content and active/dormant image surfaces; move approved campaign content/assets into a validated merchant-owned contract. Keep honest empty/missing image states; do not fabricate imagery or blanket-delete fallback components.

**Acceptance:** Approved hero/content can change without code deployment; no unsupported cadence/spec claims; all critical image paths, alt, dimensions, responsive sizing and CLS checked; blocked assets have explicit owner.

<a id="f41"></a>

## F41 — Browser persistence trusts malformed and oversized saved data

**P2 · C · R10**

Evidence: [`app/components/ui/RecentlyViewed.tsx:74`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/RecentlyViewed.tsx#L74), [`app/components/ui/Wishlist.tsx:59`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/Wishlist.tsx#L59)

**Observed:** Recent cookie JSON may be a nonarray then viewed.filter throws outside the try; URI decoding can throw; full titles/image URLs in eight cookie records can exceed browser cookie limits. Wishlist local items have no schema/version validation and old data is accepted into merge.

**Adjustment:** Validate/version stored schemas, bound bytes, handle corruption and unavailable storage; prefer identity-only browser storage and current API data; assess preference consent separately. Preserve migration and private-origin isolation.

**Acceptance:** Corrupt JSON, object/null/strings, bad percent escapes, huge metadata, expired/versioned data and quota-denied storage never crash or silently overwrite valid lists.

<a id="f42"></a>

## F42 — Green tests miss the failing contracts and coverage cannot currently be measured as planned

**P1 · C · R22**

Evidence: [`vitest.config.ts:8`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/vitest.config.ts#L8), [`app/lib/cart.test.ts:17`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/cart.test.ts#L17), [`app/lib/session.test.ts:19`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/session.test.ts#L19), [`app/__tests__/routes/products.$handle.test.ts:49`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/__tests__/routes/products.%24handle.test.ts#L49)

**Observed:** 35 test files exist, but many tests check object literals/module shape and mock successful upstream responses. No coverage provider is declared in package/lock and no threshold configured. PDP loader tests call the real review helper without mocking fetch. Root, real auth, consent and many failure branches are uncovered; no claim of a measured percentage is justified.

**Adjustment:** Build a behavior matrix and realistic contract fixtures; hermetically mock optional providers; replace implementation-mirroring tests with meaningful error/persistence tests. Add a compatible coverage provider and set floors only from measured post-fix baseline.

**Acceptance:** No unintended outbound unit-test network; each P0/P1 regression has a failing-before/passing-after test; coverage artifact lists included/excluded files and ratchet; all planned routes/components addressed.

<a id="f43"></a>

## F43 — E2E and postdeploy smoke accept weak success conditions

**P1 · C · R22**

Evidence: [`e2e/golden-journeys.spec.ts:49`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/e2e/golden-journeys.spec.ts#L49), [`e2e/storefront-proxy.spec.ts:16`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/e2e/storefront-proxy.spec.ts#L16), [`.github/workflows/oxygen-deployment-1000180490.yml:252`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/.github/workflows/oxygen-deployment-1000180490.yml#L252)

**Observed:** Proxy tests accept arbitrary GraphQL errors at 200; postdeploy only checks status/error-text and PDP discovery, not a semantic shop/product contract. Auth E2E expects failure. Existing commerce test checks checkout URL but never navigates it. Dependabot/fork E2E steps can skip while jobs show success, so job green is not proof tests ran.

**Adjustment:** Assert semantic GraphQL data and no unexpected errors, expected route content markers and exact status classes. Report executed/skipped counts distinctly; trusted verification required for dependency promotion. Verify checkout handoff safely without order/payment changes.

**Acceptance:** Intentionally broken proxy/PDP/content/auth contract fails its correct gate; release evidence records test counts and retries; a successful deployment URL is tested with bypass masked and no customer data exported.

<a id="f44"></a>

## F44 — CI rebuilds after verification and validates a different environment source than Oxygen runtime

**P1 · H · R23**

Evidence: [`.github/workflows/oxygen-deployment-1000180490.yml:153`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/.github/workflows/oxygen-deployment-1000180490.yml#L153), [`scripts/validate-release-env.mjs:1`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/scripts/validate-release-env.mjs#L1), [`.github/workflows/oxygen-deployment-1000180490.yml:137`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/.github/workflows/oxygen-deployment-1000180490.yml#L137)

**Observed:** Quality and E2E build independently; deploy installs/rebuilds via CLI. Production release-env checks GitHub secrets, but runtime vars reside in Oxygen. It does not establish their presence/value parity in the deployed environment. Preview E2E only configures three variables, so integrations/auth/production claims are largely absent.

**Adjustment:** Define artifact/source provenance and reproducible build checks; confirm supported CLI prebuilt path before adopting it. Add safe environment parity/feature-readiness diagnostics without exposing secrets; verify deployed worker after environment changes.

**Acceptance:** Reviewed SHA and artifact/build identity trace through deploy; trusted preview tests exercise required feature configuration; runtime checks report presence/shape only; failures block promotion and identify last healthy deploy.

<a id="f45"></a>

## F45 — Operational instructions contradict each other and current implementation

**P2 · C · R24**

Evidence: [`CLAUDE.md:135`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/CLAUDE.md#L135), [`CLAUDE.md:288`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/CLAUDE.md#L288), [`CLAUDE.md:23`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/CLAUDE.md#L23), [`docs/TPS_REMEDIATION_PLAN.md:51`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/docs/TPS_REMEDIATION_PLAN.md#L51)

**Observed:** CLAUDE says Node 20/nonblocking codegen and light design, while workflow is Node 22/blocking and app is dark. It forbids hardcoded copy but substantial copy exists; Admin discounts contradict architecture boundary. Multiple plans assert completion without reproducible evidence; milestone/commit/approval rules differ. The prior 11-gap TPS plan is incomplete.

**Adjustment:** Use this recovery plan as the execution index; reconcile CLAUDE, governance, architecture, deployment and readiness against shipped behavior/owner policy. Archive historical reports with date/scope labels and links, preserving git history. Do not silently rewrite owner prohibitions.

**Acceptance:** One current command sequence, capability/source contract and release rule; docs index every active document; old plans carry supersession link; statuses require linked evidence.

<a id="f46"></a>

## F46 — Security and request contracts need consistent method/body/cache boundaries

**P2 · C · R06**

Evidence: [`app/lib/security.ts:18`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/security.ts#L18), [`app/lib/security.ts:110`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/security.ts#L110), [`app/routes/api.waitlist.ts:24`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/api.waitlist.ts#L24), [`app/routes/cart.$lines.tsx:11`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/cart.%24lines.tsx#L11)

**Observed:** CSP is broad/static (inline script and ws/wss sources); several actions parse unbounded bodies and malformed forms can throw. Same-origin guard deliberately allows missing Origin, so its guarantees depend on cookie/proxy context. GET cart permalinks intentionally create carts and are vulnerable to crawler/prefetch load if unbounded. No exploit/load test was attempted.

**Adjustment:** Threat-model each surface; explicit method/content type/byte bounds, no-store errors and idempotency/retry behavior where appropriate. Preserve standard cart-permalink semantics; add suitable cost/rate controls. Move CSP toward nonce through supported SSR integration, keeping Shopify consent/checkout compatibility.

**Acceptance:** Malformed/oversized/method/origin/proxy tests produce controlled statuses; policy changes do not break hydration, forms, consent or checkout; private responses never become public by extension or route fallback.

<a id="f47"></a>

## F47 — Product-card sale comparison still permits mismatched variant prices on search and wishlist

**P1 · C · R12**

Evidence: [`app/components/ui/ProductCard.tsx:143`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/ProductCard.tsx#L143), [`app/routes/search.tsx:86`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/search.tsx#L86), [`app/routes/wishlist.tsx:121`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/routes/wishlist.tsx#L121)

**Observed:** salePricePair intentionally falls back to independently minimized priceRange and compareAtPriceRange when variant data is absent. Full search does not fetch the shared selected-variant price pair, and wishlist reconstructs snapshots. A sale percentage can therefore describe no actual variant, despite the same-variant fix on normal cards.

**Adjustment:** Use the shared typed product-card query/adapter for every live card surface, retaining same-variant price/compareAt semantics. If no coherent variant pair exists, omit the sale assertion rather than pairing range minima.

**Acceptance:** A differently priced multivariant fixture yields the same truthful sale badge/price on homepage, collection, search and refreshed wishlist; missing variant data does not invent a discount.

<a id="f48"></a>

## F48 — Dynamic Tailwind class construction is not a reliable generated-style contract

**P2 · C · R21**

Evidence: [`app/components/sections/Lookbook.tsx:80`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/sections/Lookbook.tsx#L80), [`app/components/sections/Lookbook.tsx:123`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/sections/Lookbook.tsx#L123)

**Observed:** Lookbook interpolates col-span classes at runtime, so arbitrary merchant values are not statically discoverable by Tailwind. Its product details are hover-only. This section may be dormant, so no live layout regression is claimed.

**Adjustment:** Use a static enumerated class map or validated gridColumn style with bounded values, and keyboard/touch-accessible product detail behavior. Include any activated section in the build/runtime gallery instead of assuming a successful compile styles all data values.

**Acceptance:** Built CSS/rendered fixtures cover every supported span at mobile/desktop; invalid values fall back predictably; hotspot details work on keyboard/touch and never overflow viewport.

<a id="f49"></a>

## F49 — Advertised discount availability is broader than demonstrated shopper eligibility

**P2 · H · R07**

Evidence: [`app/lib/discounts.ts:97`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/discounts.ts#L97), [`app/lib/discounts.ts:136`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/lib/discounts.ts#L136), [`app/components/ui/DiscountsPopup.tsx:177`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/app/components/ui/DiscountsPopup.tsx#L177)

**Observed:** Active status, all-customer selection and exactly one code do not by themselves establish eligibility for every market/product/subtotal/customer usage state. Query is limited to twenty nodes and unsupported app-managed types are silently omitted. Provider summary may describe conditions, so this is a presentation/coverage risk requiring examples, not proof every shown offer is invalid.

**Adjustment:** Define whether a surface is a qualified general promotion or a cart-eligible offer. Preserve required conditions and market/currency semantics, paginate or disclose intentional limits, and avoid suggesting that omitted/app-managed discounts do not exist. Reconcile approved architecture for Admin read-only access.

**Acceptance:** Market-restricted, minimum-spend, expired, capped, multi-code and app-managed fixtures produce truthful qualified copy; cart remains authority for redemption; API outage shows no fabricated offer.

<a id="f50"></a>

## F50 — Protected-branch and required-check policy is not enforced in repository settings

**P0 · C · R23**

Evidence: [`docs/REPOSITORY_GOVERNANCE.md:15`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/docs/REPOSITORY_GOVERNANCE.md#L15), [`.github/CODEOWNERS:2`](https://github.com/LXGNDRY/legendary-branding-headless/blob/51ec8619233d78c7ee503c205f72627ba1444dea/.github/CODEOWNERS#L2)

**Observed:** Read-only GitHub API checks on 2026-10-22 returned protected:false and required-status enforcement off for both dev and main; repository rulesets list is empty. CODEOWNERS and a Branch Topology workflow alone do not enforce reviews/checks or prohibit direct protected-branch pushes. This is repository-setting evidence, not a source-only inference.

**Adjustment:** Prepare an owner-reviewed ruleset contract for dev/main with required checks, no direct push/force/deletion, appropriate release topology and review policy. Apply only through authorized repository administration access; never weaken it to merge remediation.

**Acceptance:** Read-back shows active intended rules with correct exact check names and justified bypasses; an unauthorized direct push/failed-check merge is rejected in a safe test; allowed claude-to-dev and dev-to-main topology remains documented.
