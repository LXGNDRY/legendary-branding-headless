import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
  useLoaderData,
  useActionData,
  Link,
} from 'react-router';
import {useState} from 'react';
import Container from '~/components/ui/Container';
import Button from '~/components/ui/Button';

export const meta: MetaFunction = () => [
  {title: 'Edit Account — LEGENDARY BRANDING'},
  {name: 'description', content: 'Update your account details.'},
  {tagName: 'link', rel: 'canonical', href: 'https://legendary-branding.com/account/edit'},
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
  firstName: string;
  lastName: string;
  emailAddress: {
    emailAddress: string;
  };
}

interface ActionData {
  success?: boolean;
  errors?: string[];
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

export async function action({request, context}: ActionFunctionArgs) {
  const {customerAccount} = context;

  if (!customerAccount) {
    return redirect('/');
  }

  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return redirect('/account/login');
  }

  const formData = await request.formData();
  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim();

  const errors: string[] = [];
  if (!firstName) errors.push('First name is required.');
  if (!lastName) errors.push('Last name is required.');

  if (errors.length > 0) {
    return {success: false, errors};
  }

  const result = await customerAccount.mutate(CUSTOMER_UPDATE_MUTATION, {
    variables: {
      input: {firstName, lastName},
    },
  });

  const data = result.data as {
    customerUpdate: {
      customer: CustomerData | null;
      userErrors: Array<{field: string[]; message: string}>;
    };
  };

  if (data.customerUpdate.userErrors?.length > 0) {
    return {
      success: false,
      errors: data.customerUpdate.userErrors.map((e) => e.message),
    };
  }

  return {success: true, errors: []};
}

export default function AccountEditPage() {
  const {customer} = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const [firstName, setFirstName] = useState(customer.firstName);
  const [lastName, setLastName] = useState(customer.lastName);

  return (
    <Container className="py-16">
      <div className="max-w-xl mx-auto">
        <div className="mb-10">
          <Link
            to="/account"
            className="text-xs tracking-widest uppercase text-black/50 hover:text-black mb-6 inline-block"
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
              className="block text-sm font-medium text-black mb-2"
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
              className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black transition-colors bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-black mb-2"
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
              className="w-full px-4 py-3 border border-black/10 text-sm focus:outline-none focus:border-black transition-colors bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-black mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={customer.emailAddress.emailAddress}
              disabled
              className="w-full px-4 py-3 border border-black/10 text-sm bg-black/5 text-black/50 cursor-not-allowed"
            />
            <p className="mt-2 text-xs text-black/40">
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
