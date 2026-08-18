import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
  useLoaderData,
  useActionData,
  Link,
  useFetcher,
} from 'react-router';
import {useState} from 'react';
import Container from '~/components/ui/Container';
import Button from '~/components/ui/Button';

export const meta: MetaFunction = () => [
  {title: 'Addresses — LEGENDARY BRANDING'},
  {name: 'description', content: 'Manage your shipping addresses.'},
  {tagName: 'link', rel: 'canonical', href: 'https://legendary-branding.com/account/addresses'},
];

const ADDRESSES_QUERY = `#graphql
  query Addresses {
    customer {
      id
      defaultAddress {
        id
        firstName
        lastName
        company
        address1
        address2
        city
        province
        zip
        country
        phoneNumber
      }
      addresses(first: 10) {
        nodes {
          id
          firstName
          lastName
          company
          address1
          address2
          city
          province
          zip
          country
          phoneNumber
        }
      }
    }
  }
` as const;

const ADDRESS_CREATE_MUTATION = `#graphql
  mutation customerAddressCreate($address: CustomerAddressInput!) {
    customerAddressCreate(address: $address) {
      customerAddress {
        id
        firstName
        lastName
        company
        address1
        address2
        city
        province
        zip
        country
        phoneNumber
      }
      userErrors {
        field
        message
      }
    }
  }
` as const;

const ADDRESS_UPDATE_MUTATION = `#graphql
  mutation customerAddressUpdate($addressId: ID!, $address: CustomerAddressInput!) {
    customerAddressUpdate(addressId: $addressId, address: $address) {
      customerAddress {
        id
        firstName
        lastName
        company
        address1
        address2
        city
        province
        zip
        country
        phoneNumber
      }
      userErrors {
        field
        message
      }
    }
  }
` as const;

const ADDRESS_DELETE_MUTATION = `#graphql
  mutation customerAddressDelete($addressId: ID!) {
    customerAddressDelete(addressId: $addressId) {
      deletedAddressId
      userErrors {
        field
        message
      }
    }
  }
` as const;

interface AddressNode {
  id: string;
  firstName: string;
  lastName: string;
  company?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  province: string;
  zip: string;
  country: string;
  phoneNumber?: string | null;
}

interface ActionData {
  success?: boolean;
  errors?: string[];
  action?: string;
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

  const result = await customerAccount.query(ADDRESSES_QUERY);

  return {
    defaultAddress: result.data.customer.defaultAddress as AddressNode | null,
    addresses: result.data.customer.addresses.nodes as AddressNode[],
  };
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
  const intent = String(formData.get('intent') || '');

  // CustomerAddressInput uses zoneCode (province) + territoryCode (country code)
  const countryInput = String(formData.get('country') || '').trim();
  const territoryCode =
    countryInput.length === 2
      ? countryInput.toUpperCase()
      : countryInput.toLowerCase() === 'united states' ||
          countryInput.toLowerCase() === 'usa' ||
          countryInput.toLowerCase() === 'us'
        ? 'US'
        : countryInput.slice(0, 2).toUpperCase();

  const addressInput = {
    firstName: String(formData.get('firstName') || '').trim(),
    lastName: String(formData.get('lastName') || '').trim(),
    address1: String(formData.get('address1') || '').trim(),
    address2: String(formData.get('address2') || '').trim() || null,
    city: String(formData.get('city') || '').trim(),
    zoneCode: String(formData.get('province') || '').trim(),
    zip: String(formData.get('zip') || '').trim(),
    territoryCode,
    phoneNumber: String(formData.get('phoneNumber') || '').trim() || null,
    company: String(formData.get('company') || '').trim() || null,
  };

  if (intent === 'create') {
    const result = await customerAccount.mutate(ADDRESS_CREATE_MUTATION, {
      variables: {address: addressInput},
    });
    const data = result.data as {
      customerAddressCreate: {
        customerAddress: AddressNode | null;
        userErrors: Array<{field: string[]; message: string}>;
      };
    };
    if (data.customerAddressCreate.userErrors?.length > 0) {
      return {
        success: false,
        errors: data.customerAddressCreate.userErrors.map((e) => e.message),
        action: 'create',
      };
    }
    return {success: true, action: 'create'};
  }

