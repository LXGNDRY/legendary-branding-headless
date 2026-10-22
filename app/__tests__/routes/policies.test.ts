import {describe, expect, it} from 'vitest';
import {loader as policyLoader, meta as policyMeta} from '~/routes/policies.$handle';
import {loader as pageLoader, meta as pageMeta} from '~/routes/pages.$handle';
import {createMockStorefront} from '~/test/mock-storefront';

const policy = (title: string, body: string) => ({title, body, url: 'https://shop.test/policies/x'});
const noShop = {refundPolicy: null, termsOfService: null, shippingPolicy: null, privacyPolicy: null};

function context(responses: Record<string, unknown>) {
  return createMockStorefront({responses}).createContext();
}

const runPolicy = (handle: string, responses: Record<string, unknown>) =>
  // @ts-expect-error - minimal Hydrogen app context
  (policyLoader({params: {handle}, context: context(responses), request: new Request(`https://shop.test/policies/${handle}`)}) as Promise<any>);

const runPage = (handle: string, responses: Record<string, unknown>) =>
  // @ts-expect-error - minimal Hydrogen app context
  (pageLoader({params: {handle}, context: context(responses), request: new Request(`https://shop.test/pages/${handle}`)}) as Promise<any>);

async function thrown(promise: Promise<unknown>): Promise<Response> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }
  throw new Error('expected a thrown Response');
}

describe('/policies/:handle content authority', () => {
  it('a built-in store policy beats a stale Page of the same handle', async () => {
    const data = await runPolicy('refund-policy', {
      Policy: {page: {id: 'p', title: 'Old returns', body: '<p>stale</p>'}, shop: {...noShop, refundPolicy: policy('Refund policy', '<p>current</p>')}},
    });
    expect(data).toEqual({handle: 'refund-policy', title: 'Refund policy', bodyHtml: '<p>current</p>'});
  });

  it('falls back to a Page of that handle when there is no built-in policy', async () => {
    const data = await runPolicy('refund-policy', {Policy: {page: {id: 'p', title: 'Returns', body: '<p>page copy</p>'}, shop: noShop}});
    expect(data.bodyHtml).toBe('<p>page copy</p>');
    expect(data.title).toBe('Returns');
  });

  it('uses the Page for handles with no built-in policy (size guide, about, FAQ)', async () => {
    const data = await runPolicy('size-guide', {Policy: {page: {id: 'p', title: 'Size guide', body: '<p>chart</p>'}, shop: noShop}});
    expect(data.bodyHtml).toBe('<p>chart</p>');
  });

  it('fails a required page with no content as a 503, never a 200 placeholder', async () => {
    for (const handle of ['refund-policy', 'terms-of-service', 'privacy-with-legendary-branding', 'shipping-policy', 'size-guide', 'about', 'legendary_branding_faqs']) {
      const response = await thrown(runPolicy(handle, {Policy: {page: null, shop: noShop}}));
      expect(response.status, handle).toBe(503);
    }
  });

  it('still serves contact with no page body, because it renders its own block', async () => {
    const data = await runPolicy('contact', {Policy: {page: null, shop: noShop}});
    expect(data).toMatchObject({handle: 'contact', bodyHtml: null});
  });

  it('keeps an old /policies link to a generic page working with a permanent redirect', async () => {
    const response = await thrown(runPolicy('lookbook', {Policy: {page: {id: 'p', title: 'Lookbook', body: '<p>x</p>'}, shop: noShop}}));
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('/pages/lookbook');
  });

  it('404s a handle that is neither a policy nor a page', async () => {
    expect((await thrown(runPolicy('nonsense', {Policy: {page: null, shop: noShop}}))).status).toBe(404);
  });

  it('canonicalizes to the policy route on the live origin', () => {
    const entries = (policyMeta as unknown as (a: unknown) => Array<Record<string, string>>)({data: {handle: 'refund-policy', title: 'Refund'}});
    expect(entries.find((m) => m.rel === 'canonical')?.href).toBe('https://www.legendary-branding.com/policies/refund-policy');
  });
});

describe('/pages/:handle', () => {
  it('redirects a policy handle to its canonical /policies route (old links keep working)', async () => {
    for (const handle of ['refund-policy', 'about', 'contact', 'legendary_branding_faqs']) {
      const response = await thrown(runPage(handle, {Page: {page: {id: 'p', title: 'x', body: 'x'}}}));
      expect(response.status).toBe(301);
      expect(response.headers.get('Location')).toBe(`/policies/${handle}`);
    }
  });

  it('serves a generic page and canonicalizes to itself', async () => {
    const data = await runPage('lookbook', {Page: {page: {id: 'p', title: 'Lookbook', body: '<p>x</p>', metafield: null}}});
    expect(data.page.title).toBe('Lookbook');
    const entries = (pageMeta as unknown as (a: unknown) => Array<Record<string, string>>)({data, params: {handle: 'lookbook'}});
    expect(entries.find((m) => m.rel === 'canonical')?.href).toBe('https://www.legendary-branding.com/pages/lookbook');
  });

  it('404s a missing page', async () => {
    expect((await thrown(runPage('missing', {Page: {page: null}}))).status).toBe(404);
  });
});
