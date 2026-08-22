const ALLOWED_BASES = new Set(['dev', 'main']);
const PROTECTED_HEADS = new Set(['dev', 'main']);

/**
 * Validate the repository's promotion topology.
 *
 * feature/fix/chore branches -> dev -> main
 */
export function validatePullRequest({base, head, repository, headRepository}) {
  const errors = [];

  if (!ALLOWED_BASES.has(base)) {
    errors.push(`Pull requests may only target dev or main; received ${base}.`);
  }

  if (base === 'main' && head !== 'dev') {
    errors.push('Only the dev branch may be promoted into main.');
  }

  if (base === 'dev' && PROTECTED_HEADS.has(head)) {
    errors.push('Pull requests into dev must originate from a dedicated slice branch.');
  }

  if (base === head) {
    errors.push('Pull request head and base branches must differ.');
  }

  if (repository && headRepository && repository !== headRepository) {
    errors.push('Cross-repository pull requests are not permitted for release branches.');
  }

  return errors;
}

function readEnvironment() {
  return {
    base: process.env.PR_BASE ?? '',
    head: process.env.PR_HEAD ?? '',
    repository: process.env.PR_REPOSITORY ?? '',
    headRepository: process.env.PR_HEAD_REPOSITORY ?? '',
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = validatePullRequest(readEnvironment());

  if (errors.length > 0) {
    for (const error of errors) {
      process.stderr.write(`::error::${error}\n`);
    }
    process.exitCode = 1;
  } else {
    process.stdout.write('Pull request branch topology is valid.\n');
  }
}
