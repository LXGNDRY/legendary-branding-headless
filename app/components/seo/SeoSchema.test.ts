import {describe, expect, it} from 'vitest';
import {faqPageSchema, parseFaqFromHtml, breadcrumbSchema, collectionPageSchema, organizationSchema, productSchema} from './SeoSchema';

describe('parseFaqFromHtml', () => {
  it('extracts question/answer pairs from <details><summary> markup', () => {
    const html = `
      <details>
        <summary>What sizes do you carry?</summary>
        <p>S to 3XL.</p>
      </details>
      <details>
        <summary>Do you ship internationally?</summary>
        <p>Yes, free worldwide shipping.</p>
      </details>
    `;
    expect(parseFaqFromHtml(html)).toEqual([
      {question: 'What sizes do you carry?', answer: 'S to 3XL.'},
      {question: 'Do you ship internationally?', answer: 'Yes, free worldwide shipping.'},
    ]);
  });

  it('strips nested tags and merges multi-paragraph/list answers into one string', () => {
    const html = `
      <details>
        <summary>How long does delivery take?</summary>
        <p>Estimated delivery times:</p>
        <ul><li><strong>USA:</strong> 7-10 days</li></ul>
      </details>
    `;
    expect(parseFaqFromHtml(html)).toEqual([
      {question: 'How long does delivery take?', answer: 'Estimated delivery times: USA: 7-10 days'},
    ]);
  });

  it('returns an empty array for content with no <details> blocks', () => {
    expect(parseFaqFromHtml('<p>Just a regular policy page.</p>')).toEqual([]);
  });
});

describe('faqPageSchema', () => {
  it('builds valid FAQPage JSON-LD from parsed items', () => {
    const schema = faqPageSchema([{question: 'Q1', answer: 'A1'}]);
    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Q1',
          acceptedAnswer: {'@type': 'Answer', text: 'A1'},
        },
      ],
    });
  });
});

describe('breadcrumbSchema', () => {
  it('resolves a site-relative url to an absolute one -- Google requires BreadcrumbList item to be absolute', () => {
    const schema = breadcrumbSchema([{name: 'Home', url: '/'}, {name: 'Journal', url: '/journal'}]);
    expect(schema.itemListElement[0].item).toBe('https://legendary-branding.com/');
    expect(schema.itemListElement[1].item).toBe('https://legendary-branding.com/journal');
  });

  it('rejects an external origin in a site breadcrumb', () => {
    const schema = breadcrumbSchema([{name: 'External', url: 'https://example.com/x'}]);
    expect(schema.itemListElement[0].item).toBe('https://legendary-branding.com');
  });

  it('omits the item field entirely for the final (current-page) breadcrumb with no url', () => {
    const schema = breadcrumbSchema([{name: 'Home', url: '/'}, {name: 'Current Page'}]);
    expect(schema.itemListElement[1]).not.toHaveProperty('item');
  });
});

describe('collectionPageSchema', () => {
  it('resolves each product\'s relative url to an absolute one', () => {
    const schema = collectionPageSchema({
      title: 'Hoodies',
      handle: 'hoodies-jackets',
      products: [{name: 'Hoodie', url: '/products/hoodie', image: 'https://cdn.shopify.com/x.jpg'}],
    });
    expect(schema.mainEntity).toMatchObject({
      itemListElement: [{url: 'https://legendary-branding.com/products/hoodie'}],
    });
  });
});

describe('organization and product schema facts', () => {
  it('uses a logo asset that exists when the store has none, never favicon.ico', () => {
    expect(organizationSchema().logo).toBe('https://legendary-branding.com/icon-512.png');
    expect(organizationSchema({logoUrl: 'https://cdn.shopify.com/logo.png'}).logo).toBe('https://cdn.shopify.com/logo.png');
  });

  const product = (extra: Record<string, unknown>) =>
    productSchema({
      id: 'gid://shopify/Product/1',
      title: 'Tee',
      handle: 'tee',
      description: 'd',
      images: [],
      variants: [{id: 'v1', price: '49.00', currencyCode: 'USD', available: true}],
      ...extra,
    } as never);

  it('claims the return policy only for the countries it is given, and never defaults to US', () => {
    const withCountry = product({returnDays: 30, returnCountries: ['DE']}) as {offers: Array<{hasMerchantReturnPolicy?: {applicableCountry: unknown}}>};
    expect(withCountry.offers[0].hasMerchantReturnPolicy?.applicableCountry).toEqual(['DE']);
    const none = product({returnDays: 30, returnCountries: []}) as {offers: Array<{hasMerchantReturnPolicy?: unknown}>};
    expect(none.offers[0].hasMerchantReturnPolicy).toBeUndefined();
  });

  it('builds offer ids and urls from the product route on the live origin', () => {
    const schema = product({}) as {'@id': string; offers: Array<{url: string; '@id': string}>};
    expect(schema['@id']).toBe('https://legendary-branding.com/products/tee#product');
    expect(schema.offers[0].url).toBe('https://legendary-branding.com/products/tee');
  });
});
