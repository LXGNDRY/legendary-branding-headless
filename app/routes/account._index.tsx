import {
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
  Link,
} from 'react-router';
import Container from '~/components/ui/Container';
import Button from '~/components/ui/Button';

export const meta: MetaFunction = () => [
  {title: 'My Account — LEGENDARY BRANDING'},
  {name: 'description', content: 'Your Legendary Branding account dashboard.'},
];

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
  firstName: string;
  lastName: string;
  emailAddress: {
    emailAddress: string;
  };
}

export async function loader({context}: LoaderFunctionArgs) {
  const {customerAccount} = context;

  if (!customerAccount) {
    return redirect('/');
  }

  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return redirect('/account/login');
  }

  const result = await customerAccount.query(CUSTOMER_QUERY);

  return {customer: result.data.customer as CustomerData};
}

export default function AccountPage() {
  const {customer} = useLoaderData<typeof loader>();

  return (
    <Container className="py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="h-eyebrow mb-3">MY ACCOUNT</div>
          <h1 className="text-4xl md:text-5xl font-normal mb-4">
            Hey, {customer.firstName}
          </h1>
          <p className="text-black/60 text-sm">
            Welcome back to your account dashboard.
          </p>
        </div>

        {/* Account Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="border border-black/10 p-8">
            <div className="h-eyebrow mb-3 text-black/50">ORDERS</div>
            <h3 className="text-2xl mb-2">View History</h3>
            <p className="text-sm text-black/60 mb-6">See all your past orders.</p>
            <Link to="/account/orders">
              <Button variant="outline" size="sm">
                View Orders
              </Button>
            </Link>
          </div>

          <div className="border border-black/10 p-8">
            <div className="h-eyebrow mb-3 text-black/50">DETAILS</div>
            <h3 className="text-2xl mb-2">Account Details</h3>
            <p className="text-sm text-black/60 mb-2">
              {customer.firstName} {customer.lastName}
            </p>
            <p className="text-sm text-black/60 mb-6">
              {customer.emailAddress.emailAddress}
            </p>
            <Link to="/account/edit">
              <Button variant="outline" size="sm">
                Edit Details
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="border-t border-black/10 pt-12">
          <div className="h-eyebrow mb-6">QUICK LINKS</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/account/orders"
              className="text-sm font-medium tracking-wide uppercase hover:opacity-60 transition-opacity"
            >
              Orders
            </Link>
            <Link
              to="/account/addresses"
              className="text-sm font-medium tracking-wide uppercase hover:opacity-60 transition-opacity"
            >
              Addresses
            </Link>
            <Link
              to="/account/edit"
              className="text-sm font-medium tracking-wide uppercase hover:opacity-60 transition-opacity"
            >
              Account
            </Link>
            <a
              href="/account/logout"
              className="text-sm font-medium tracking-wide uppercase hover:opacity-60 transition-opacity"
            >
              Logout
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}
