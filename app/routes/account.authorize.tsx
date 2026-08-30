import {redirect, type LoaderFunctionArgs, type MetaFunction} from 'react-router';

export const meta: MetaFunction = () => [
  {title: 'Authorizing | LEGENDARY BRANDING'},
];

/**
 * OAuth PKCE callback handler.
 *
 * Shopify's Customer Account API redirects back here after login/register.
 * customerAccount.authorize() handles the full PKCE code exchange
 * and stores tokens in the session.
 */
export async function loader({context}: LoaderFunctionArgs) {
  const {customerAccount} = context;

  if (!customerAccount) {
    throw new Response('Customer accounts are unavailable', {status: 503});
  }

  try {
    // authorize() validates the OAuth response, exchanges the auth code
    // for tokens, persists them in the session, and returns a redirect
    // Response to the post-login URL (default: /account)
    return customerAccount.authorize();
  } catch (error) {
    console.error('Auth callback error:', error);
    return redirect('/account/login?error=auth_failed');
  }
}

export default function Authorize() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="text-center">
        <p className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-[var(--color-text-secondary)] mb-4">
          AUTHORIZING
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">Signing you in...</p>
      </div>
    </div>
  );
}
