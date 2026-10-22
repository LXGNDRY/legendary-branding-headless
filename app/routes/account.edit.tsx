import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
  useLoaderData,
  useActionData,
  Link,
} from 'react-router';
import {requireSameOrigin} from '~/lib/security';
import {useState} from 'react';
import Container from '~/components/ui/Container';
import Button from '~/components/ui/Button';
import {accountMeta, loadAccount, mutationErrors} from '~/lib/account';

// NOTE: private page: no canonical (that would advertise customer content as a public URL); noindex comes from accountMeta.
export const meta: MetaFunction = () => accountMeta('Edit Account', 'Update your account details.');

const MAX_NAME_LENGTH = 100;

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

const CUSTOMER_UPDATE_MUTATION = `#graphql
  mutation customerUpdate($input: CustomerUpdateInput!) {
    customerUpdate(input: $input) {
      customer {
        firstName
        lastName
        emailAddress {
          emailAddress
        }
      }
      userErrors {
        field
        message
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

interface ActionData {
  success?: boolean;
  errors?: string[];
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

  const result = await loadAccount<{customer?: CustomerData | null}>('account.edit', () => customerAccount.query(CUSTOMER_QUERY));

  return {customer: result.ok ? (result.data.customer ?? null) : null};
}

export async function action({request, context}: ActionFunctionArgs) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const {customerAccount} = context;

  if (!customerAccount) {
    throw new Response('Customer accounts are unavailable', {status: 503});
  }

  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return redirect('/account/login');
  }

  const formData = await request.formData();
  // NOTE: control characters are stripped; accents, CJK and other scripts are kept as typed.
  const clean = (key: string) => String(formData.get(key) || '').replace(/\p{Cc}/gu, ' ').trim();
  const firstName = clean('firstName');
  const lastName = clean('lastName');

  const errors: string[] = [];
  if (!firstName) errors.push('First name is required.');
  if (!lastName) errors.push('Last name is required.');
  if (firstName.length > MAX_NAME_LENGTH || lastName.length > MAX_NAME_LENGTH) errors.push('Names can be up to 100 characters.');

  if (errors.length > 0) {
    return {success: false, errors};
  }

  let result: Awaited<ReturnType<typeof customerAccount.mutate>> | undefined;
  try {
    result = await customerAccount.mutate(CUSTOMER_UPDATE_MUTATION, {
      variables: {
        input: {firstName, lastName},
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
  }

  const payload = (result?.data as {customerUpdate?: {userErrors?: Array<{message?: string | null}>} | null} | undefined)
    ?.customerUpdate;
  const failure = mutationErrors('account.edit', result, payload);
  if (failure) return {success: false, errors: failure};

  return {success: true, errors: []};
}

export default function AccountEditPage() {
  const {customer} = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const [firstName, setFirstName] = useState(customer?.firstName ?? '');
  const [lastName, setLastName] = useState(customer?.lastName ?? '');

  if (!customer) {
    return (
      <Container className="py-24">
        <div className="max-w-xl mx-auto text-center" role="alert">
          <div className="h-eyebrow mb-3">ACCOUNT DETAILS</div>
          <h1 className="text-3xl font-normal mb-4">We couldn&apos;t load your details</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8">Please try again in a moment.</p>
          <Link to="/account/edit" className="text-xs font-semibold tracking-widest uppercase underline underline-offset-4">
            Try again
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <div className="max-w-xl mx-auto">
        <div className="mb-10">
          <Link
            to="/account"
            className="text-xs tracking-widest uppercase text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] mb-6 inline-block"
          >
            ← Back to Account
          </Link>
          <div className="h-eyebrow mb-3">ACCOUNT DETAILS</div>
          <h1 className="text-4xl md:text-5xl font-normal">Edit Profile</h1>
        </div>

        {actionData?.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-sm text-green-800 rounded">
            Your details have been updated.
          </div>
        )}

        {actionData?.errors && actionData.errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-sm text-red-800 rounded">
            {actionData.errors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        )}

        <form method="POST" className="space-y-6">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"
            >
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[var(--color-border-muted)] text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors bg-[var(--color-bg-level-1)]"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"
            >
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[var(--color-border-muted)] text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors bg-[var(--color-bg-level-1)]"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={customer.emailAddress?.emailAddress ?? ''}
              disabled
              className="w-full px-4 py-3 border border-[var(--color-border-muted)] text-sm bg-[var(--color-bg-level-1)] text-[var(--color-text-secondary)] cursor-not-allowed"
            />
            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
              Email cannot be changed from here.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
            <Link to="/account">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </Container>
  );
}
