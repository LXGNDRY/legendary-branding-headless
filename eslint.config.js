/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      '.react-router/**',
      'build/**',
      'dist/**',
      'node_modules/**',
      '*.generated.d.ts',
      'storefrontapi.generated.d.ts',
      'customer-accountapi.generated.d.ts',
    ],
  },
];
