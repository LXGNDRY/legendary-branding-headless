#!/usr/bin/env node
/**
 * Post-release SEO baseline capture. Satisfies the SEO-00/SEO-09 release gate in
 * docs/HYDROGEN_TECHNICAL_SEO_PLAN.md: after a dev->main promotion, re-run against
 * the live non-www origin to prove the fixes landed on production.
 *
 * Usage:
 *   node scripts/seo-postrelease-baseline.mjs --out docs/audits/<date>/SEO_POSTRELEASE_BASELINE.json
 *
 * Read-only HTTP checks. Fails non-zero if any required assertion is unmet so CI
 * (or an operator) can treat a captured snapshot as a pass/fail gate, not a text file.
 */
import {writeFileSync, mkdirSync} from 'node:fs';
import {dirname} from 'node:path';

const ORIGIN = 'https://legendary-branding.com';
const WWW_ORIGIN = 'https://www.legendary-branding.com';
const USER_AGENT = 'LegendaryBrandingSeoBaseline/1.0 (+contact: lb@legendary-branding.com)';

const SAMPLE_INDEXABLE_PATHS = [
  '/',
  '/collections',
  '/collections/all-products',
  '/journal',
  '/policies/shipping-policy',
  '/products/marque-legendaire-camo-t-shirt-240gsm',
];

// NOTE: /pages/<policy-handle> is handled upstream by Shopify's URL Redirects
// (consumed via storefrontRedirect in server.ts), not by any Hydrogen route; we
// still verify it here so a drift in the Shopify Admin surface fails loudly.
const LEGACY_REDIRECT_PATHS = [
  '/blogs/legendary_blogging',
  '/blogs/legendary_blogging/limited-drop-streetwear-why-exclusivity-rules-culture',
  '/pages/about',
  '/pages/shipping-policy',
  '/pages/size-guide',
];

function parseArgs(argv) {
  const out = {out: null, origin: ORIGIN, releaseSha: null};
  for (let i = 2; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === '--out') out.out = value;
    else if (flag === '--origin') out.origin = value;
    else if (flag === '--release-sha') out.releaseSha = value;
    else continue;
    i += 1;
  }
  return out;
}

async function head(url) {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    headers: {'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml'},
  });
  const text = await response.text();
  return {status: response.status, location: response.headers.get('location'), text};
}

function extractCanonical(html) {
  const links = [...html.matchAll(/<link[^>]+rel=["']canonical["'][^>]*>/gi)];
  return links
    .map((match) => /href=["']([^"']+)["']/i.exec(match[0])?.[1] ?? null)
    .filter((href) => typeof href === 'string');
}

function hasNoindex(html) {
  return /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
}

function extractSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function extractRobotsSitemapLines(txt) {
  return txt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^sitemap:\s*/i.test(line))
    .map((line) => line.replace(/^sitemap:\s*/i, ''));
}

async function captureIndexable(origin, path) {
  const target = `${origin}${path}`;
  const {status, text} = await head(target);
  return {
    path,
    status,
    canonical: extractCanonical(text),
    noindex: hasNoindex(text),
  };
}

async function captureLegacyRedirect(origin, path) {
  const target = `${origin}${path}`;
  const {status, location} = await head(target);
  return {path, status, location};
}

async function captureSitemap(origin) {
  const {status, text} = await head(`${origin}/sitemap.xml`);
  const locs = extractSitemapLocs(text);
  return {
    status,
    total: locs.length,
    www: locs.filter((loc) => loc.startsWith(WWW_ORIGIN)).length,
    nonWww: locs.filter((loc) => loc.startsWith(ORIGIN) && !loc.startsWith(WWW_ORIGIN)).length,
    sample: locs.slice(0, 5),
  };
}

async function captureRobots(origin) {
  const {status, text} = await head(`${origin}/robots.txt`);
  return {status, sitemaps: extractRobotsSitemapLines(text)};
}

async function captureRelease(origin) {
  try {
    const response = await fetch(`${origin}/api/release`, {
      headers: {'user-agent': USER_AGENT, accept: 'application/json'},
    });
    if (!response.ok) return {status: response.status};
    const body = await response.json();
    return {status: response.status, release: body};
  } catch (error) {
    return {status: 0, error: String(error)};
  }
}

export function assertAll(baseline, expectedSha) {
  const failures = [];
  for (const check of baseline.indexable) {
    if (check.status !== 200) failures.push(`${check.path} status ${check.status} (want 200)`);
    if (check.noindex) failures.push(`${check.path} has noindex`);
    if (check.canonical.length !== 1) failures.push(`${check.path} has ${check.canonical.length} canonical tags (want 1)`);
    for (const href of check.canonical) {
      if (href.startsWith(WWW_ORIGIN)) failures.push(`${check.path} canonical points to www: ${href}`);
      if (!href.startsWith(ORIGIN)) failures.push(`${check.path} canonical off public origin: ${href}`);
    }
  }
  for (const redirect of baseline.legacyRedirects) {
    if (redirect.status !== 301 && redirect.status !== 308) failures.push(`${redirect.path} status ${redirect.status} (want 301/308)`);
    if (!redirect.location || !redirect.location.startsWith(ORIGIN)) {
      failures.push(`${redirect.path} redirect target off origin: ${redirect.location}`);
    }
  }
  if (baseline.sitemap.status !== 200) failures.push(`sitemap status ${baseline.sitemap.status}`);
  if (baseline.sitemap.www > 0) failures.push(`sitemap has ${baseline.sitemap.www} www loc(s)`);
  if (baseline.sitemap.nonWww === 0) failures.push('sitemap has 0 non-www locs');
  if (baseline.robots.status !== 200) failures.push(`robots status ${baseline.robots.status}`);
  for (const sitemapLine of baseline.robots.sitemaps) {
    if (sitemapLine.startsWith(WWW_ORIGIN)) failures.push(`robots Sitemap: line points to www: ${sitemapLine}`);
  }
  if (expectedSha && baseline.release.release?.commit && baseline.release.release.commit !== expectedSha) {
    failures.push(`/api/release commit ${baseline.release.release.commit} != expected ${expectedSha}`);
  }
  return failures;
}

async function main() {
  const args = parseArgs(process.argv);
  const origin = args.origin;
  const baseline = {
    date: new Date().toISOString().slice(0, 10),
    origin,
    scope: 'Post-release production baseline per docs/HYDROGEN_TECHNICAL_SEO_PLAN.md SEO-09',
    indexable: [],
    legacyRedirects: [],
    sitemap: null,
    robots: null,
    release: null,
  };
  for (const path of SAMPLE_INDEXABLE_PATHS) baseline.indexable.push(await captureIndexable(origin, path));
  for (const path of LEGACY_REDIRECT_PATHS) baseline.legacyRedirects.push(await captureLegacyRedirect(origin, path));
  baseline.sitemap = await captureSitemap(origin);
  baseline.robots = await captureRobots(origin);
  baseline.release = await captureRelease(origin);
  const failures = assertAll(baseline, args.releaseSha);
  baseline.pass = failures.length === 0;
  baseline.failures = failures;
  const serialized = `${JSON.stringify(baseline, null, 2)}\n`;
  if (args.out) {
    mkdirSync(dirname(args.out), {recursive: true});
    writeFileSync(args.out, serialized);
    process.stdout.write(`${args.out}\n`);
  } else {
    process.stdout.write(serialized);
  }
  if (!baseline.pass) {
    process.stderr.write(`SEO baseline FAILED (${failures.length} assertion${failures.length === 1 ? '' : 's'}):\n`);
    for (const failure of failures) process.stderr.write(` - ${failure}\n`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exit(1);
  });
}
