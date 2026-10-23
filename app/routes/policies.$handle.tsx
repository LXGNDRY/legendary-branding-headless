import SafeHtml from '~/components/ui/SafeHtml';
import {redirect, type LoaderFunctionArgs, type MetaFunction, useLoaderData, Link} from 'react-router';
import Container from '~/components/ui/Container';
import {CacheLong} from '~/lib/cache';
import JsonLd from '~/components/ui/JsonLd';
import {breadcrumbSchema, faqPageSchema, parseFaqFromHtml} from '~/components/seo/SeoSchema';
import {POLICY_PAGES, ROUTES, SUPPORT_EMAIL, canonicalLocaleUrl, isPolicyHandle} from '~/lib/site';

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

export const meta: MetaFunction<typeof loader> = ({data, matches}) => {
  const title = `${data?.title ?? 'Policy'} | LEGENDARY BRANDING`;
  const description = data?.title ? `${data.title} | Legendary Branding` : 'Legendary Branding policies.';
  const canonical = canonicalLocaleUrl(ROUTES.policy(data?.handle ?? ''), matches);

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

  const {page, shop} = await context.storefront.query(POLICY_QUERY, {
    variables: {
      handle,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
    cache: CacheLong(),
  });

  // NOTE: /policies serves exactly the handles in POLICY_PAGES. Any other handle is a generic page that lives at /pages;
  // an existing link to one keeps working through a permanent redirect, and anything else is a real 404.
  if (!isPolicyHandle(handle)) {
    // NOTE: existence, not body: a page built only from content blocks has an empty body but is a valid /pages route.
    if (page) throw redirect(ROUTES.page(handle), 301);
    throw new Response('Policy page not found', {status: 404});
  }

  const entry = POLICY_PAGES[handle];
  // NOTE: one rule for who owns the content. The Page of that handle is what the owner edits and publishes, so it wins
  // whenever it has a body; Shopify's built-in policy (Settings > Policies) is the fallback for handles that have one.
  const native = entry.native ? (shop as ShopPolicies | null | undefined)?.[entry.native] : null;
  const title = page?.body ? (page.title ?? entry.title) : (native?.title ?? entry.title);
  const bodyHtml = page?.body ? (page.body as string) : native?.body ? native.body : null;

  // NOTE: a required page with no content is a configuration gap, not an empty page: say so with a 503 (temporary,
  // keeps indexing) instead of a 200 that looks like success. Contact renders its own block, so it is exempt.
  if (!bodyHtml && entry.required) {
    throw new Response('This page is temporarily unavailable', {status: 503, headers: {'Retry-After': '300'}});
  }

  return {handle, title, bodyHtml};
}

export default function PolicyPage() {
  const {title, bodyHtml, handle} = useLoaderData<typeof loader>();

  const breadcrumbJsonLd = breadcrumbSchema([
    {name: 'Home', url: '/'},
    {name: title},
  ]);

  const faqItems = bodyHtml ? parseFaqFromHtml(bodyHtml) : [];
  const faqJsonLd = faqItems.length ? faqPageSchema(faqItems) : null;

  return (
    <Container className="py-16">
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
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
          <SafeHtml className="prose prose-sm max-w-none
              [&_p]:text-sm [&_p]:text-[var(--color-foreground)] [&_p]:leading-relaxed [&_p]:mb-4
              [&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-8 [&_h2]:mb-3
              [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2
              [&_ul]:pl-5 [&_ul]:mb-4 [&_li]:text-sm [&_li]:text-[var(--color-foreground)] [&_li]:mb-1
              [&_ol]:pl-5 [&_ol]:mb-4
              [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-[var(--color-text-secondary)]
              [&_strong]:font-semibold" html={bodyHtml} />
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
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="underline underline-offset-2 hover:text-[var(--color-foreground)] transition-colors"
                >
                  {SUPPORT_EMAIL}
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
