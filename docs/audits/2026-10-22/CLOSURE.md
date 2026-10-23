# Recovery closure register (2026-10-22 audit)

Every finding, its slice, and what is still needed before it can be called **closed**. "Merged to dev" means the code and tests landed on `dev` behind a green gate; it is **not** proof of live behavior. A finding is closed only when its owed evidence is recorded in the plan's status table.

| Finding | Pri | Slice | Slice state | Owed before closure | Owner |
|---|---|---|---|---|---|
| F01 | P0 | R01 | Merged to dev (#368) | — | None |
| F02 | P0 | R02 | Merged to dev (#368) | — | None |
| F03 | P0 | R03 | Merged to dev (#368) | — | None |
| F04 | P0 | R04 | Merged to dev (#369) | preview cart check | Claude + owner (preview) |
| F05 | P0 | R05 | Merged to dev (#369) | preview cart-cookie check | Claude + owner (preview) |
| F06 | P0 | R06 | Merged to dev (#370) | visual comparison of sanitized content | Claude + owner (preview) |
| F07 | P0 | R06 | Merged to dev (#370) | visual comparison of sanitized content | Claude + owner (preview) |
| F08 | P0 | R07 | Merged to dev (#371) | shipping/duties/returns wording authority; discount eligibility policy (F49) | Business owner |
| F09 | P0 | R07 | Merged to dev (#371) | shipping/duties/returns wording authority; discount eligibility policy (F49) | Business owner |
| F10 | P0 | R08 | Merged to dev (#372) | Klaviyo list/catalog/Back-in-Stock setup + live acceptance | Business owner |
| F11 | P0 | R08 | Merged to dev (#372) | Klaviyo list/catalog/Back-in-Stock setup + live acceptance | Business owner |
| F12 | P1 | R09 | Merged to dev (#373) | deployed header check | Claude + owner (preview) |
| F13 | P1 | R10 | Merged to dev (#374) | synthetic customer account for acceptance | Business owner |
| F14 | P1 | R10 | Merged to dev (#374) | synthetic customer account for acceptance | Business owner |
| F15 | P1 | R10 | Merged to dev (#374) | synthetic customer account for acceptance | Business owner |
| F16 | P1 | R11 | Merged to dev (#376) | translations; browser journeys | Business owner |
| F17 | P1 | R11 | Merged to dev (#376) | translations; browser journeys | Business owner |
| F18 | P1 | R12 | Merged to dev (#377) | preview verification | Claude + owner (preview) |
| F19 | P1 | R12 | Merged to dev (#377) | preview verification | Claude + owner (preview) |
| F20 | P1 | R13 | Merged to dev (#378) | device checks; canonical product-type filter input | Claude + owner (preview) |
| F21 | P1 | R13 | Merged to dev (#378) | device checks; canonical product-type filter input | Claude + owner (preview) |
| F22 | P1 | R13 | Merged to dev (#378) | device checks; canonical product-type filter input | Claude + owner (preview) |
| F23 | P1 | R14 | Merged to dev (#379) | Sentry DSN + preview verification | Business owner |
| F24 | P1 | R14 | Merged to dev (#379) | Sentry DSN + preview verification | Business owner |
| F25 | P1 | R15 | Merged to dev (#380) | test GA4/Meta/TikTok IDs, vendor-debugger and checkout purchase verification | Business owner |
| F26 | P1 | R15 | Merged to dev (#380) | test GA4/Meta/TikTok IDs, vendor-debugger and checkout purchase verification | Business owner |
| F27 | P1 | R16 | Merged to dev (#381) | chat spend cap / shared limit | Business owner |
| F28 | P1 | R16 | Merged to dev (#381) | chat spend cap / shared limit | Business owner |
| F29 | P1 | R17 | Merged to dev (#382) | synthetic customer account for end-to-end checks | Business owner |
| F30 | P2 | R17 | Merged to dev (#382) | synthetic customer account for end-to-end checks | Business owner |
| F31 | P1 | R18 | Merged to dev (#383) | attribution/quote policy approval; measured edge-cache hits | Business owner |
| F32 | P2 | R18 | Merged to dev (#383) | attribution/quote policy approval; measured edge-cache hits | Business owner |
| F33 | P2 | R19 | Merged to dev (#384) | policy content-authority approval | Business owner |
| F34 | P2 | R19 | Merged to dev (#384) | policy content-authority approval | Business owner |
| F35 | P2 | R19 | Merged to dev (#384) | policy content-authority approval | Business owner |
| F36 | P2 | R20 | Merged to dev (#385) | real iPhone Safari/touch/reduced-motion/screen-reader checks | Claude + owner (preview) |
| F37 | P2 | R20 | Merged to dev (#385) | real iPhone Safari/touch/reduced-motion/screen-reader checks | Claude + owner (preview) |
| F38 | P2 | R21 | Merged to dev (#387) | final campaign imagery/copy; preview screenshots + CLS; enable e2e color-contrast | Business owner |
| F39 | P2 | R21 | Merged to dev (#387) | final campaign imagery/copy; preview screenshots + CLS; enable e2e color-contrast | Business owner |
| F40 | P2 | R21 | Merged to dev (#387) | final campaign imagery/copy; preview screenshots + CLS; enable e2e color-contrast | Business owner |
| F41 | P2 | R10 | Merged to dev (#374) | synthetic customer account for acceptance | Business owner |
| F42 | P1 | R22 | First slice merged to dev (#388) | remaining low-coverage routes, semantic smoke counts, checkout-handoff e2e, failing-before audit | Claude + owner (preview) |
| F43 | P1 | R22 | First slice merged to dev (#388) | remaining low-coverage routes, semantic smoke counts, checkout-handoff e2e, failing-before audit | Claude + owner (preview) |
| F44 | P1 | R23 | Merged to dev (#389) | owner (admin): import rulesets, decide review/bypass policy, safe rejected-push test | Business owner |
| F45 | P2 | R24 | Not started | reconcile merge-authority rule and hardcoded-copy rule (see CLAUDE.md "Known deviations") | Business owner |
| F46 | P2 | R06 | Merged to dev (#370) | visual comparison of sanitized content | Claude + owner (preview) |
| F47 | P1 | R12 | Merged to dev (#377) | preview verification | Claude + owner (preview) |
| F48 | P2 | R21 | Merged to dev (#387) | final campaign imagery/copy; preview screenshots + CLS; enable e2e color-contrast | Business owner |
| F49 | P2 | R07 | Merged to dev (#371) | shipping/duties/returns wording authority; discount eligibility policy (F49) | Business owner |
| F50 | P0 | R23 | Merged to dev (#389) | owner (admin): import rulesets, decide review/bypass policy, safe rejected-push test | Business owner |
