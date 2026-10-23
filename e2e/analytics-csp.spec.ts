import {expect, test} from '@playwright/test';

// NOTE: intercepted synthetic request only; no production event or visitor payload is sent.
test('the document CSP permits Shopify analytics delivery', async ({page}) => {
  const endpoint = 'https://monorail-edge.shopifysvc.com/unstable/produce_batch';
  let intercepted = 0;
  await page.route(endpoint, async (route) => {
    intercepted += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {'access-control-allow-origin': '*'},
      body: '{"result":[]}',
    });
  });
  await page.goto('/', {waitUntil: 'domcontentloaded'});
  const status = await page.evaluate(async (url) => {
    const response = await fetch(url, {method: 'POST', headers: {'content-type': 'text/plain'}, body: '{}'});
    return response.status;
  }, endpoint);
  expect(status).toBe(200);
  expect(intercepted).toBeGreaterThan(0);
});
