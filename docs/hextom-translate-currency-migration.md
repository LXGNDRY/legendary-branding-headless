# Hextom Translate & Currency migration record

## Verified on 2026-09-24

- Seven Hextom languages are marked translated and published: French, German,
  Hindi, Indonesian, Italian, Brazilian Portuguese, and Spanish.
- The store has 24 published regions/currencies.
- Shopify manages the primary USD market and 20 of the published currencies.
- Hextom manages Argentina (ARS), Brazil (BRL), Colombia (COP), and Mexico
  (MXN). Brazil and Mexico are configured to round up to a whole number.
- The Hextom language and currency selector is enabled in the Liquid theme.

## Headless decision

Shopify Markets remains the only source of truth for a headless price,
currency, country eligibility, availability, and checkout. The storefront must
not recreate the four app-managed exchange rates in browser code: doing so can
show a price that does not match Shopify checkout.

The native country selector is safe because it uses Shopify's localization
response and cart buyer identity. The native language selector is intentionally
held back until each Hextom translation is verified to be available from
Shopify's Storefront API. Hextom being marked "published" does not by itself
prove that its translated product, page, SEO, image, and static UI content is
available to Hydrogen.

## Required migration evidence before Hextom removal

1. For each of the seven languages, compare a translated product, collection,
   page, policy, image alt text, and SEO field in Shopify against the
   Storefront API response in that language context.
2. Confirm whether Hextom's translated static theme strings can be exported.
   Recreate only reviewed headless UI strings in version-controlled locale
   files.
3. Move ARS, BRL, COP, and MXN to Shopify-managed Markets pricing, or retain
   Hextom for those four currencies. Do not expose a headless selector for an
   app-managed currency before its Shopify checkout parity is proven.
4. After domestic and international checkout verification, disable the Liquid
   selector only; keep Hextom installed until migration evidence is complete.
