import {Outlet, type MetaFunction} from 'react-router';

export const meta: MetaFunction = () => [
  {name: 'robots', content: 'noindex, nofollow'},
];

export default function AccountLayout() {
  return <Outlet />;
}
