/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="vite/client" />

/**
 * Environment variables injected by Oxygen / Shopify CLI / .env
 * All PUBLIC_ vars are safe to expose to the client.
 */
interface Env {
  SESSION_SECRET: string;
  PUBLIC_STOREFRONT_API_TOKEN: string;
  PRIVATE_STOREFRONT_API_TOKEN: string;
  PUBLIC_STORE_DOMAIN: string;
  PUBLIC_STOREFRONT_ID: string;
  PUBLIC_STOREFRONT_API_VERSION: string;
  PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: string;
  PUBLIC_CUSTOMER_ACCOUNT_API_URL: string;
  PUBLIC_CHECKOUT_DOMAIN: string;
  SHOP_ID: string;
  // Analytics (optional — leave empty to disable)
  PUBLIC_GA4_MEASUREMENT_ID: string;
  PUBLIC_META_PIXEL_ID: string;
  PUBLIC_TIKTOK_PIXEL_ID: string;
  // Monitoring (optional)
  PUBLIC_SENTRY_DSN: string;
}

declare module 'virtual:react-router/server-build' {
  const build: Record<string, unknown>;
  export = build;
}
