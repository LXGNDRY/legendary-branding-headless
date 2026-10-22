import {isRouteErrorResponse, Link, Outlet, useRouteError, type MetaFunction} from 'react-router';
import Container from '~/components/ui/Container';
import {accountMeta} from '~/lib/account';

export const meta: MetaFunction = () => accountMeta('My Account');

export default function AccountLayout() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const unavailable = isRouteErrorResponse(error) && error.status === 503;
  return (
    <Container className="py-24">
      <div className="max-w-xl mx-auto text-center" role="alert">
        <div className="h-eyebrow mb-3">MY ACCOUNT</div>
        <h1 className="text-3xl font-normal mb-4">
          {unavailable ? 'Accounts are temporarily unavailable' : "We couldn't load your account"}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
          {unavailable
            ? 'Please try again in a little while. You can keep shopping and check out as a guest.'
            : 'Something went wrong on our side. Please try again.'}
        </p>
        <Link to="/" className="text-xs font-semibold tracking-widest uppercase underline underline-offset-4">
          Back to the store
        </Link>
      </div>
    </Container>
  );
}
