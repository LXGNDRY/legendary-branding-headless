import type {MetaFunction, LoaderFunctionArgs} from 'react-router';
import {useLoaderData, Link} from 'react-router';
import Container from '~/components/ui/Container';

const PAGE_TITLES: Record<string, string> = {
  'refund-policy': 'Refund & Return Policy',
  'terms-of-service': 'Terms of Service',
  'privacy-with-legendary-branding': 'Privacy Policy',
  'shipping-policy': 'Shipping Policy',
  'size-guide': 'Size Guide',
  about: 'About Us',
  contact: 'Contact',
  legendary_branding_faqs: 'FAQ',
};

// Map policy handles to shop policy GraphQL field names
const SHOP_POLICY_MAP: Record<string, string> = {
  'refund-policy': 'refundPolicy',
  'terms-of-service': 'termsOfService',
  'shipping-policy': 'shippingPolicy',
};

const POLICY_QUERY = `#graphql
  query Policy(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    page(handle: $handle) {
      id
      title
      body
    }
    shop {
      refundPolicy { title body url }
      termsOfService { title body url }
      shippingPolicy { title body url }
      privacyPolicy { title body url }
    }
  }
` as const;

type ShopPolicy = {title: string; body: string; url: string};
type ShopPolicies = {
  refundPolicy?: ShopPolicy | null;
  termsOfService?: ShopPolicy | null;
  shippingPolicy?: ShopPolicy | null;
  privacyPolicy?: ShopPolicy | null;
};

export const meta: MetaFunction<typeof loader> = ({data}) => [
  {title: `${data?.title ?? 'Policy'} — LEGENDARY BRANDING`},
  {name: 'description', content: data?.title ? `${data.title} — Legendary Branding` : 'Legendary Branding policies.'},
];

export async function loader({params, context}: LoaderFunctionArgs) {
  const handle = params.handle ?? '';
  const fallbackTitle =
    PAGE_TITLES[handle] ??
    handle
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const {page, shop} = await context.storefront.query(POLICY_QUERY, {
    variables: {
      handle,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
  });

  // Prefer custom page; fall back to shop built-in policies
  let title = fallbackTitle;
  let bodyHtml: string | null = null;

  if (page?.body) {
    title = page.title ?? fallbackTitle;
    bodyHtml = page.body as string;
  } else {
    const policyField = SHOP_POLICY_MAP[handle] as keyof ShopPolicies | undefined;
    const shopPolicies = shop as ShopPolicies;
    const policy = policyField ? shopPolicies[policyField] : null;
    if (policy) {
      title = policy.title ?? fallbackTitle;
      bodyHtml = policy.body;
    }
  }

  return {handle, title, bodyHtml};
}

export default function PolicyPage() {
  const {title, bodyHtml, handle} = useLoaderData<typeof loader>();

  return (
    <Container className="py-16">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav
          className="mb-8 text-[11px] tracking-widest uppercase text-[#6b6b6b]"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="hover:text-[#0a0a0a] transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#0a0a0a]">{title}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-10">
          {title}
        </h1>

        {bodyHtml ? (
          <div
            className="prose prose-sm max-w-none
              [&_p]:text-sm [&_p]:text-[#0a0a0a] [&_p]:leading-relaxed [&_p]:mb-4
              [&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-8 [&_h2]:mb-3
              [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2
              [&_ul]:pl-5 [&_ul]:mb-4 [&_li]:text-sm [&_li]:text-[#0a0a0a] [&_li]:mb-1
              [&_ol]:pl-5 [&_ol]:mb-4
              [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-[#6b6b6b]
              [&_strong]:font-semibold"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{__html: bodyHtml}}
          />
        ) : (
          <div className="py-16 text-center border-y border-[#e5e5e5]">
            <p className="text-sm text-[#6b6b6b] tracking-wide">
              Content for this page is not available.
            </p>
          </div>
        )}

        {handle === 'contact' && (
          <div className="mt-12 p-8 bg-[#f7f7f7]">
            <h2 className="text-xs font-semibold tracking-widest uppercase mb-6">Get in Touch</h2>
            <div className="space-y-3 text-sm text-[#6b6b6b]">
              <p>For order inquiries, reach us at your Shopify store contact email.</p>
              <p>Response time: 1–2 business days.</p>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
