/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="vite/client" />

/**
 * Environment variables injected by Oxygen / Shopify CLI / .env
 * All PUBLIC_ vars are safe to expose to the client.
 */
interface Env {
  // Matches HydrogenEnv exactly — all required as string (Oxygen provides "" for unset vars)
  SESSION_SECRET: string;
  PUBLIC_STOREFRONT_API_TOKEN: string;
  PRIVATE_STOREFRONT_API_TOKEN: string;
  PUBLIC_STORE_DOMAIN: string;
  PUBLIC_STOREFRONT_ID: string;
  PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: string;
  PUBLIC_CUSTOMER_ACCOUNT_API_URL: string;
  PUBLIC_CHECKOUT_DOMAIN: string;
  SHOP_ID: string;
  // Extra vars not in HydrogenEnv
  PUBLIC_STOREFRONT_API_VERSION: string;
  // Analytics (optional — Oxygen provides "" when not configured)
  PUBLIC_GA4_MEASUREMENT_ID: string;
  PUBLIC_META_PIXEL_ID: string;
  PUBLIC_TIKTOK_PIXEL_ID: string;
  // Monitoring (optional)
  PUBLIC_SENTRY_DSN: string;
  // Newsletter / Klaviyo (optional — server-only)
  PRIVATE_KLAVIYO_API_KEY: string;
  PUBLIC_KLAVIYO_LIST_ID: string;
  // Klaviyo on-site embed (public company ID — safe to expose client-side)
  PUBLIC_KLAVIYO_COMPANY_ID: string;
}

declare module 'virtual:react-router/server-build' {
  const build: Record<string, unknown>;
  export = build;
}
