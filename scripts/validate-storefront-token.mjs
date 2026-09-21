// Fails fast, with an actionable message, when PUBLIC_STOREFRONT_API_TOKEN
// cannot authenticate against PUBLIC_STORE_DOMAIN's Storefront API.
//
// Without this, a bad/expired/wrong-type token surfaces only after the E2E
// job has already installed browsers, built the app, and spent up to
// timeout-minutes waiting for `shopify hydrogen preview` to start -- every
// page it serves 500s with a buried "401 UNAUTHORIZED" in the webServer
// log, and Playwright reports the generic, misleading
// "Timed out waiting 120000ms from config.webServer." This runs one real
// GraphQL request up front (a few hundred ms) so a bad credential fails in
// seconds with the actual cause, before the expensive multi-browser matrix
// runs at all -- CI's own jidoka: stop the line at the defect, don't let it
// flow downstream.

export async function checkStorefrontToken(
  {domain, token, apiVersion = '2026-04'},
  fetchImpl = fetch,
) {
  if (!domain || !token) {
    return {
      ok: false,
      message:
        'PUBLIC_STORE_DOMAIN and/or PUBLIC_STOREFRONT_API_TOKEN is missing. ' +
        'Check that both repo secrets are set (Settings -> Secrets and variables -> Actions).',
    };
  }

  const url = `https://${domain}/api/${apiVersion}/graphql.json`;

  let response;
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({query: '{ shop { name } }'}),
    });
  } catch (error) {
    return {
      ok: false,
      message: `Could not reach the Storefront API at ${url}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const body = await response.text();

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      message:
        `Storefront API rejected PUBLIC_STOREFRONT_API_TOKEN with HTTP ${response.status} at ${url}. ` +
        'This is almost always one of: (1) the token pasted into the repo secret is the Admin API token, ' +
        "not the Storefront API token, from the custom app's API credentials page; " +
        '(2) the token has trailing whitespace/newline from copy-paste; ' +
        '(3) the token was rotated in Shopify Admin but the GitHub secret was not updated to match; ' +
        `(4) unauthenticated Storefront API access is disabled for this app. Response body: ${body.slice(0, 500)}`,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      message: `Storefront API returned HTTP ${response.status} at ${url} (expected 200). Response body: ${body.slice(0, 500)}`,
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return {ok: false, message: `Storefront API returned non-JSON body from ${url}: ${body.slice(0, 500)}`};
  }

  if (parsed.errors?.length) {
    return {
      ok: false,
      message: `Storefront API returned GraphQL errors from ${url}: ${JSON.stringify(parsed.errors).slice(0, 500)}`,
    };
  }

  if (!parsed.data?.shop?.name) {
    return {
      ok: false,
      message: `Storefront API responded but returned no shop data from ${url}: ${body.slice(0, 500)}`,
    };
  }

  return {
    ok: true,
    message: `Storefront API credentials verified against "${parsed.data.shop.name}" (${domain}, API ${apiVersion}).`,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await checkStorefrontToken({
    domain: process.env.PUBLIC_STORE_DOMAIN,
    token: process.env.PUBLIC_STOREFRONT_API_TOKEN,
    apiVersion: process.env.PUBLIC_STOREFRONT_API_VERSION,
  });

  if (result.ok) {
    process.stdout.write(`${result.message}\n`);
  } else {
    process.stderr.write(`::error::${result.message}\n`);
    process.exitCode = 1;
  }
}
