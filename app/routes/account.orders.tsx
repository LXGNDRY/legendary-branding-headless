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
  {title: 'Orders — LEGENDARY BRANDING'},
  {name: 'description', content: 'Your order history.'},
];

const ORDERS_QUERY = `#graphql
  query Orders($first: Int!, $after: String) {
    customer {
      orders(first: $first, after: $after, reverse: true) {
        nodes {
          id
          name
          number
          processedAt
          statusPageUrl
          totalPrice {
            amount
            currencyCode
          }
          lineItems(first: 5) {
            nodes {
              image {
                url
                altText
                width
                height
              }
              title
              variantTitle
              quantity
            }
          }
          fulfillments(first: 3) {
            nodes {
              status
              trackingInformation {
                company
                number
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
` as const;

interface OrderNode {
  id: string;
  name: string;
  number: number;
  processedAt: string;
  statusPageUrl: string;
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
  lineItems: {
    nodes: Array<{
      image?: {url: string; altText?: string | null; width?: number; height?: number};
      title: string;
      variantTitle?: string | null;
      quantity: number;
    }>;
  };
  fulfillments: {
    nodes: Array<{
      status: string;
      trackingInformation: Array<{company: string; number: string}>;
    }>;
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

  const result = await customerAccount.query(ORDERS_QUERY, {
    variables: {first: 10},
  });

  return {orders: result.data.customer.orders};
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(parseFloat(amount));
}

export default function OrdersPage() {
  const {orders} = useLoaderData<typeof loader>();
  const orderList = orders.nodes as OrderNode[];

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
          <div className="h-eyebrow mb-3">ORDER HISTORY</div>
          <h1 className="text-4xl md:text-5xl font-normal">Orders</h1>
        </div>

        {orderList.length === 0 ? (
          <div className="text-center py-20 border border-black/10">
            <p className="h-eyebrow mb-4 text-black/40">NO ORDERS YET</p>
            <p className="text-black/60 mb-8">
              Your order history will appear here.
            </p>
            <Link to="/">
              <Button variant="primary">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orderList.map((order) => {
              const fulfillmentStatus =
                order.fulfillments.nodes[0]?.status ?? 'UNFULFILLED';

              return (
                <div
                  key={order.id}
                  className="border border-black/10 p-6 md:p-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                      <p className="text-sm text-black/60 mb-1">
                        {formatDate(order.processedAt)}
                      </p>
                      <h3 className="text-xl font-normal">
                        Order #{order.number}
                      </h3>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      <p className="text-sm text-black/60 mb-1">
                        Total:{' '}
                        {formatMoney(
                          order.totalPrice.amount,
                          order.totalPrice.currencyCode,
                        )}
                      </p>
                      <span
                        className={`inline-block text-[10px] font-semibold tracking-widest uppercase px-3 py-1 ${
                          fulfillmentStatus === 'FULFILLED'
                            ? 'bg-black text-white'
                            : 'bg-[var(--color-surface)] text-black'
                        }`}
                      >
                        {fulfillmentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="flex gap-4 flex-wrap mb-6">
                    {order.lineItems.nodes.map((item, i) => (
                      <div key={i} className="w-16 h-16 bg-[var(--color-surface)] flex items-center justify-center">
                        {item.image?.url ? (
                          <img
                            src={item.image.url}
                            alt={item.image.altText || item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-black/30 uppercase tracking-wider">
                            Item
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <a
                      href={order.statusPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.78rem] font-medium tracking-[0.08em] uppercase border border-black px-6 py-2.5 hover:bg-black hover:text-white transition-all duration-300"
                    >
                      View Order
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
}
