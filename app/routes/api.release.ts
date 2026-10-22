import type {LoaderFunctionArgs} from 'react-router';
import {releaseStatus} from '~/lib/release';
import {captureMessage} from '~/lib/monitoring';

/**
 * Deploy-verification endpoint: reports the built commit and whether the runtime environment satisfies the
 * release contract. Presence/shape only — no variable names or values are returned.
 */
export async function loader({context}: LoaderFunctionArgs) {
  const env = (context as unknown as {env: Record<string, unknown>}).env ?? {};
  const {status, missingNames} = releaseStatus(env, import.meta.env.VITE_RELEASE_SHA);
  if (!status.ok) captureMessage(`Release contract incomplete at runtime: ${missingNames.join(', ')}`, 'error');
  return Response.json(status, {
    status: status.ok ? 200 : 503,
    headers: {'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex'},
  });
}
