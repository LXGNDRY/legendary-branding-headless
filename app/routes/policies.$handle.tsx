import {type LoaderFunctionArgs, type MetaFunction, useLoaderData, Link} from 'react-router';
import Container from '~/components/ui/Container';
import {CacheLong} from '~/lib/cache';
import JsonLd from '~/components/ui/JsonLd';
import {breadcrumbSchema} from '~/components/seo/SeoSchema';

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
  'privacy-with-legendary-branding': 'privacyPolicy',
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

export const meta: MetaFunction<typeof loader> = ({data}) => {
  const title = `${data?.title ?? 'Policy'} | LEGENDARY BRANDING`;
  const description = data?.title ? `${data.title} | Legendary Branding` : 'Legendary Branding policies.';
  const canonical = `https://legendary-branding.com/policies/${data?.handle ?? ''}`;

  return [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:url', content: canonical},
  ];
};

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
    cache: CacheLong(),
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

  const breadcrumbJsonLd = breadcrumbSchema([
    {name: 'Home', url: '/'},
    {name: title},
  ]);

  return (
    <Container className="py-16">
      <JsonLd data={breadcrumbJsonLd} />
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav
          className="mb-8 text-[11px] tracking-widest uppercase text-[var(--color-text-secondary)]"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="hover:text-[var(--color-foreground)] transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--color-foreground)]">{title}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-10">
          {title}
        </h1>

        {bodyHtml ? (
          <div
            className="prose prose-sm max-w-none
              [&_p]:text-sm [&_p]:text-[var(--color-foreground)] [&_p]:leading-relaxed [&_p]:mb-4
              [&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-8 [&_h2]:mb-3
              [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2
              [&_ul]:pl-5 [&_ul]:mb-4 [&_li]:text-sm [&_li]:text-[var(--color-foreground)] [&_li]:mb-1
              [&_ol]:pl-5 [&_ol]:mb-4
              [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-[var(--color-text-secondary)]
              [&_strong]:font-semibold"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{__html: bodyHtml}}
          />
        ) : (
          <div className="py-16 text-center border-y border-[var(--color-border-subtle)]">
            <p className="text-sm text-[var(--color-text-secondary)] tracking-wide">
              Content for this page is not available.
            </p>
          </div>
        )}

        {handle === 'contact' && (
          <div className="mt-12 p-8 bg-[var(--color-surface)]">
            <h2 className="text-xs font-semibold tracking-widest uppercase mb-6">Get in Touch</h2>
            <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
              <p>
                For order inquiries, email us at{' '}
                <a
                  href="mailto:lb@legendary-branding.com"
                  className="underline underline-offset-2 hover:text-[var(--color-foreground)] transition-colors"
                >
                  lb@legendary-branding.com
                </a>
                .
              </p>
              <p>Response time: 1–2 business days.</p>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
