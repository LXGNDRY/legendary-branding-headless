import {
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
  Link,
} from 'react-router';
import Container from '~/components/ui/Container';
import Button from '~/components/ui/Button';
import {accountMeta, loadAccount} from '~/lib/account';
import LogoutForm from '~/components/ui/LogoutForm';

export const meta: MetaFunction = () => accountMeta('My Account', 'Your Legendary Branding account dashboard.');

const CUSTOMER_QUERY = `#graphql
  query Customer {
    customer {
      firstName
      lastName
      emailAddress {
        emailAddress
      }
    }
  }
` as const;

interface CustomerData {
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: {
    emailAddress?: string | null;
  } | null;
}

export async function loader({context}: LoaderFunctionArgs) {
  const {customerAccount} = context;

  if (!customerAccount) {
    throw new Response('Customer accounts are unavailable', {status: 503});
  }

  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return redirect('/account/login');
  }

  const result = await loadAccount<{customer?: CustomerData | null}>('account', () => customerAccount.query(CUSTOMER_QUERY));

  return {customer: result.ok ? (result.data.customer ?? null) : null};
}

export default function AccountPage() {
  const {customer} = useLoaderData<typeof loader>();

  if (!customer) {
    return (
      <Container className="py-24">
        <div className="max-w-xl mx-auto text-center" role="alert">
          <div className="h-eyebrow mb-3">MY ACCOUNT</div>
          <h1 className="text-3xl font-normal mb-4">We couldn&apos;t load your details</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8">Please try again in a moment.</p>
          <Link to="/account" className="text-xs font-semibold tracking-widest uppercase underline underline-offset-4">
            Try again
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="h-eyebrow mb-3">MY ACCOUNT</div>
          <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-normal mb-3 text-[var(--color-text-primary)] leading-tight">
            {customer.firstName ? `Hey, ${customer.firstName}` : 'Hey there'}
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm">
            Welcome back to your account dashboard.
          </p>
        </div>

        {/* Account Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
          <div className="border border-[var(--color-border-muted)] bg-[var(--color-bg-level-1)] rounded-lg p-8">
            <div className="h-eyebrow mb-3 text-[var(--color-text-tertiary)]">ORDERS</div>
            <h2 className="font-serif text-2xl font-normal mb-2 text-[var(--color-text-primary)]">View History</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">See all your past orders.</p>
            <Button as="link" to="/account/orders" variant="outline" size="sm">View Orders</Button>
          </div>

          <div className="border border-[var(--color-border-muted)] bg-[var(--color-bg-level-1)] rounded-lg p-8">
            <div className="h-eyebrow mb-3 text-[var(--color-text-tertiary)]">DETAILS</div>
            <h2 className="font-serif text-2xl font-normal mb-2 text-[var(--color-text-primary)]">Account Details</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">
              {[customer.firstName, customer.lastName].filter(Boolean).join(' ')}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              {customer.emailAddress?.emailAddress}
            </p>
            <Button as="link" to="/account/edit" variant="outline" size="sm">Edit Details</Button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="border-t border-[var(--color-border-muted)] pt-12">
          <div className="h-eyebrow mb-6 text-[var(--color-text-tertiary)]">QUICK LINKS</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/account/orders"
              className="text-sm font-semibold tracking-[0.08em] uppercase text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
            >
              Orders
            </Link>
            <Link
              to="/account/addresses"
              className="text-sm font-semibold tracking-[0.08em] uppercase text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
            >
              Addresses
            </Link>
            <Link
              to="/account/edit"
              className="text-sm font-semibold tracking-[0.08em] uppercase text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
            >
              Account
            </Link>
            <LogoutForm
              label="Logout"
              className="text-sm font-semibold tracking-[0.08em] uppercase text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
