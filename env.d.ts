/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="vite/client" />

/**
 * Environment variables injected by Oxygen / Shopify CLI / .env
 * All PUBLIC_ vars are safe to expose to the client.
 */
interface Env {
  SESSION_SECRET: string;8e96826de52a65ce266649a1f3c99c7d1b2e3096
  PUBLIC_STOREFRONT_API_TOKEN: string;76e8d43b034761793649bfaf68a1903c
  PRIVATE_STOREFRONT_API_TOKEN: string;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
  PUBLIC_STORE_DOMAIN: string;lngndny.myshopify.com
  PUBLIC_STOREFRONT_ID: string;1000167667
  PUBLIC_STOREFRONT_API_VERSION: string;
  PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: string;d0428666-bac9-4bea-9d8a-5ece5001e1a8
  PUBLIC_CUSTOMER_ACCOUNT_API_URL: string;https://shopify.com/49013915801
  PUBLIC_CHECKOUT_DOMAIN: string;legendary-branding.com
  SHOP_ID: string;49013915801
}

declare module 'virtual:react-router/server-build' {
  const build: Record<string, unknown>;
  export = build;
}
