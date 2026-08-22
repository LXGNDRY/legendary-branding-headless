import {describe, expect, it} from 'vitest';
import {validatePullRequest} from './validate-pr-governance.mjs';

const repository = 'LXGNDRY/legendary-branding-headless';

function validate(base, head, headRepository = repository) {
  return validatePullRequest({base, head, repository, headRepository});
}

describe('pull request governance', () => {
  it('allows a dedicated slice branch into dev', () => {
    expect(validate('dev', 'fix/cart-checkout')).toEqual([]);
  });

  it('allows only dev to promote into main', () => {
    expect(validate('main', 'dev')).toEqual([]);
    expect(validate('main', 'fix/cart-checkout')).toContain(
      'Only the dev branch may be promoted into main.',
    );
  });

  it('rejects protected branches as dev feature heads', () => {
    expect(validate('dev', 'main')).not.toEqual([]);
    expect(validate('dev', 'dev')).not.toEqual([]);
  });

  it('rejects unsupported base branches', () => {
    expect(validate('staging', 'fix/cart-checkout')).toContain(
      'Pull requests may only target dev or main; received staging.',
    );
  });

  it('rejects cross-repository release branches', () => {
    expect(validate('dev', 'fix/cart-checkout', 'someone/fork')).toContain(
      'Cross-repository pull requests are not permitted for release branches.',
    );
  });
});
