import type {IGraphQLConfig} from 'graphql-config';

export default {
  projects: {
    default: {
      schema: 'node_modules/@shopify/hydrogen/storefront.schema.json',
      documents: ['app/**/*.{ts,tsx}', '!app/graphql/**'],
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
  },
} satisfies IGraphQLConfig;
