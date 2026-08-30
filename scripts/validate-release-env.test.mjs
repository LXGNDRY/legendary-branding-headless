import {describe, expect, it} from 'vitest';
import {missingReleaseEnvironment, RELEASE_ENVIRONMENT_VARIABLES} from './validate-release-env.mjs';

describe('release environment contract', () => {
  it('reports blank values', () => {
    expect(missingReleaseEnvironment({SESSION_SECRET: '  '})).toContain('SESSION_SECRET');
  });

  it('passes when every required value is present', () => {
    const environment = Object.fromEntries(RELEASE_ENVIRONMENT_VARIABLES.map((name) => [name, 'configured']));
    expect(missingReleaseEnvironment(environment)).toEqual([]);
  });
});
