import {redirect, type LoaderFunctionArgs, type MetaFunction} from 'react-router';

export const meta: MetaFunction = () => [
  {title: 'Register | LEGENDARY BRANDING'},
  {name: 'description', content: 'Create your Legendary Branding account.'},
];

/**
 * Register loader — starts the OAuth PKCE register flow.
 * Redirects to Shopify's Customer Account API registration page.
 *
 * Note: Hydrogen's customerAccount.login() accepts a uiLocales param but
 * doesn't have a separate register URL. The login page includes a register
 * link, and we can optionally pre-fill the register tab. For now, we
 * redirect to login which has a "Create account" link.
 */
export async function loader({context}: LoaderFunctionArgs) {
  const {customerAccount} = context;

  if (!customerAccount) {
    throw new Response('Customer accounts are unavailable', {status: 503});
  }

  const isLoggedIn = await customerAccount.isLoggedIn();
  if (isLoggedIn) {
    return redirect('/account');
  }

  // Login page includes registration option
  return customerAccount.login();
}

export default function Register() {
  return null;
}
