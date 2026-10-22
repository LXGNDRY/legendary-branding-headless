import type {IGraphQLConfig} from 'graphql-config';
import {getSchema} from '@shopify/hydrogen-codegen';

export default {
  projects: {
    default: {
      schema: getSchema('storefront'),
      documents: [
        'app/**/*.{ts,tsx}',
        '!app/graphql/**',
        '!app/routes/account.*.{ts,tsx}',
        '!app/routes/account.{ts,tsx}',
        '!app/routes/api.wishlist.ts',
      ],
    },
    customer: {
      schema: getSchema('customer-account'),
      documents: [
        'app/routes/account.*.{ts,tsx}',
        'app/routes/account.{ts,tsx}',
        'app/routes/api.wishlist.ts',
      ],
    },
  },
} satisfies IGraphQLConfig;
