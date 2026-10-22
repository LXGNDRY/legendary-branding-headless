import {useLanguage} from '~/lib/i18n';
import {formatDate, formatMoney} from '~/lib/locale';
import {
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
  Link,
} from 'react-router';
import {Image} from '@shopify/hydrogen';
import Container from '~/components/ui/Container';
import Button from '~/components/ui/Button';
import {ACCOUNT_PAGE_SIZE, accountMeta, loadAccount, parseAfterCursor} from '~/lib/account';

export const meta: MetaFunction = () => accountMeta('Orders', 'Your order history.');

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
    customer?: {orders?: {nodes?: OrderNode[] | null; pageInfo?: {hasNextPage: boolean; endCursor?: string | null} | null} | null} | null;
  }>('account.orders', () => customerAccount.query(ORDERS_QUERY, {variables: {first: ACCOUNT_PAGE_SIZE, after}}));

  if (!result.ok || !result.data.customer?.orders) return {failed: true as const, orders: [] as OrderNode[], nextCursor: null, isFirstPage: !after};

  const {nodes, pageInfo} = result.data.customer.orders;
  return {
    failed: false as const,
    orders: nodes ?? [],
    nextCursor: pageInfo?.hasNextPage ? (pageInfo.endCursor ?? null) : null,
    isFirstPage: !after,
  };
}


export default function OrdersPage() {
  const {orders: orderList, failed, nextCursor, isFirstPage} = useLoaderData<typeof loader>();
  const language = useLanguage();

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
          <div className="h-eyebrow mb-3">ORDER HISTORY</div>
          <h1 className="text-4xl md:text-5xl font-normal">Orders</h1>
        </div>

        {failed ? (
          <div className="text-center py-20 border border-[var(--color-border-muted)]" role="alert">
            <p className="h-eyebrow mb-4 text-[var(--color-text-tertiary)]">COULDN&apos;T LOAD ORDERS</p>
            <p className="text-[var(--color-text-secondary)] mb-8">Please try again in a moment.</p>
            <Link to="/account/orders" className="text-xs font-semibold tracking-widest uppercase underline underline-offset-4">
              Try again
            </Link>
          </div>
        ) : orderList.length === 0 ? (
          <div className="text-center py-20 border border-[var(--color-border-muted)]">
            <p className="h-eyebrow mb-4 text-[var(--color-text-tertiary)]">NO ORDERS YET</p>
            <p className="text-[var(--color-text-secondary)] mb-8">
              Your order history will appear here.
            </p>
            <Button as="link" to="/" variant="primary">Start Shopping</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orderList.map((order) => {
              const fulfillmentStatus =
                order.fulfillments?.nodes?.[0]?.status ?? 'UNFULFILLED';

              return (
                <div
                  key={order.id}
                  className="border border-[var(--color-border-muted)] p-6 md:p-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                        {formatDate(order.processedAt, language)}
                      </p>
                      <h2 className="text-xl font-normal">
                        Order #{order.number}
                      </h2>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                        Total:{' '}
                        {formatMoney(
                          order.totalPrice.amount,
                          order.totalPrice.currencyCode,
                          language,
                        )}
                      </p>
                      <span
                        className={`inline-block text-[10px] font-semibold tracking-widest uppercase px-3 py-1 ${
                          fulfillmentStatus === 'FULFILLED'
                            ? 'bg-[var(--color-bg-level-3)] text-white'
                            : 'bg-[var(--color-surface)] text-black'
                        }`}
                      >
                        {fulfillmentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="flex gap-4 flex-wrap mb-6">
                    {(order.lineItems?.nodes ?? []).map((item, i) => (
                      <div key={i} className="w-16 h-16 bg-[var(--color-surface)] flex items-center justify-center">
                        {item.image?.url ? (
                          <Image
                            data={item.image}
                            alt={item.image.altText || item.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
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
                      className="text-[0.78rem] font-medium tracking-[0.08em] uppercase border border-[var(--color-border-strong)] px-6 py-2.5 hover:bg-[var(--color-bg-level-3)] hover:text-white transition-all duration-300"
                    >
                      View Order
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!failed && (nextCursor || !isFirstPage) && (
          <nav aria-label="Order pages" className="mt-10 flex items-center justify-between text-xs font-semibold tracking-widest uppercase">
            {isFirstPage ? (
              <span />
            ) : (
              <Link to="/account/orders" className="underline underline-offset-4">
                ← Newest orders
              </Link>
            )}
            {nextCursor && (
              <Link to={`/account/orders?after=${encodeURIComponent(nextCursor)}`} className="underline underline-offset-4">
                Older orders →
              </Link>
            )}
          </nav>
        )}
      </div>
    </Container>
  );
}
