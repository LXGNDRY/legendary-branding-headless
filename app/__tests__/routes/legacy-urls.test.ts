import {describe, expect, it} from 'vitest';
import {loader} from '~/routes/$';
import {createMockStorefront} from '~/test/mock-storefront';

function run(path: string, article: unknown = {handle: 'real-post'}) {
  const mock = createMockStorefront({responses: {Article: {blog: {articleByHandle: article}}}});
  const result = loader({request: new Request(`https://legendary-branding.com${path}`), params: {}, context: mock.createContext()} as never);
  return {result, mock};
}

describe('historical blog URLs', () => {
  it('permanently redirects the known index to the non-www journal', async () => {
    const {result, mock} = run('/blogs/legendary_blogging?utm_source=email&redirect=https://evil.test&code=private');
    const response = await result;
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://legendary-branding.com/journal?utm_source=email');
    expect(mock.getCalls()).toHaveLength(0);
  });

  it('verifies the article and uses its actual handle, preserving only safe attribution', async () => {
    const {result, mock} = run('/blogs/legendary_blogging/old-post?gclid=click&code=secret');
    const response = await result;
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://legendary-branding.com/journal/real-post?gclid=click');
    expect(mock.getCalls()[0].variables).toMatchObject({blogHandle: 'legendary_blogging', articleHandle: 'old-post'});
  });

  it('preserves a real 404 for a missing article', async () => {
    await expect(run('/blogs/legendary_blogging/missing', null).result).rejects.toMatchObject({status: 404});
  });

  it.each(['/blogs/other-blog/real-post', '/fr/blogs/legendary_blogging/real-post', '/not-a-page', '/blogs/legendary_blogging/too/many', '/blogs/legendary_blogging/%ZZ'])('does not invent a destination for %s', async (path) => {
    const {result, mock} = run(path);
    await expect(result).rejects.toMatchObject({status: 404});
    expect(mock.getCalls()).toHaveLength(0);
  });
});
