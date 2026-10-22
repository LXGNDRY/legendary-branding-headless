// NOTE: keep in sync with scripts/validate-release-env.mjs (release.test.ts enforces it).
export const RELEASE_ENVIRONMENT_VARIABLES = [
  'SESSION_SECRET',
  'PUBLIC_STORE_DOMAIN',
  'PUBLIC_STOREFRONT_API_TOKEN',
  'PUBLIC_STOREFRONT_ID',
  'PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID',
  'PUBLIC_CUSTOMER_ACCOUNT_API_URL',
] as const;

export type ReleaseStatus = {
  ok: boolean;
  /** Commit the deployed worker was built from (build-time), or "unknown" for local builds. */
  sha: string;
  /** How many contract variables are absent at runtime. Names are never reported (they go to the server log). */
  missing: number;
};

export function releaseStatus(
  env: Record<string, unknown>,
  sha: string | undefined,
): {status: ReleaseStatus; missingNames: string[]} {
  const missingNames = RELEASE_ENVIRONMENT_VARIABLES.filter((name) => {
    const value = env[name];
    return typeof value !== 'string' || value.trim().length === 0;
  });
  const clean = typeof sha === 'string' && /^[0-9a-f]{7,40}$/i.test(sha) ? sha.toLowerCase() : 'unknown';
  return {
    status: {ok: missingNames.length === 0, sha: clean, missing: missingNames.length},
    missingNames,
  };
}
