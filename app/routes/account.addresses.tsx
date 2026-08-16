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
  {title: 'Addresses — LEGENDARY BRANDING'},
  {name: 'description', content: 'Manage your shipping addresses.'},
];

const ADDRESSES_QUERY = `#graphql
  query Addresses {
    customer {
      id
      defaultAddress {
        id
        firstName
        lastName
        address1
        address2
        city
        province
        country
        zip
        phoneNumber
        company
      }
      addresses(first: 10) {
        nodes {
          id
          firstName
          lastName
          address1
          address2
          city
          province
          country
          zip
          phoneNumber
          company
        }
      }
    }
  }
` as const;

interface AddressNode {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string | null;
  city: string;
  province: string;
  country: string;
  zip: string;
  phoneNumber?: string | null;
  company?: string | null;
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

export default function AddressesPage() {
  const {defaultAddress, addresses} = useLoaderData<typeof loader>();
  const allAddresses = addresses.length > 0 ? addresses : (defaultAddress ? [defaultAddress] : []);

  return (
    <Container className="py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <Link
            to="/account"
            className="text-xs tracking-widest uppercase text-black/50 hover:text-black mb-6 inline-block"
          >
            ← Back to Account
          </Link>
          <div className="lb-eyebrow mb-3">SHIPPING</div>
          <h1 className="text-4xl md:text-5xl font-normal">Addresses</h1>
        </div>

        {allAddresses.length === 0 ? (
          <div className="text-center py-20 border border-black/10">
            <p className="lb-eyebrow mb-4 text-black/40">NO ADDRESSES</p>
            <p className="text-black/60 mb-8">
              You haven't saved any addresses yet.
            </p>
            <Button variant="solid">Add Address</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allAddresses.map((addr) => {
              const isDefault = addr.id === defaultAddress?.id;
              return (
                <div
                  key={addr.id}
                  className="border border-black/10 p-6 md:p-8"
                >
                  {isDefault && (
                    <span className="inline-block text-[10px] font-semibold tracking-widest uppercase px-3 py-1 bg-black text-white mb-4">
                      Default
                    </span>
                  )}
                  <div className="space-y-1 text-sm mb-6">
                    {formatAddress(addr).map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">Edit</Button>
                    <button className="text-sm text-black/50 hover:text-black transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add new address card */}
            <div className="border border-dashed border-black/20 p-6 md:p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <p className="lb-eyebrow text-black/40 mb-4">NEW</p>
              <p className="text-black/60 mb-6">Add a new shipping address</p>
              <Button variant="outline" size="sm">
                + Add Address
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
