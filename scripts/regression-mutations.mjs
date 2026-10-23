// Failing-before audit: re-introduces each P0/P1 defect in turn and proves the regression tests catch it.
// Usage: npm run test:mutations   (exits non-zero if any reintroduced defect survives)
import {readFileSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const MUTATIONS = [
  {id: 'F06', what: 'JSON-LD no longer escapes "<"', file: 'app/lib/json-ld.ts', find: String.raw`.replace(/</g, '\\u003c')`, replace: '', tests: ['app/lib/json-ld.test.ts']},
  {id: 'F07', what: 'rich HTML is no longer sanitized', file: 'app/lib/safe-html.ts', find: 'clean(fragment);\n  return serialize(fragment);', replace: 'return serialize(fragment);', tests: ['app/lib/safe-html.test.ts']},
  {id: 'F05', what: 'session commit replaces earlier Set-Cookie headers', file: 'app/lib/response-cookies.ts', find: "response.headers.append('Set-Cookie', await session.commit());", replace: "response.headers.set('Set-Cookie', await session.commit());", tests: ['app/lib/response-cookies.test.ts']},
  {id: 'F04a', what: 'cart route accepts unsupported actions', file: 'app/lib/cart-mutation.ts', find: "if (!allowed.includes(action as CartAction)) return failure('Unsupported cart action.', 400);", replace: '', tests: ['app/lib/cart-mutation.test.ts']},
  {id: 'F04b', what: 'cart add accepts lines without a merchandise id', file: 'app/lib/cart-mutation.ts', find: 'if (!isRecord(line) || !isId(line.merchandiseId) ||', replace: 'if (!isRecord(line) ||', tests: ['app/lib/cart-mutation.test.ts']},
  {id: 'F27', what: 'rate limiter allows one request over the limit', file: 'app/lib/rate-limit.ts', find: 'if (entry.timestamps.length >= maxRequests) {', replace: 'if (entry.timestamps.length > maxRequests) {', tests: ['app/lib/rate-limit.test.ts']},
  {id: 'F25a', what: 'Shopify consent is no longer adopted over stored consent', file: 'app/lib/consent.ts', find: "if (shopify && !sameConsent(shopify, stored)) return {action: 'adopt', state: shopify};", replace: '', tests: ['app/lib/consent.test.ts']},
  {id: 'F25b', what: 'marketing trackers load without marketing consent', file: 'app/lib/trackers.ts', find: 'const marketing = consent?.marketing === true;', replace: 'const marketing = true;', tests: ['app/lib/trackers.test.ts']},
  {id: 'F29', what: 'private pages become publicly cacheable', file: 'app/lib/private-route.ts', find: "headers.set('Cache-Control', 'private, no-store');", replace: "headers.set('Cache-Control', 'public, max-age=60');", tests: ['app/lib/private-route.test.ts']},
  {id: 'F31', what: 'reviewer names with emails/URLs are shown', file: 'app/lib/judgeme.ts', find: String.raw`/[@/\\]|https?:|www\./i.test(cleaned)`, replace: 'false', tests: ['app/lib/judgeme.test.ts']},
  {id: 'F19', what: 'variant pagination stops after the first page', file: 'app/lib/pagination.ts', find: 'if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) break;', replace: 'break;', tests: ['app/lib/pagination.test.ts']},
  {id: 'F44', what: 'release probe reports ok with missing variables', file: 'app/lib/release.ts', find: 'ok: missingNames.length === 0,', replace: 'ok: true,', tests: ['app/lib/release.test.ts']},
];

let original;
let current;
function restore() {
  if (current && original !== undefined) writeFileSync(current, original);
}
process.on('SIGINT', () => {
  restore();
  process.exit(130);
});

const rows = [];
try {
  for (const m of MUTATIONS) {
    current = m.file;
    original = readFileSync(m.file, 'utf8');
    const first = original.indexOf(m.find);
    if (first === -1 || original.indexOf(m.find, first + 1) !== -1) {
      rows.push({...m, outcome: 'STALE (pattern not found exactly once)'});
      continue;
    }
    writeFileSync(m.file, original.replace(m.find, () => m.replace));
    const run = spawnSync('npx', ['vitest', 'run', '--reporter=dot', ...m.tests], {encoding: 'utf8'});
    writeFileSync(m.file, original);
    // NOTE: a non-zero exit alone could be a missing test file; require an actual failing test.
    const failedATest = /\d+ failed/.test(`${run.stdout}${run.stderr}`);
    rows.push({...m, outcome: run.status === 0 ? 'SURVIVED' : failedATest ? 'caught' : 'ERROR (no test failed)'});
  }
} finally {
  restore();
}

for (const r of rows) console.log(`${r.outcome.padEnd(9)} ${r.id.padEnd(5)} ${r.what}`);
const bad = rows.filter((r) => r.outcome !== 'caught');
console.log(`\n${rows.length - bad.length}/${rows.length} reintroduced defects caught.`);
process.exitCode = bad.length ? 1 : 0;
