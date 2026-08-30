import {redirect, type LoaderFunctionArgs, type MetaFunction} from 'react-router';

export const meta: MetaFunction = () => [
  {title: 'Login | LEGENDARY BRANDING'},
  {name: 'description', content: 'Sign in to your Legendary Branding account.'},
];

/**
 * Login loader — starts the OAuth PKCE login flow.
 * Redirects to Shopify's Customer Account API login page.
 */
export async function loader({context}: LoaderFunctionArgs) {
  const {customerAccount} = context;

  if (!customerAccount) {
    throw new Response('Customer accounts are unavailable', {status: 503});
  }

  // If already logged in, go to account dashboard
  const isLoggedIn = await customerAccount.isLoggedIn();
  if (isLoggedIn) {
    return redirect('/account');
  }

  // Start OAuth login flow — customerAccount.login() returns a Response
  // that redirects to the Shopify login page
  return customerAccount.login();
}

export default function Login() {
  return null;
}