  if (intent === 'update') {
    const addressId = String(formData.get('id') || '');
    const result = await customerAccount.mutate(ADDRESS_UPDATE_MUTATION, {
      variables: {addressId, address: addressInput},
    });
    const data = result.data as {
      customerAddressUpdate: {
        customerAddress: AddressNode | null;
        userErrors: Array<{field: string[]; message: string}>;
      };
    };
    if (data.customerAddressUpdate.userErrors?.length > 0) {
      return {
        success: false,
        errors: data.customerAddressUpdate.userErrors.map((e) => e.message),
        action: 'update',
      };
    }
    return {success: true, action: 'update'};
  }

  if (intent === 'delete') {
    const addressId = String(formData.get('id') || '');
    const result = await customerAccount.mutate(ADDRESS_DELETE_MUTATION, {
      variables: {addressId},
    });
    const data = result.data as {
      customerAddressDelete: {
        deletedAddressId: string | null;
        userErrors: Array<{field: string[]; message: string}>;
      };
    };
    if (data.customerAddressDelete.userErrors?.length > 0) {
      return {
        success: false,
        errors: data.customerAddressDelete.userErrors.map((e) => e.message),
        action: 'delete',
      };
    }
    return {success: true, action: 'delete'};
  }

  return {success: false, errors: ['Unknown action.']};
}

function formatAddress(addr: AddressNode) {
  const lines: string[] = [];
  lines.push(`${addr.firstName} ${addr.lastName}`);
  if (addr.company) lines.push(addr.company);
  lines.push(addr.address1);
  if (addr.address2) lines.push(addr.address2);
  lines.push(`${addr.city}, ${addr.province} ${addr.zip}`);
  lines.push(addr.country);
  return lines;
}

