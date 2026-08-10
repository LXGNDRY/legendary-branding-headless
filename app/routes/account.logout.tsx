import {redirect, type LoaderFunctionArgs, type MetaFunction} from 'react-router';

export const meta: MetaFunction = () => [
  {title: 'Logout — LEGENDARY BRANDING'},
];

/**
 * Logout loader — clears customer session and redirects to home.
 */
export async function loader({context}: LoaderFunctionArgs) {
  const {customerAccount} = context;

  if (customerAccount) {
    return customerAccount.logout({
      postLogoutRedirectUri: '/',
    });
  }

  return redirect('/');
}

export default function Logout() {
  return null;
}
