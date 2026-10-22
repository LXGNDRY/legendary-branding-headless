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
import {requireSameOrigin} from '~/lib/security';
import {getCountryOptions} from '~/lib/market';
import {useId, useMemo, useState} from 'react';
import Container from '~/components/ui/Container';
import Button from '~/components/ui/Button';
import {
  ACCOUNT_PAGE_SIZE,
  ADDRESS_ZONES,
  accountMeta,
  isAddressId,
  loadAccount,
  mutationErrors,
  parseAddressForm,
  parseAfterCursor,
} from '~/lib/account';

// NOTE: private page: no canonical (that would advertise customer content as a public URL); noindex comes from accountMeta.
export const meta: MetaFunction = () => accountMeta('Addresses', 'Manage your shipping addresses.');

const ADDRESSES_QUERY = `#graphql
  query Addresses($first: Int!, $after: String) {
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
        territoryCode
        zoneCode
        phoneNumber
      }
      addresses(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
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
          territoryCode
          zoneCode
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
        territoryCode
        zoneCode
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
        territoryCode
        zoneCode
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
  province?: string | null;
  zip: string;
  country?: string | null;
  territoryCode?: string | null;
  zoneCode?: string | null;
  phoneNumber?: string | null;
}

interface ActionData {
  success?: boolean;
  errors?: string[];
  action?: string;
}

export async function loader({request, context}: LoaderFunctionArgs) {
  const {customerAccount} = context;

  if (!customerAccount) {
    throw new Response('Customer accounts are unavailable', {status: 503});
  }

  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return redirect('/account/login');
  }

  const after = parseAfterCursor(new URL(request.url));
  const result = await loadAccount<{
    customer?: {
      defaultAddress?: AddressNode | null;
      addresses?: {nodes?: AddressNode[] | null; pageInfo?: {hasNextPage: boolean; endCursor?: string | null} | null} | null;
    } | null;
  }>('account.addresses', () => customerAccount.query(ADDRESSES_QUERY, {variables: {first: ACCOUNT_PAGE_SIZE, after}}));

  if (!result.ok || !result.data.customer) {
    return {failed: true as const, defaultAddress: null, addresses: [] as AddressNode[], nextCursor: null, isFirstPage: !after};
  }

  const {defaultAddress, addresses} = result.data.customer;
  return {
    failed: false as const,
    defaultAddress: defaultAddress ?? null,
    addresses: addresses?.nodes ?? [],
    nextCursor: addresses?.pageInfo?.hasNextPage ? (addresses.pageInfo.endCursor ?? null) : null,
    isFirstPage: !after,
  };
}

type Mutated = Awaited<ReturnType<NonNullable<ActionFunctionArgs['context']['customerAccount']>['mutate']>>;

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
  const intent = String(formData.get('intent') || '');

  // NOTE: a thrown API failure becomes a message; only a redirect Response (expired session) passes through.
  const run = async (query: string, variables: Record<string, unknown>): Promise<Mutated | undefined> => {
    try {
      return await customerAccount.mutate(query, {variables});
    } catch (error) {
      if (error instanceof Response) throw error;
      return undefined;
    }
  };

  if (intent === 'create' || intent === 'update') {
    const parsed = parseAddressForm(formData);
    if (!parsed.ok) return {success: false, errors: parsed.errors, action: intent};

    if (intent === 'create') {
      const result = await run(ADDRESS_CREATE_MUTATION, {address: parsed.input});
      const payload = (result?.data as {customerAddressCreate?: {userErrors?: Array<{message?: string | null}>} | null} | undefined)
        ?.customerAddressCreate;
      const failure = mutationErrors('account.addresses.create', result, payload);
      return failure ? {success: false, errors: failure, action: 'create'} : {success: true, action: 'create'};
    }

    const addressId = String(formData.get('id') || '');
    if (!isAddressId(addressId)) return {success: false, errors: ['That address could not be found.'], action: 'update'};
    const result = await run(ADDRESS_UPDATE_MUTATION, {addressId, address: parsed.input});
    const payload = (result?.data as {customerAddressUpdate?: {userErrors?: Array<{message?: string | null}>} | null} | undefined)
      ?.customerAddressUpdate;
    const failure = mutationErrors('account.addresses.update', result, payload);
    return failure ? {success: false, errors: failure, action: 'update'} : {success: true, action: 'update'};
  }

  if (intent === 'delete') {
    const addressId = String(formData.get('id') || '');
    if (!isAddressId(addressId)) return {success: false, errors: ['That address could not be found.'], action: 'delete'};
    const result = await run(ADDRESS_DELETE_MUTATION, {addressId});
    const payload = (result?.data as {customerAddressDelete?: {userErrors?: Array<{message?: string | null}>} | null} | undefined)
      ?.customerAddressDelete;
    const failure = mutationErrors('account.addresses.delete', result, payload);
    return failure ? {success: false, errors: failure, action: 'delete'} : {success: true, action: 'delete'};
  }

  return {success: false, errors: ['Unknown action.']};
}

function formatAddress(addr: AddressNode) {
  const lines: string[] = [];
  lines.push(`${addr.firstName} ${addr.lastName}`);
  if (addr.company) lines.push(addr.company);
  lines.push(addr.address1);
  if (addr.address2) lines.push(addr.address2);
  lines.push([addr.city, addr.province].filter(Boolean).join(', ') + ` ${addr.zip}`);
  if (addr.country) lines.push(addr.country);
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
  const formId = useId();
  // NOTE: the saved ISO code is authoritative; the old display-name reversal silently defaulted to US.
  const savedCountry = (address?.territoryCode ?? '').toUpperCase();
  const [countryCode, setCountryCode] = useState(savedCountry || 'US');
  const countryOptions = useMemo(() => {
    const options = getCountryOptions();
    // A saved address in a country outside the selectable list keeps its country instead of being replaced.
    return !savedCountry || options.some((c) => c.code === savedCountry)
      ? options
      : [{code: savedCountry as (typeof options)[number]['code'], name: address?.country || savedCountry}, ...options];
  }, [savedCountry, address?.country]);
  const zones = ADDRESS_ZONES[countryCode];

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
          <label
            htmlFor={`${formId}-province`}
            className="block text-xs font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-2"
          >
            {zones ? 'State / Province' : 'Region code (optional)'}
          </label>
          {zones ? (
            <select
              id={`${formId}-province`}
              name="province"
              key={countryCode}
              defaultValue={countryCode === savedCountry ? (address?.zoneCode ?? '') : ''}
              required
              className="w-full px-4 py-2.5 border border-[var(--color-border-medium)] text-sm bg-[var(--color-bg-level-1)] focus:outline-none focus:border-[var(--color-accent)]"
            >
              <option value="">Select…</option>
              {zones.map((zone) => (
                <option key={zone.code} value={zone.code}>
                  {zone.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={`${formId}-province`}
              name="province"
              key={countryCode}
              defaultValue={countryCode === savedCountry ? (address?.zoneCode ?? '') : ''}
              maxLength={3}
              autoCapitalize="characters"
              className="w-full px-4 py-2.5 border border-[var(--color-border-medium)] text-sm bg-[var(--color-bg-level-1)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          )}
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
          <label
            htmlFor={`${formId}-country`}
            className="block text-xs font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-2"
          >
            Country
          </label>
          <select
            id={`${formId}-country`}
            name="country"
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value)}
            required
            className="w-full px-4 py-2.5 border border-[var(--color-border-medium)] text-sm bg-[var(--color-bg-level-1)] focus:outline-none focus:border-[var(--color-accent)]"
          >
            {countryOptions.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
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
}: {
  address: AddressNode;
  isDefault: boolean;
  onEdit: () => void;
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
  const {failed, defaultAddress, addresses, nextCursor, isFirstPage} = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  // The default address leads the first page even when it is not among the first ten.
  const allAddresses =
    isFirstPage && defaultAddress && !addresses.some((a) => a.id === defaultAddress.id)
      ? [defaultAddress, ...addresses]
      : addresses;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

        {failed ? (
          <div className="text-center py-20 border border-[var(--color-border-medium)]" role="alert">
            <p className="h-eyebrow mb-4 text-[var(--color-text-tertiary)]">COULDN&apos;T LOAD ADDRESSES</p>
            <p className="text-[var(--color-text-secondary)] mb-8">Please try again in a moment.</p>
            <Link to="/account/addresses" className="text-xs font-semibold tracking-widest uppercase underline underline-offset-4">
              Try again
            </Link>
          </div>
        ) : allAddresses.length === 0 && !showAddForm ? (
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

        {!failed && (nextCursor || !isFirstPage) && (
          <nav aria-label="Address pages" className="mt-4 flex items-center justify-between text-xs font-semibold tracking-widest uppercase">
            {isFirstPage ? (
              <span />
            ) : (
              <Link to="/account/addresses" className="underline underline-offset-4">
                ← First addresses
              </Link>
            )}
            {nextCursor && (
              <Link to={`/account/addresses?after=${encodeURIComponent(nextCursor)}`} className="underline underline-offset-4">
                More addresses →
              </Link>
            )}
          </nav>
        )}
      </div>
    </Container>
  );
}
