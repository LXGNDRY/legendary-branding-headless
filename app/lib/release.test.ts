import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {RELEASE_ENVIRONMENT_VARIABLES, releaseProbe, releaseStatus} from './release';

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

describe('releaseProbe', () => {
  const req = (path: string, method = 'GET') => new Request(`https://example.com${path}`, {method});

  it('ignores other paths', () => {
    expect(releaseProbe(req('/'), full, 'abc1234')).toBeNull();
  });
  it('answers 200 with status when the contract is complete', async () => {
    const probe = releaseProbe(req('/api/release'), full, 'abc1234');
    expect(probe?.response.status).toBe(200);
    expect(await probe?.response.json()).toEqual({ok: true, sha: 'abc1234', missing: 0});
    expect(probe?.failure).toBeNull();
  });
  it('answers 503 (not a thrown error) even when bootstrap variables are missing, and reports the names privately', async () => {
    const probe = releaseProbe(req('/api/release'), {}, 'abc1234');
    expect(probe?.response.status).toBe(503);
    expect(JSON.stringify(await probe?.response.json())).not.toContain('SESSION_SECRET');
    expect(probe?.failure).toContain('SESSION_SECRET');
  });
  it('rejects non-GET methods', () => {
    expect(releaseProbe(req('/api/release', 'POST'), full, 'abc')?.response.status).toBe(405);
  });
});
