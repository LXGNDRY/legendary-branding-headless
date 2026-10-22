import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {RELEASE_ENVIRONMENT_VARIABLES, releaseStatus} from './release';

const full = Object.fromEntries(RELEASE_ENVIRONMENT_VARIABLES.map((n) => [n, 'x']));

describe('releaseStatus', () => {
  it('is ok when every contract variable is present', () => {
    expect(releaseStatus(full, 'ABCDEF1234567').status).toEqual({ok: true, sha: 'abcdef1234567', missing: 0});
  });
  it('counts missing and blank variables without exposing names in the status', () => {
    const {status, missingNames} = releaseStatus({...full, SESSION_SECRET: '  ', PUBLIC_STOREFRONT_ID: undefined}, undefined);
    expect(status).toEqual({ok: false, sha: 'unknown', missing: 2});
    expect(missingNames).toEqual(['SESSION_SECRET', 'PUBLIC_STOREFRONT_ID']);
    expect(JSON.stringify(status)).not.toContain('SESSION_SECRET');
  });
  it('rejects a malformed sha rather than echoing it', () => {
    expect(releaseStatus(full, '<script>').status.sha).toBe('unknown');
  });
  it('matches the release-env validation script contract', () => {
    const script = readFileSync(new URL('../../scripts/validate-release-env.mjs', import.meta.url), 'utf8');
    const listed = [...script.slice(0, script.indexOf(']')).matchAll(/'([A-Z0-9_]+)'/g)].map((m) => m[1]);
    expect(listed).toEqual([...RELEASE_ENVIRONMENT_VARIABLES]);
  });
});
