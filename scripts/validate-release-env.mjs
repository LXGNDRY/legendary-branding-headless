export const RELEASE_ENVIRONMENT_VARIABLES = [
  'SESSION_SECRET',
  'PUBLIC_STORE_DOMAIN',
  'PUBLIC_STOREFRONT_API_TOKEN',
  'PUBLIC_STOREFRONT_ID',
  'PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID',
  'PUBLIC_CUSTOMER_ACCOUNT_API_URL',
];

// Klaviyo isn't live yet -- not required for a release to ship. The app
// already degrades gracefully without these (see app/routes/api.waitlist.ts
// and app/routes/api.newsletter.ts), returning a clear 503/no-op rather than
// crashing, so gate the release on them once Klaviyo is actually turned on.
//
// Same reasoning for PUBLIC_CHECKOUT_DOMAIN (app/routes/[robots.txt].ts and
// [sitemap.xml].tsx fall back cleanly without it) and PUBLIC_GA4_MEASUREMENT_ID
// (app/root.tsx passes it through as `|| undefined`, and Analytics.tsx simply
// doesn't load the GA4 pixel when unset) -- per explicit owner request, these
// shouldn't gate a release either. Add them back once real values are set.
//
// PRIVATE_ANTHROPIC_API_KEY (AI chat widget) is the same shape: app/routes/
// api.chat.ts returns a clean 503 ("Chat is temporarily unavailable") rather
// than crashing when it's unset, so it doesn't gate a release either.

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
