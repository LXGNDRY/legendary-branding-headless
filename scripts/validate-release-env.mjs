export const RELEASE_ENVIRONMENT_VARIABLES = [
  'SESSION_SECRET',
  'PUBLIC_STORE_DOMAIN',
  'PUBLIC_STOREFRONT_API_TOKEN',
  'PUBLIC_STOREFRONT_ID',
  'PUBLIC_CHECKOUT_DOMAIN',
  'PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID',
  'PUBLIC_CUSTOMER_ACCOUNT_API_URL',
  'PUBLIC_GA4_MEASUREMENT_ID',
  'PRIVATE_KLAVIYO_API_KEY',
  'PUBLIC_KLAVIYO_LIST_ID',
  'PUBLIC_KLAVIYO_WAITLIST_LIST_ID',
];

export function missingReleaseEnvironment(environment = process.env) {
  return RELEASE_ENVIRONMENT_VARIABLES.filter((name) => {
    const value = environment[name];
    return typeof value !== 'string' || value.trim().length === 0;
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const missing = missingReleaseEnvironment();
  if (missing.length) {
    for (const name of missing) process.stderr.write(`::error::Missing release configuration: ${name}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write('Release environment contract is complete.\n');
  }
}
