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
}

declare module 'virtual:react-router/server-build' {
  const build: Record<string, unknown>;
  export = build;
}
