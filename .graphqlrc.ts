import type {IGraphQLConfig} from 'graphql-config';

export default {
  projects: {
    default: {
      schema: 'node_modules/@shopify/hydrogen/dist/storefront.schema.json',
      documents: [
        'app/**/*.{ts,tsx}',
        '!app/graphql/**',
        '!app/routes/account.*.{ts,tsx}',
        '!app/routes/account.{ts,tsx}',
        '!app/routes/api.wishlist.ts',
      ],
      extensions: {
        codegen: {
          generates: {
            './storefrontapi.generated.d.ts': {
              plugins: ['@shopify/hydrogen-codegen'],
            },
          },
        },
      },
    },
    customer: {
      schema: 'node_modules/@shopify/hydrogen/dist/customer-account.schema.json',
      documents: ['app/routes/account.*.{ts,tsx}', 'app/routes/account.{ts,tsx}', 'app/routes/api.wishlist.ts'],
      extensions: {
        codegen: {
          generates: {
            './customeraccountapi.generated.d.ts': {
              plugins: ['@shopify/hydrogen-codegen'],
            },
          },
        },
      },
    },
  },
} satisfies IGraphQLConfig;
