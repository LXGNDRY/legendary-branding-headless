import {Link, redirect, useLoaderData, type LoaderFunctionArgs, type MetaFunction} from 'react-router';
import Container from '~/components/ui/Container';
import {accountMeta} from '~/lib/account';

export const meta: MetaFunction = () => accountMeta('Login', 'Sign in to your Legendary Branding account.');

/**
 * Login loader — starts the OAuth PKCE login flow.
 * Redirects to Shopify's Customer Account API login page.
 *
 * When the callback failed it comes back here with ?error=auth_failed. Restarting the flow automatically would
 * loop (login, callback fails, login, ...), so that case stops and offers a manual retry instead.
 */
export async function loader({request, context}: LoaderFunctionArgs) {
  const {customerAccount} = context;

  if (!customerAccount) {
    throw new Response('Customer accounts are unavailable', {status: 503});
  }

  // If already logged in, go to account dashboard
  const isLoggedIn = await customerAccount.isLoggedIn();
  if (isLoggedIn) {
    return redirect('/account');
  }

  if (new URL(request.url).searchParams.get('error') === 'auth_failed') {
    return {authFailed: true};
  }

  // Start OAuth login flow — customerAccount.login() returns a Response
  // that redirects to the Shopify login page
  return customerAccount.login();
}

export default function Login() {
  const data = useLoaderData<typeof loader>() as {authFailed?: boolean} | undefined;
  if (!data?.authFailed) return null;
  return (
    <Container className="py-24">
      <div className="max-w-xl mx-auto text-center" role="alert">
        <div className="h-eyebrow mb-3">SIGN IN</div>
        <h1 className="text-3xl font-normal mb-4">We couldn&apos;t sign you in</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
          The sign-in didn&apos;t complete. This can happen if the page was open for a long time. Please try again.
        </p>
        <Link to="/account/login" reloadDocument className="text-xs font-semibold tracking-widest uppercase underline underline-offset-4">
          Try again
        </Link>
      </div>
    </Container>
  );
}
