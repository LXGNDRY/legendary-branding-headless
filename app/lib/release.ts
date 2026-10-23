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

export const RELEASE_PROBE_PATH = '/api/release';

/**
 * Answers GET /api/release straight from the raw worker env so it still works when context construction would
 * throw on a missing variable. Returns null for any other request.
 */
export function releaseProbe(
  request: Request,
  env: Record<string, unknown>,
  sha: string | undefined,
): {response: Response; failure: string | null} | null {
  if (new URL(request.url).pathname !== RELEASE_PROBE_PATH) return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return {response: new Response(null, {status: 405, headers: {Allow: 'GET, HEAD'}}), failure: null};
  }
  const {status, missingNames} = releaseStatus(env, sha);
  const response = Response.json(status, {
    status: status.ok ? 200 : 503,
    headers: {'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex'},
  });
  return {
    response,
    failure: status.ok ? null : `Release contract incomplete at runtime: ${missingNames.join(', ')}`,
  };
}
