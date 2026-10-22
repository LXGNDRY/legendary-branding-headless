# Complete file review register

Pinned revision: `51ec8619233d78c7ee503c205f72627ba1444dea`. This is an exhaustive tracked-blob inventory, not a claim that static analysis proves every line correct. Text review combined full retrieval/local materialization, cross-file scans, structural/contract inspection, and manual tracing of high-risk paths. Every text file was available to the audit; line counts and immutable blob IDs make the scope reproducible. Tests/docs/configuration were included. Binary files were not visually decoded; their review remains R21. Generated files and lockfiles were inspected as contracts/structure, not line-by-line dependency security certification.

Total tracked blobs: **227**. Text files: **216** (38,768 lines including lockfile/docs). Binary files: **11**. Route modules: **32**. Production component modules: **47**. Test files: **35** at this baseline (PR #365/#366 not included). Counts supersede older plan estimates.

No direct finding on a file means no specific defect was established in this pass; it does not remove the listed regression/acceptance responsibility. Review matching dependencies and consumer contracts before modification. Source links for specific findings are pinned in [FINDINGS.md](FINDINGS.md).

| File | Blob SHA | Bytes | Lines | Review treatment | Follow-up |
|---|---|---:|---:|---|---|
| `.env.example` | `115988e0c4f6318de8bc1b0701bf2a9afff99c51` | 5631 | 98 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `.github/CODEOWNERS` | `da320b8053fe1b6b87cb59eb33c3a394b48350f5` | 286 | 10 | Text: retrieved; static structure/pattern/contract review | R23 |
| `.github/dependabot.yml` | `e8b93071e1d09e8e740ac6bb4254b3d8ec38a0f5` | 1572 | 53 | Text: retrieved; static structure/pattern/contract review | R23 |
| `.github/pull_request_template.md` | `c7ca7d25e5a08a512647515af0bef6f321caddec` | 1180 | 42 | Text: retrieved; static structure/pattern/contract review | R23 |
| `.github/workflows/oxygen-deployment-1000180490.yml` | `9fd3281b183dc3c0210ceda6ce89b54aa8ed0d11` | 17268 | 405 | Text: retrieved; static structure/pattern/contract review | R22, R23 |
| `.github/workflows/pr-governance.yml` | `d8f70fe6990d5f95d9d6485f08a493a0f3fe947e` | 882 | 32 | Text: retrieved; static structure/pattern/contract review | R23 |
| `.gitignore` | `ba430f442227d568c6c3a2e04a7a7110d4e671f2` | 328 | 25 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `.graphqlrc.ts` | `2d9ce533f9386f47c4383077e7bf2e7e3a03d0b8` | 1067 | 38 | Text: retrieved; static structure/pattern/contract review | R03 |
| `CLAUDE.md` | `dd546b66b062940958f1fee31ce72e811e14d868` | 21991 | 353 | Text: retrieved; static structure/pattern/contract review | R24 |
| `README.md` | `8398f104fc0cc8afd50d9809d9797e4ceca52623` | 4499 | 152 | Text: retrieved; static structure/pattern/contract review | R24 |
| `app/__tests__/routes/_index.test.ts` | `4f428b624f79e4ba5920895621256654cb654caa` | 4563 | 138 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/__tests__/routes/api.chat.test.ts` | `5e4b9bb1d58215358eb48816ee96103e29afb23e` | 3899 | 115 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/__tests__/routes/api.market.test.ts` | `c0ad50ae910b49d7c063e03d9ae941cc4643cca2` | 2694 | 69 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/__tests__/routes/api.newsletter.test.ts` | `95cd71a695e390d8283d2611a75862ea71edb55b` | 4176 | 114 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/__tests__/routes/api.waitlist.test.ts` | `6597191dd0b6c35d062fb8054e18229a8c161277` | 4803 | 138 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/__tests__/routes/collections.$handle.test.ts` | `c504b3297b7eede5d29118bab610d73ee55e93d4` | 4954 | 146 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/__tests__/routes/products.$handle.test.ts` | `d1f4704314d8653039620a8a1aa9c5c4c0ee5609` | 2835 | 91 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/__tests__/routes/search.test.ts` | `75c02e88ea3faf381503751e54d0f5bb65a39fd9` | 4312 | 125 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/components/chat/ChatWidget.tsx` | `b30a5ef455c34d6f64502e71b6d3c5063354600f` | 7389 | 191 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/layout/AnnouncementBar.tsx` | `65b13ce5b7bcd9810eff81c77c730713a498d2be` | 5461 | 118 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/layout/CartDrawer.tsx` | `fc67d12d0567d391b3acca2e00710b2bdbbff99f` | 22199 | 533 | Text: retrieved; static structure/pattern/contract review | R07, R20/R21 regression sweep |
| `app/components/layout/Footer.tsx` | `94bf9ab144dc2c34e4d285913fdf0fb40c1e43a1` | 6178 | 161 | Text: retrieved; static structure/pattern/contract review | R19, R20/R21 regression sweep |
| `app/components/layout/Header.tsx` | `e9f35949248e98431e5524fabec9ffdb42159dc4` | 23986 | 585 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/sections/BeforeAfter.tsx` | `a0815820cde76f1d939914ff33d258f7b3b4ef22` | 4849 | 146 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/sections/BrandMarquee.tsx` | `0067e73fe502d9edc92e9a01e68f1feb97d7334b` | 2550 | 56 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/sections/BrandStory.tsx` | `7faeba18fab7520f9c7cb6bbb641be40ab548afd` | 2467 | 80 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/sections/CategoryGrid.tsx` | `69083b921cec2da549bcf2b0468c0403001a1dcb` | 3295 | 80 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/sections/CollectionGrid.tsx` | `5ec51427517dd099dcb90aa4b31035c8b827a051` | 4291 | 117 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/sections/ContentBlocks.tsx` | `05475527d232b5f818eb23aee8467efa3c5c1c08` | 5126 | 145 | Text: retrieved; static structure/pattern/contract review | R06, R20/R21 regression sweep |
| `app/components/sections/CurrentOffers.tsx` | `c0710028ecee6f8f1bcd609e4f7e6a2c30dfad01` | 1975 | 45 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/sections/DropTimer.tsx` | `aed4d5d0bea5b970735baba6bf5c82dcb4692faa` | 4599 | 149 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep, R21 |
| `app/components/sections/EditorialBand.tsx` | `9dd5e15e5fa90dc4b5f313091bda95824c22972b` | 2735 | 89 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/sections/FitCheck.tsx` | `79e6272e710bee9c2c092bd911a62f672d81de1d` | 4501 | 123 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/sections/HeroSplit.tsx` | `2dbf1c6c2be98fdf675d4fa259e67f2c0cf0a983` | 6693 | 154 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep, R21 |
| `app/components/sections/Lookbook.tsx` | `7673f70bc9f60986775d1acc9cb969079bdd92ff` | 5379 | 153 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep, R21 |
| `app/components/sections/NewArrivalsGrid.tsx` | `39133add784719b36a286765a4b9e07bdd572ab0` | 2150 | 61 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/sections/NewsletterBand.tsx` | `cb21992da03a7e65b68330c8ecaf59779e822426` | 1228 | 35 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/sections/ProductReviewList.tsx` | `66a4b260437413b27b4f8c42a44bd012fcc7cc66` | 3496 | 99 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/sections/ReviewQuotes.tsx` | `97da9b917c3f4a6de2a9f414d79241aad4ba2b53` | 2895 | 77 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/sections/StatStrip.tsx` | `1d72cc74338c25340c8223bf57dc92f740fb1ac6` | 1998 | 61 | Text: retrieved; static structure/pattern/contract review | R07, R20/R21 regression sweep |
| `app/components/sections/StreetHero.tsx` | `55930bfc6eb96f7107dd07b3f2181ecdac46c3f8` | 3942 | 134 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep, R21 |
| `app/components/sections/VerifiedReviews.tsx` | `98071de6acbd1a3417f72f04cb744601c18e45eb` | 3335 | 87 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/seo/Analytics.tsx` | `961be51c8b0fea361b913828ea1b714be98f7459` | 14119 | 353 | Text: retrieved; static structure/pattern/contract review | R15, R20/R21 regression sweep |
| `app/components/seo/SeoSchema.test.ts` | `1ee2469703b7476a973664794045ee55e70b2366` | 3234 | 86 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/components/seo/SeoSchema.tsx` | `b9f53e478c2e47ed77d8bfcd8246a6c94a75a774` | 8852 | 280 | Text: retrieved; static structure/pattern/contract review | R19, R20/R21 regression sweep |
| `app/components/ui/Badge.tsx` | `1cbefde239eb89a41466cab0f716a53f4808ee28` | 1333 | 41 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/ui/BrandLogo.tsx` | `27b24003ab68c64d8450f8ebfe37fb1c950e6a20` | 5280 | 49 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/ui/Button.tsx` | `e53e7c2c94a78da9aa3b4fe3460e6a6949c3148a` | 4671 | 140 | Text: retrieved; static structure/pattern/contract review | R20, R20/R21 regression sweep |
| `app/components/ui/Container.tsx` | `aeb7d8bb37b32e87ee2dfd8173bf7fece8dfccd8` | 650 | 25 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/ui/DiscountsPopup.test.tsx` | `bf2b9c1bf3abc8704fe0a8876b1f52e0c2c4bd2a` | 3254 | 102 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/components/ui/DiscountsPopup.tsx` | `7e06aa73553fcd2756515354dc00c01dc5cf9808` | 8446 | 207 | Text: retrieved; static structure/pattern/contract review | R07, R20, R20/R21 regression sweep |
| `app/components/ui/HeroPlaceholder.tsx` | `afe785bc9bf9de56290527f1b7d65cf3d5b7b41f` | 2666 | 83 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/ui/JsonLd.tsx` | `d75297c07fb6f253d0879d49b26ef6381abc1587` | 297 | 13 | Text: retrieved; static structure/pattern/contract review | R06, R20/R21 regression sweep |
| `app/components/ui/MarketSelector.tsx` | `8f0d5890666855a4e7b9abb800674a85aced7806` | 3182 | 83 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/ui/NewsletterForm.tsx` | `f62017f876ca4e6241e3cbd32c168412eca83a86` | 4589 | 106 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/ui/Placeholder.tsx` | `f3ce4490bcaf1ccbe8530bae29cc29f7d14993dd` | 816 | 28 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep, R21 |
| `app/components/ui/ProductCard.test.ts` | `26c56cc82bb116bd7d5d8b6807916219de32e721` | 5943 | 170 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/components/ui/ProductCard.tsx` | `d09de65a25efc056d57bdafe0fc579dfb9856144` | 17105 | 460 | Text: retrieved; static structure/pattern/contract review | R12, R20/R21 regression sweep |
| `app/components/ui/ProductGallery.tsx` | `837ecd0edff759deae5c66e9ce62848ab2f53652` | 5735 | 156 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/ui/QuickAddModal.test.tsx` | `287622e2ff67f5ef21c915160f4db371ff84e79f` | 3553 | 85 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/components/ui/QuickAddModal.tsx` | `3e3c91ba5cbb6b0c2a38a1786254131b26d55040` | 13837 | 313 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/ui/RecentlyViewed.tsx` | `361b7015edade4211f6a86b95cea7a6c7118e0fe` | 4359 | 137 | Text: retrieved; static structure/pattern/contract review | R10, R20/R21 regression sweep |
| `app/components/ui/SearchTypeahead.tsx` | `4d107d60f336fd74a2621b1a1a2155e629c11c28` | 12498 | 338 | Text: retrieved; static structure/pattern/contract review | R13, R20/R21 regression sweep |
| `app/components/ui/SizeGuideModal.tsx` | `8fdf2662a602b97ae2eb7ddff51e47930cc61266` | 3382 | 62 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/ui/StarRating.tsx` | `4ef794c2b8def5af38746f55f84edc6bafce8faa` | 1372 | 42 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/components/ui/TrustSignals.tsx` | `8f226f82d3e6b4eff9e077ec2b43e9717d12be5f` | 2013 | 59 | Text: retrieved; static structure/pattern/contract review | R07, R20/R21 regression sweep |
| `app/components/ui/WaitlistForm.tsx` | `fab6b59f065a944861ab3ae136084e78fc5f1d5b` | 2772 | 75 | Text: retrieved; static structure/pattern/contract review | R08, R20/R21 regression sweep, R21 |
| `app/components/ui/Wishlist.tsx` | `f8616a97eece1ac099ecc8137909daaef1f5d043` | 6509 | 225 | Text: retrieved; static structure/pattern/contract review | R10, R20/R21 regression sweep |
| `app/components/ui/WishlistButton.tsx` | `35fabb36773896d63d354185cadab12899e9761e` | 2073 | 66 | Text: retrieved; static structure/pattern/contract review | R20/R21 regression sweep |
| `app/entry.client.tsx` | `cad4fc9792636e0d51752512bf4780543eef2103` | 270 | 12 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `app/entry.server.tsx` | `5dc839e28e8910b680529bdafdce38a8787792eb` | 1347 | 41 | Text: retrieved; static structure/pattern/contract review | R14 |
| `app/hooks/useBodyScrollLock.ts` | `afe4ae35e65d20ed8bc011fd6e45c9d7e6c74620` | 1446 | 41 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `app/hooks/useFocusTrap.ts` | `4fe0ec8d01d7c7c6418664da2d185ed03c35b88b` | 2965 | 101 | Text: retrieved; static structure/pattern/contract review | R20 |
| `app/hooks/useReveal.ts` | `6227db57385f7397f372fc97580f4eda180358e6` | 1451 | 56 | Text: retrieved; static structure/pattern/contract review | R21 |
| `app/lib/analytics-environment.test.ts` | `d94497c8b312ecb18a27d275c56a936c65d31fbd` | 3804 | 91 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/analytics-environment.ts` | `987f28279595b15063c05680e9a5167875c80a76` | 2979 | 64 | Text: retrieved; static structure/pattern/contract review | R15 |
| `app/lib/cache.test.ts` | `a9172751ee8a9df5aea1fd760ccf407a754a9478` | 1215 | 42 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/cache.ts` | `7f984366de7eae6097c9e4e696b8d568ba33a0e4` | 2294 | 72 | Text: retrieved; static structure/pattern/contract review | R12 |
| `app/lib/cart-permalink.test.ts` | `7b2c49c3a9274d8e4d49aeb99b6a6e1c8ae9162d` | 1483 | 41 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/cart-permalink.ts` | `5d1ba7022edb832badcb2d1707318cef0a70cfdf` | 1641 | 39 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `app/lib/cart.test.ts` | `64b163eaaa8160d98a75333714d8aacace5fc3bf` | 2069 | 61 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/cart.ts` | `afaadc9dee060ca2c62d195f26e507f4b419ff60` | 2880 | 84 | Text: retrieved; static structure/pattern/contract review | R11 |
| `app/lib/context.test.ts` | `e59d7e9c18cb5e0604ff7298e184fdaada67a04c` | 1220 | 35 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/context.ts` | `a852b97f95c7d0c61509d04b57959db32b48dd23` | 4425 | 118 | Text: retrieved; static structure/pattern/contract review | R11 |
| `app/lib/discounts.test.ts` | `612ba5cdcc875f0cdaf2a317e654ce403eaf35af` | 7807 | 224 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/discounts.ts` | `e5a5b67b81cf330d3ba28a7cd6a709d0eabd56a4` | 9420 | 231 | Text: retrieved; static structure/pattern/contract review | R07 |
| `app/lib/fragments.ts` | `4314d3f0380c9df5e4837f08ad22fc3491a79194` | 8219 | 334 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `app/lib/i18n.test.ts` | `4a4636e0aa57476bca81c25c1445668205aaf86a` | 442 | 12 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/i18n.tsx` | `3ccb7225fab7ba86c4e45d8b25992e09f77e7829` | 1905 | 50 | Text: retrieved; static structure/pattern/contract review | R11 |
| `app/lib/judgeme.test.ts` | `bb833f2b0f29f92b66173d77a97766a5e30e7bd8` | 12467 | 269 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/judgeme.ts` | `55e8f05f30b54be05a808daa8eda9946bfaf6d15` | 19605 | 495 | Text: retrieved; static structure/pattern/contract review | R18 |
| `app/lib/klaviyo-onsite.test.ts` | `d4b2f91e5521df99ebc0e0a80cb93c1b753b1857` | 1781 | 57 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/klaviyo-onsite.ts` | `2d3ee646707b685d341665f219c6ccb5169c2fd9` | 2210 | 63 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `app/lib/klaviyo.test.ts` | `98737f53b04b6dc9a10b95a41e60abcd4443b761` | 1838 | 53 | Text: retrieved; static structure/pattern/contract review | R08, R22 |
| `app/lib/klaviyo.ts` | `310eb9860e7a5372d1b16779230ab108fba68b42` | 2053 | 73 | Text: retrieved; static structure/pattern/contract review | R08 |
| `app/lib/market.test.ts` | `54407b90e530c311a71413e8f495d0cfe7a3b451` | 1713 | 59 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/market.ts` | `3ab38ec33a7f9afe206927c0fb4648433e207c9b` | 3841 | 125 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `app/lib/monitoring.ts` | `71c4fe928c54e2bf7b41edec132caaeb5edcb658` | 6523 | 177 | Text: retrieved; static structure/pattern/contract review | R14 |
| `app/lib/nav.test.ts` | `3cdacbb6bba2226b77b19509662cb036fe0022ce` | 4840 | 104 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/nav.ts` | `56839a19816d85010ae3820043089996fab3574b` | 4709 | 164 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `app/lib/pagination.test.ts` | `432bcfd486c8b619d1210227a1dbe80618a21a82` | 1714 | 48 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/pagination.ts` | `4f751a11144cea5afaebb9776732cbb81f2fa495` | 861 | 20 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `app/lib/rate-limit.test.ts` | `264e8a69542a04e0f022b16c8fbc61fe6400afc6` | 3680 | 101 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/rate-limit.ts` | `9c921b8532160934d6d054dbdd99213d36c4c4a6` | 3685 | 131 | Text: retrieved; static structure/pattern/contract review | R16 |
| `app/lib/robots.test.ts` | `3a86d3616612f848b435362d1bb3eef982751d98` | 5360 | 111 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/robots.ts` | `e7dd82b286a4e86883919e17b3d651a7136c83f0` | 4085 | 86 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `app/lib/security.test.ts` | `e09935576044a214018eac617141e1a53cd28855` | 5971 | 155 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/security.ts` | `d16fc0f5b567456bbcd6a9c41cf1d1b570f82e6a` | 4953 | 114 | Text: retrieved; static structure/pattern/contract review | R06 |
| `app/lib/sentry.server.ts` | `079414bc2a831960560cd7effd2184e64166cfae` | 5161 | 162 | Text: retrieved; static structure/pattern/contract review | R14 |
| `app/lib/session.test.ts` | `fa7d764cf32f60944a79af42d53f2788d7e65fdc` | 1417 | 34 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/session.ts` | `30463307b664197b18a71f53b8f9bead57af5979` | 2784 | 98 | Text: retrieved; static structure/pattern/contract review | R05 |
| `app/lib/sitemap.test.ts` | `4c04b38fe79d86e81eccc9faa18e9c01469dcb6d` | 879 | 20 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/sitemap.ts` | `e2226f4d91339e731f3a2b82ce59805b8f202740` | 635 | 12 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `app/lib/trust.test.ts` | `b9a523dd270dcb5b04a7b1527406f76fe5fcdc13` | 3930 | 90 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/trust.ts` | `19eaf79d95ab82701e132581b89fcbf976d40e97` | 5951 | 153 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `app/lib/variant-selection.test.ts` | `c0f4b6af49bdab2e9eeab24f7ea558bbb680962c` | 1995 | 49 | Text: retrieved; static structure/pattern/contract review | R22 |
| `app/lib/variant-selection.ts` | `a0f5935e0acafcf877c008a978c7c3a925f5ba0d` | 2873 | 81 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `app/locales/de.json` | `6cb798f7ca53bf50ed29cfaffb2d134fe7bef585` | 3509 | 3 | Text: retrieved; static structure/pattern/contract review | R07, R11 |
| `app/locales/en.json` | `8df0a2d3bba98e1b49d0e18460ea72025a8fc98d` | 3373 | 58 | Text: retrieved; static structure/pattern/contract review | R07, R11 |
| `app/locales/es.json` | `31dbdc1d2cf368e2b84d8b3467115143318123f9` | 3445 | 3 | Text: retrieved; static structure/pattern/contract review | R07, R11 |
| `app/locales/fr.json` | `b18ddf72a2bc98a903002ab87a70809c9ea30b86` | 3572 | 3 | Text: retrieved; static structure/pattern/contract review | R07, R11 |
| `app/locales/hi.json` | `3fcc29c246a637d87907410d3a9875dd12c07a7c` | 5709 | 3 | Text: retrieved; static structure/pattern/contract review | R07, R11 |
| `app/locales/id.json` | `d43dc61aa8e0369ae562e82c61a8d46313d7b13c` | 3443 | 3 | Text: retrieved; static structure/pattern/contract review | R07, R11 |
| `app/locales/it.json` | `50e133db2c0c6fcc4acb016bf713a23f980d9f5d` | 3529 | 3 | Text: retrieved; static structure/pattern/contract review | R07, R11 |
| `app/locales/pt-BR.json` | `ac4920b4a96948456817aa69f90ce5ca54acdc0b` | 3469 | 3 | Text: retrieved; static structure/pattern/contract review | R07, R11 |
| `app/root.tsx` | `c4a72aca22091197cb31d479f710944dbcfcd5d6` | 19316 | 481 | Text: retrieved; static structure/pattern/contract review | R11, R14, R20, R21 |
| `app/routes.ts` | `c04bacd5b01cf0416d139f575745aeb52b85b2e7` | 163 | 4 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `app/routes/$.tsx` | `77658b2eb8b69c77ffc19234d6f9629567a42582` | 1705 | 47 | Text: retrieved; static structure/pattern/contract review | R22 journey matrix |
| `app/routes/[robots.txt].ts` | `9a1588646ed340aab36984511dfbc248fb148287` | 1355 | 29 | Text: retrieved; static structure/pattern/contract review | R22 journey matrix |
| `app/routes/[site.webmanifest].ts` | `21d0bf22510627efeb483131af88ffba8d5a8d48` | 1202 | 33 | Text: retrieved; static structure/pattern/contract review | R21, R22 journey matrix |
| `app/routes/[sitemap.xml].tsx` | `61ca802765d70e8bc7901e3fe4f8871601ecf3ad` | 5390 | 98 | Text: retrieved; static structure/pattern/contract review | R19, R22 journey matrix |
| `app/routes/_index.tsx` | `23b84a6342dc07e15829bc41e1b1d8c8d235732c` | 12408 | 325 | Text: retrieved; static structure/pattern/contract review | R07, R21, R22 journey matrix |
| `app/routes/account._index.tsx` | `6a495f59e3128dd7b95e1b8349550552f2d85160` | 4703 | 133 | Text: retrieved; static structure/pattern/contract review | R17, R20, R22 journey matrix |
| `app/routes/account.addresses.tsx` | `de48d0d0088df4a2cc38556785647c28c7ceb05e` | 19245 | 588 | Text: retrieved; static structure/pattern/contract review | R17, R22 journey matrix |
| `app/routes/account.authorize.tsx` | `3d338240d4426dbbdff3fae1f415ed54af936d67` | 1416 | 43 | Text: retrieved; static structure/pattern/contract review | R22 journey matrix |
| `app/routes/account.edit.tsx` | `713fec9bfebd9eb8be3f03ced08257e3c0275b0f` | 6840 | 234 | Text: retrieved; static structure/pattern/contract review | R22 journey matrix |
| `app/routes/account.login.tsx` | `c212173f4ee465446fe3fdb5f9f012c2e76b385b` | 955 | 32 | Text: retrieved; static structure/pattern/contract review | R22 journey matrix |
| `app/routes/account.logout.tsx` | `fc982562c1f6b8f7c0fed74679013e203a681dbc` | 535 | 24 | Text: retrieved; static structure/pattern/contract review | R22 journey matrix |
| `app/routes/account.orders.tsx` | `266867c6f455fb5e6a38d8f3a6699c65219a9966` | 7176 | 230 | Text: retrieved; static structure/pattern/contract review | R17, R21, R22 journey matrix |
| `app/routes/account.register.tsx` | `01e74dba3aaee1dc884d7433403c04b47820cdb5` | 1122 | 35 | Text: retrieved; static structure/pattern/contract review | R22 journey matrix |
| `app/routes/account.tsx` | `7e5b22d95edc1cfcb921ba7cc3c64af04de13c65` | 218 | 9 | Text: retrieved; static structure/pattern/contract review | R17, R22 journey matrix |
| `app/routes/api.chat.ts` | `ea1d98235f50c26fa041aed5583632ae4991c182` | 9837 | 249 | Text: retrieved; static structure/pattern/contract review | R16, R22 journey matrix |
| `app/routes/api.market.ts` | `c395cc432108c0b70e6dbeae822da4de4d9b4842` | 2533 | 69 | Text: retrieved; static structure/pattern/contract review | R11, R22 journey matrix |
| `app/routes/api.newsletter.ts` | `3457ce0a10775cef87a77ef1c94ae2e3925ca25f` | 4194 | 139 | Text: retrieved; static structure/pattern/contract review | R22 journey matrix |
| `app/routes/api.quick-add.ts` | `9fb3db4608994fa4d33e2050d3d7571768637625` | 2165 | 71 | Text: retrieved; static structure/pattern/contract review | R12, R22 journey matrix |
| `app/routes/api.search.ts` | `6fb76c156ca3bbaa0e157746345fe1d4fb2f00c8` | 2462 | 92 | Text: retrieved; static structure/pattern/contract review | R09, R22 journey matrix |
| `app/routes/api.waitlist.ts` | `07d077914645b101b794dfd2ebf7b33ee0371973` | 2943 | 86 | Text: retrieved; static structure/pattern/contract review | R06, R08, R22 journey matrix |
| `app/routes/api.wishlist.ts` | `f0b1c0dda14a36b04075f959275b21bfb785e271` | 5101 | 179 | Text: retrieved; static structure/pattern/contract review | R10, R22 journey matrix |
| `app/routes/cart.$lines.tsx` | `35884c44be2b820a612061c43b81163f66fe9365` | 927 | 23 | Text: retrieved; static structure/pattern/contract review | R06, R22 journey matrix |
| `app/routes/cart.tsx` | `4cba694bcd8c3ccd767cbf2f0f64905690340cb3` | 19570 | 503 | Text: retrieved; static structure/pattern/contract review | R04, R05, R22 journey matrix |
| `app/routes/collections.$handle.tsx` | `dd65746e8a133877838e1c36786c61dac87b7e50` | 21615 | 532 | Text: retrieved; static structure/pattern/contract review | R13, R20, R22 journey matrix |
| `app/routes/collections._index.tsx` | `73244f0fdd78e7ba4930d32acf3663bc42ae7f33` | 4772 | 141 | Text: retrieved; static structure/pattern/contract review | R22 journey matrix |
| `app/routes/journal.$articleHandle.tsx` | `93083860c479bd768a0191f9e7691283c36242dc` | 7654 | 215 | Text: retrieved; static structure/pattern/contract review | R06, R22 journey matrix |
| `app/routes/journal._index.tsx` | `620f6cc726a4e991bb55595d938eb6a40cfbf977` | 7399 | 208 | Text: retrieved; static structure/pattern/contract review | R19, R22 journey matrix |
| `app/routes/pages.$handle.tsx` | `e0fe26550c1d65d06fdb38c13f8d82fc56ce57e6` | 3744 | 129 | Text: retrieved; static structure/pattern/contract review | R06, R19, R22 journey matrix |
| `app/routes/policies.$handle.tsx` | `beac61957fb42d857110164fc5c320a4bf5df91f` | 6702 | 189 | Text: retrieved; static structure/pattern/contract review | R06, R07, R19, R22 journey matrix |
| `app/routes/products.$handle.tsx` | `7d535d004aa2fe5c0763d05aaa253972ccd3432b` | 57652 | 1235 | Text: retrieved; static structure/pattern/contract review | R04, R06, R07, R12, R18, R19, R22 journey matrix |
| `app/routes/search.tsx` | `09c9e9cce95adc15057dc10bcea6fa192c8ca840` | 26256 | 654 | Text: retrieved; static structure/pattern/contract review | R12, R13, R22 journey matrix |
| `app/routes/wishlist.tsx` | `f37b94b56b1361c830d8b5d28c0d188fed83b253` | 6324 | 148 | Text: retrieved; static structure/pattern/contract review | R10, R12, R22 journey matrix |
| `app/styles/app.css` | `8b111d52846e1c64084f48a94916d92940bb2d49` | 27972 | 799 | Text: retrieved; static structure/pattern/contract review | R21 |
| `app/test/mock-storefront.ts` | `94d318e26d2049ba54a7d107490dc840434e9adb` | 3931 | 146 | Text: retrieved; static structure/pattern/contract review | R22 |
| `customeraccountapi.generated.d.ts` | `f77a88fa0db61659f1d36fe3f09c107d0d7f6418` | 73 | 6 | Text: retrieved; static structure/pattern/contract review | R03 |
| `docs/ANALYTICS.md` | `c7fd29ee43cea42cd28db2f6f3b570d9238df1f3` | 5571 | 101 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/ARCHITECTURE.md` | `c982c5d4c9836e47cfb6d98bf6c2044fe71873d1` | 14591 | 258 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/DARK_THEME_TRANSFORMATION_REPORT.md` | `c278bcde55f2e0d4e0de2f995be6c8873896920c` | 14581 | 326 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/DEPLOYMENT.md` | `9a2d539d1b5ed79af045062dd9061dd04c923230` | 15726 | 250 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/DEV_BASELINE_AUDIT.md` | `67770930376c7606d8e44179f316b4467d782a0a` | 3429 | 65 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/E2E_SCALEUP_PLAN.md` | `f6ce3698fc1173196664dcc46ca1bb8e735cd701` | 6511 | 97 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/LAUNCH_CHECKLIST.md` | `a27aa7572a110d4fe2f8285d12d07efa3fab2033` | 7507 | 128 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/LIVE_READINESS_IMPLEMENTATION_PLAN.md` | `8f3888c22dad9124ffef62c2b5afc776372d0a3e` | 29898 | 913 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/POST_LAUNCH_ROADMAP.md` | `e9a3713911e7a966dae25332fcb2a6c1a28e63a0` | 4896 | 84 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/PRODUCTION_READINESS.md` | `7cf32b0b550a0d72217260dbaaae1f2f0b1c2645` | 16373 | 154 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/REPOSITORY_GOVERNANCE.md` | `75e69d3e5836a70d951a632b2c5c66f5212c7ef5` | 2100 | 57 | Text: retrieved; static structure/pattern/contract review | R23, R24 |
| `docs/TPS_REMEDIATION_PLAN.md` | `3836486c2f03671ea5e1736b3cdad3c539303bbe` | 14202 | 189 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/audit-phase1-findings.md` | `b5153332de608378d70436ddf7de02076e1551f1` | 4713 | 24 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/audit-phase2-findings.md` | `58bc53cbeeeae34f45415c67226d3b12cb4eed78` | 4731 | 25 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/audit-phase3-findings.md` | `59f6f8bd05822f65b8a2cbcbad1967e010328fa0` | 3081 | 16 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/audit-phase4-findings.md` | `c405e66d5ce85be552fdce406c1aea8317ffb054` | 4761 | 20 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/audit-phase5-findings.md` | `800ece623b61df15f1499e874b52560c07821f51` | 5967 | 21 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/audit-phase6-findings.md` | `76314155649c9e7efcd4523dcc5de6fa07cf216f` | 11024 | 19 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/audit-phase7-findings.md` | `d5a5ccf3c1f6db6f5ca9e75eb635d3222241a092` | 5650 | 13 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/full-site-audit-plan.md` | `064b6205a46bc951401ca8919d9644c1a8c1876f` | 10389 | 99 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/hextom-translate-currency-migration.md` | `31ec240294adac30caae0b16afc167b96265c26f` | 2077 | 39 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/metafield-definitions.md` | `758f4261bb3ea8e3246a30b7b36e5333906db150` | 3858 | 108 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/mobile-optimization-changelog.md` | `672f5adf7c3c95fc5990b5bb0df0a951167db3bb` | 7829 | 137 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/phase5-changelog.md` | `803e9d3b85df1fc007ae52b0333a611edc6ccf77` | 8225 | 174 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/phase6-codegen-changelog.md` | `c8df2285ad57cda556e552a695dd25772f94c6b9` | 7485 | 183 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/phase7-10-hardening-changelog.md` | `dc8459cfe9511e2b95ef00e3e5671583ac43807f` | 7082 | 176 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/theme/hanssen-design-system.md` | `df4334cd0a5dfd35d5e2ca4d967712ee5b4ea486` | 12264 | 296 | Text: retrieved; static structure/pattern/contract review | R24 |
| `docs/theme/phase5-functional-changelog.md` | `2523413564742c13e079a8bb8a5f9909ec71bd4b` | 8962 | 210 | Text: retrieved; static structure/pattern/contract review | R24 |
| `e2e/a11y.spec.ts` | `9b20cb63c34a39110b7b9ff6bdf7d5de96f9233d` | 2326 | 61 | Text: retrieved; static structure/pattern/contract review | R22 |
| `e2e/commerce.spec.ts` | `65dbe720de90b3c0a291a4b33be9a121ede3ee66` | 6906 | 145 | Text: retrieved; static structure/pattern/contract review | R22 |
| `e2e/golden-journeys.spec.ts` | `732a44035c2fcb48bbfbe4c8e90c6e70e731ac39` | 7085 | 165 | Text: retrieved; static structure/pattern/contract review | R17, R22 |
| `e2e/helpers/purchasable-product.ts` | `4d98435d0c52efa4226f6a297e92515aee18cbdc` | 2932 | 62 | Text: retrieved; static structure/pattern/contract review | R22 |
| `e2e/robots.spec.ts` | `261ac79b366a02277ba7f19c390443322998de67` | 854 | 19 | Text: retrieved; static structure/pattern/contract review | R22 |
| `e2e/storefront-proxy.spec.ts` | `92dbdaaad88b27e4c3f6922f34c986c62f802d36` | 823 | 18 | Text: retrieved; static structure/pattern/contract review | R22 |
| `env.d.ts` | `27044e035bd7cd002ff9a2df036313831e1f0e1c` | 1971 | 48 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `eslint.config.js` | `7e1b21f9a2dd165f87c6791f77ae19be744e0607` | 293 | 14 | Text: retrieved; static structure/pattern/contract review | R02 |
| `package-lock.json` | `c23c0f41b9987f5a27dcdb3f2f0f80fe9cd60f57` | 381239 | 10719 | Text: retrieved; static structure/pattern/contract review | R01 |
| `package.json` | `4376ba1505bda75bb124501e47789ef71c7f651e` | 2070 | 73 | Text: retrieved; static structure/pattern/contract review | R01, R02 |
| `playwright.config.ts` | `47c5162b073a1601cd8ea4cf6d35362d2e975369` | 3911 | 97 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `public/apple-touch-icon.png` | `aeaaffea55342d3c53fcf40f5e4eeb2316ca4612` | 6596 | — | Binary: metadata inventory only; rendering/bytes not reviewed | R21 |
| `public/favicon-16.png` | `c5b881baa1391d68fb24f8b26f78eb53b98ba6ee` | 568 | — | Binary: metadata inventory only; rendering/bytes not reviewed | R21 |
| `public/favicon-32.png` | `519084dfd9e4b4aa23846df0fd0a7d47513a2c87` | 1110 | — | Binary: metadata inventory only; rendering/bytes not reviewed | R21 |
| `public/favicon.svg` | `0ffb95f61f0504dd98485e0b86aa495b182a13cc` | 3533 | 5 | Text: retrieved; static structure/pattern/contract review | R21 |
| `public/fonts/instrument-serif-italic-latin-ext.woff2` | `1f7190917179c3c68972d0eccb6fc7463de46e81` | 12384 | — | Binary: metadata inventory only; rendering/bytes not reviewed | R21 |
| `public/fonts/instrument-serif-italic-latin.woff2` | `197abca2553c84829217223cdbc6efbe2493d645` | 22128 | — | Binary: metadata inventory only; rendering/bytes not reviewed | R21 |
| `public/fonts/instrument-serif-normal-latin-ext.woff2` | `0caad588cab430ca20279ca2aee45c8a4629ad3d` | 11604 | — | Binary: metadata inventory only; rendering/bytes not reviewed | R21 |
| `public/fonts/instrument-serif-normal-latin.woff2` | `0ad69719cac6f45ed3057825095b0cdffa7d3c99` | 21032 | — | Binary: metadata inventory only; rendering/bytes not reviewed | R21 |
| `public/fonts/inter-latin-ext.woff2` | `479d010d2902fa3a5b48e84a973db1978b2e9949` | 85068 | — | Binary: metadata inventory only; rendering/bytes not reviewed | R21 |
| `public/fonts/inter-latin.woff2` | `d15208de03cd1ad7c5199f0a0ce915fe841e4722` | 48256 | — | Binary: metadata inventory only; rendering/bytes not reviewed | R21 |
| `public/icon-192.png` | `cb666d22c7eda0298e399a652dc5387da88fce49` | 7096 | — | Binary: metadata inventory only; rendering/bytes not reviewed | R21 |
| `public/icon-512.png` | `08a71ba90802566f845c46b11271182faeef0bd5` | 20271 | — | Binary: metadata inventory only; rendering/bytes not reviewed | R21 |
| `react-router-augment.d.ts` | `0a483c80356fa529ae5f528881fedd3bd00a4b62` | 349 | 11 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `react-router.config.ts` | `c95a756a8dc7bd51ed92538b4479b0a1adfdbcbe` | 193 | 6 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `scripts/locales.py` | `ea3f996130947cb1dd584dccefb6f35af2b6f204` | 3662 | 89 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `scripts/validate-pr-governance.mjs` | `5065ccae8346dcc5d4abb9fd2e5008cae98d5213` | 1545 | 55 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `scripts/validate-pr-governance.test.mjs` | `cddaea043c393943e0a1f48df368d8025544ef5d` | 1315 | 38 | Text: retrieved; static structure/pattern/contract review | R22 |
| `scripts/validate-release-env.mjs` | `e27eeb33e12e0427702d83ca4690c4b2ab3e9cf1` | 1756 | 40 | Text: retrieved; static structure/pattern/contract review | R23 |
| `scripts/validate-release-env.test.mjs` | `b50b7a0f5046dfee3d1a2f09bfafae49c1440755` | 576 | 13 | Text: retrieved; static structure/pattern/contract review | R22 |
| `scripts/validate-storefront-token.mjs` | `5cc93fbc3accb13267bd9b5d51e66db4bab75d6d` | 6272 | 149 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `scripts/validate-storefront-token.test.mjs` | `b2b9dc911a29b0121f2131c9e3e65fffe94f2ac1` | 2878 | 78 | Text: retrieved; static structure/pattern/contract review | R22 |
| `server.ts` | `197b935cd96aa01c9ab4bbbaec66082be8b5d184` | 3238 | 90 | Text: retrieved; static structure/pattern/contract review | R05, R14 |
| `storefrontapi.generated.d.ts` | `f77a88fa0db61659f1d36fe3f09c107d0d7f6418` | 73 | 6 | Text: retrieved; static structure/pattern/contract review | R03 |
| `tsconfig.json` | `fec0b5a3c76a14dcb560500a2042884cdccd2485` | 695 | 28 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `vite.config.ts` | `15695f709f6c97bf8a6bfd2b514bb79345f99e6a` | 1415 | 40 | Text: retrieved; static structure/pattern/contract review | R00/R22 compatibility and regression sweep |
| `vitest.config.ts` | `6b13b7768584529b51061e2ba4166e9977b4e1bb` | 399 | 20 | Text: retrieved; static structure/pattern/contract review | R22 |