function AddressForm({
  address,
  onCancel,
  intent,
  submitLabel,
}: {
  address?: AddressNode;
  onCancel: () => void;
  intent: 'create' | 'update';
  submitLabel: string;
}) {
  return (
    <form method="POST" className="space-y-4 bg-[var(--color-surface)] p-6 rounded-lg">
      <input type="hidden" name="intent" value={intent} />
      {address && <input type="hidden" name="id" value={address.id} />}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-2">
            First Name
          </label>
          <input
            name="firstName"
            defaultValue={address?.firstName || ''}
            required
            className="w-full px-4 py-2.5 border border-[var(--color-border-medium)] text-sm bg-[var(--color-bg-level-1)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-2">
            Last Name
          </label>
          <input
            name="lastName"
            defaultValue={address?.lastName || ''}
            required
            className="w-full px-4 py-2.5 border border-[var(--color-border-medium)] text-sm bg-[var(--color-bg-level-1)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-2">
          Company (optional)
        </label>
        <input
          name="company"
          defaultValue={address?.company || ''}
          className="w-full px-4 py-2.5 border border-[var(--color-border-medium)] text-sm bg-[var(--color-bg-level-1)] focus:outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-2">
          Address
        </label>
        <input
          name="address1"
          defaultValue={address?.address1 || ''}
          required
          className="w-full px-4 py-2.5 border border-[var(--color-border-medium)] text-sm bg-[var(--color-bg-level-1)] focus:outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-2">
          Apartment, suite, etc. (optional)
        </label>
        <input
          name="address2"
          defaultValue={address?.address2 || ''}
          className="w-full px-4 py-2.5 border border-[var(--color-border-medium)] text-sm bg-[var(--color-bg-level-1)] focus:outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-2">
            City
          </label>
          <input
            name="city"
            defaultValue={address?.city || ''}
            required
            className="w-full px-4 py-2.5 border border-[var(--color-border-medium)] text-sm bg-[var(--color-bg-level-1)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-2">
            State / Province
          </label>
          <input
            name="province"
            defaultValue={address?.province || ''}
            required
            className="w-full px-4 py-2.5 border border-[var(--color-border-medium)] text-sm bg-[var(--color-bg-level-1)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-2">
            ZIP / Postal Code
          </label>
          <input
            name="zip"
            defaultValue={address?.zip || ''}
            required
            className="w-full px-4 py-2.5 border border-[var(--color-border-medium)] text-sm bg-[var(--color-bg-level-1)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-2">
            Country
          </label>
          <input
            name="country"
            defaultValue={address?.country || 'United States'}
            required
            className="w-full px-4 py-2.5 border border-[var(--color-border-medium)] text-sm bg-[var(--color-bg-level-1)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-2">
          Phone (optional)
        </label>
        <input
          name="phoneNumber"
          defaultValue={address?.phoneNumber || ''}
          type="tel"
          className="w-full px-4 py-2.5 border border-[var(--color-border-medium)] text-sm bg-[var(--color-bg-level-1)] focus:outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-[var(--color-border-medium)] text-sm hover:border-[var(--color-foreground)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddressCard({
  address,
  isDefault,
  onEdit,
  onDelete,
}: {
  address: AddressNode;
  isDefault: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const deleteFetcher = useFetcher();

  return (
    <div className="border border-[var(--color-border-medium)] p-6 md:p-8 bg-[var(--color-bg-level-1)]">
      {isDefault && (
        <span className="inline-block text-[10px] font-semibold tracking-widest uppercase px-3 py-1 bg-[var(--color-foreground)] text-[var(--color-text-inverse)] mb-4">
          Default
        </span>
      )}
      <div className="space-y-1 text-sm text-[var(--color-foreground)] mb-6">
        {formatAddress(address).map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="text-sm text-[var(--color-foreground)] hover:text-[var(--color-accent)] transition-colors"
        >
          Edit
        </button>
        <deleteFetcher.Form method="POST">
          <input type="hidden" name="intent" value="delete" />
          <input type="hidden" name="id" value={address.id} />
          <button
            type="submit"
            className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors"
            onClick={(e) => {
              if (!confirm('Delete this address?')) e.preventDefault();
            }}
          >
            Delete
          </button>
        </deleteFetcher.Form>
      </div>
    </div>
  );
}

export default function AddressesPage() {
  const {defaultAddress, addresses} = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const allAddresses = addresses.length > 0 ? addresses : (defaultAddress ? [defaultAddress] : []);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingAddress = allAddresses.find((a) => a.id === editingId);

  return (
    <Container className="py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <Link
            to="/account"
            className="text-xs tracking-widest uppercase text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] mb-6 inline-block"
          >
            ← Back to Account
          </Link>
          <div className="h-eyebrow mb-3">SHIPPING</div>
          <h1 className="text-4xl md:text-5xl font-normal">Addresses</h1>
        </div>

        {actionData?.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-sm text-green-800 rounded">
            {actionData.action === 'create' && 'Address added successfully.'}
            {actionData.action === 'update' && 'Address updated successfully.'}
            {actionData.action === 'delete' && 'Address deleted.'}
          </div>
        )}

        {actionData?.errors && actionData.errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-sm text-red-800 rounded">
            {actionData.errors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        )}

        {allAddresses.length === 0 && !showAddForm ? (
          <div className="text-center py-20 border border-[var(--color-border-medium)] bg-[var(--color-background)]">
            <p className="h-eyebrow mb-4 text-[var(--color-text-tertiary)]">NO ADDRESSES</p>
            <p className="text-[var(--color-text-secondary)] mb-8">
              You haven&apos;t saved any addresses yet.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="h-btn-primary"
            >
              Add Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {allAddresses.map((addr) => {
              const isDefault = addr.id === defaultAddress?.id;
              if (editingId === addr.id) {
                return (
                  <AddressForm
                    key={addr.id}
                    address={addr}
                    intent="update"
                    submitLabel="Update Address"
                    onCancel={() => setEditingId(null)}
                  />
                );
              }
              return (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  isDefault={isDefault}
                  onEdit={() => setEditingId(addr.id)}
                  onDelete={() => {}}
                />
              );
            })}

            {/* Add new address form / card */}
            {showAddForm ? (
              <AddressForm
                intent="create"
                submitLabel="Add Address"
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <div className="border border-dashed border-[var(--color-border-muted)] p-6 md:p-8 flex flex-col items-center justify-center text-center min-h-[200px] bg-[var(--color-background)]">
                <p className="h-eyebrow text-[var(--color-text-tertiary)] mb-4">NEW</p>
                <p className="text-[var(--color-text-secondary)] mb-6">Add a new shipping address</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-5 py-2.5 border border-[var(--color-foreground)] text-sm hover:bg-[var(--color-foreground)] hover:text-white transition-colors"
                >
                  + Add Address
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  );
}