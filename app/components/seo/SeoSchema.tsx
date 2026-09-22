import JsonLd from '~/components/ui/JsonLd';

/**
 * SEO Schema.org JSON-LD generators
 * Ported from snippets/lb-schema-*.liquid
 * All functions return the JSON-LD data object — render with <JsonLd data={...} />
 */

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Legendary Branding',
    url: 'https://legendary-branding.com',
    logo: 'https://legendary-branding.com/favicon.ico',
    // Only the two profiles actually configured/live for the brand --
    // verified against the store's real social settings. Twitter and
    // YouTube URLs were previously fabricated placeholders that pointed
    // to accounts which don't exist; schema.org sameAs should only ever
    // list real, verifiable profile URLs.
    sameAs: [
      'https://www.instagram.com/legendary_branding/',
      'https://www.tiktok.com/@legendarybranding',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English'],
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Legendary Branding',
    url: 'https://legendary-branding.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://legendary-branding.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbSchema(items: Array<{name: string; url?: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.url ? {item: item.url} : {}),
    })),
  };
}

export function faqPageSchema(items: Array<{question: string; answer: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Extracts question/answer pairs from a Shopify page body built with
 * <details><summary>Question</summary>...answer markup...</details>
 * blocks (the shape the FAQ page's content uses). Returns an empty array
 * for any other page shape, so callers can render FAQPage schema only
 * when it's genuinely backed by structured Q&A content rather than
 * guessing structure out of arbitrary rich text.
 */
export function parseFaqFromHtml(html: string): Array<{question: string; answer: string}> {
  const stripTags = (fragment: string) =>
    fragment
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#8217;|&rsquo;/g, '’')
      .replace(/\s+/g, ' ')
      .trim();

  const items: Array<{question: string; answer: string}> = [];
  const detailsPattern = /<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g;
  let match: RegExpExecArray | null;
  while ((match = detailsPattern.exec(html)) !== null) {
    const question = stripTags(match[1]);
    const answer = stripTags(match[2]);
    if (question && answer) items.push({question, answer});
  }
  return items;
}

export function collectionPageSchema({
  title,
  handle,
  description,
  products,
}: {
  title: string;
  handle: string;
  description?: string;
  products?: Array<{name: string; url: string; image: string}>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: `https://legendary-branding.com/collections/${handle}`,
    description: description || `${title} | Legendary Branding`,
    mainEntity: products?.length
      ? {
          '@type': 'ItemList',
          itemListElement: products.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: p.name,
            url: p.url,
            image: p.image,
          })),
        }
      : undefined,
  };
}

export function articleSchema({
  title,
  handle,
  datePublished,
  description,
  imageUrl,
  authorName,
}: {
  title: string;
  handle: string;
  datePublished: string;
  description?: string;
  imageUrl?: string;
  authorName?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    datePublished,
    description: description || '',
    image: imageUrl ? [imageUrl] : [],
    author: authorName
      ? [{'@type': 'Person', name: authorName}]
      : [{'@type': 'Organization', name: 'Legendary Branding'}],
    publisher: {
      '@type': 'Organization',
      name: 'Legendary Branding',
      url: 'https://legendary-branding.com',
    },
    mainEntityOfPage: `https://legendary-branding.com/journal/${handle}`,
  };
}

export function productSchema({
  id,
  title,
  handle,
  description,
  images,
  vendor,
  variants,
}: {
  id: string;
  title: string;
  handle: string;
  description: string;
  images: string[];
  vendor?: string;
  variants: Array<{
    id: string;
    price: string;
    currencyCode: string;
    available: boolean;
  }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://legendary-branding.com/products/${handle}#product`,
    name: title,
    image: images,
    description,
    sku: id,
    brand: {'@type': 'Brand', name: vendor || 'Legendary Branding'},
    offers: variants.map((v) => ({
      '@type': 'Offer',
      '@id': `https://legendary-branding.com/products/${handle}#offer-${v.id}`,
      price: v.price,
      priceCurrency: v.currencyCode,
      availability: v.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://legendary-branding.com/products/${handle}`,
      itemCondition: 'https://schema.org/NewCondition',
    })),
    aggregateRating: undefined, // not available
  };
}

/**
 * Site-wide default schema (Organization + WebSite)
 * Renders in root layout on every page
 */
export function DefaultSeoSchema() {
  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={websiteSchema()} />
    </>
  );
}
