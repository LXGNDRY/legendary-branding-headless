import {redirect, type ActionFunctionArgs, type MetaFunction} from 'react-router';
import {accountMeta} from '~/lib/account';
import {requireSameOrigin} from '~/lib/security';

export const meta: MetaFunction = () => accountMeta('Logout');

/**
 * Signing out is a state change, so only a same-origin POST does it. A GET (a link, an image tag, a
 * prefetch on another site) just goes back to the account page and leaves the session alone.
 */
export function loader() {
  return redirect('/account');
}

export async function action({request, context}: ActionFunctionArgs) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const {customerAccount} = context;
  if (!customerAccount) return redirect('/');

  return customerAccount.logout({postLogoutRedirectUri: '/'});
}

export default function Logout() {
  return null;
}
