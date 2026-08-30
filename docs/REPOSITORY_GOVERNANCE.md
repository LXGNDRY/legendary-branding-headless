# Repository Governance

## Required promotion path

```text
feature/fix/chore branch -> dev -> main
```

- All implementation pull requests target `dev`.
- Only `dev` may open a release pull request into `main`.
- Direct feature pull requests into `main` are rejected by `PR Governance`.
- A green workflow is evidence, not approval.
- Every pull request requires explicit owner approval.

## Required GitHub rulesets

Repository-side workflows cannot prevent a direct push by an administrator.
Configure GitHub rulesets for both protected branches with the following exact
requirements.

### `dev`

- Restrict deletions and force pushes.
- Require a pull request before merging.
- Require one approving review from a Code Owner.
- Dismiss stale approvals when new commits are pushed.
- Require all review conversations to be resolved.
- Require the branch to be up to date before merging.
- Require these status checks:
  - `Branch Topology`
  - `Quality Gate (codegen + typecheck + lint + test + build)`
  - all browser E2E checks introduced by the authoritative-CI slice
- Block direct pushes and restrict bypass to the repository owner for emergency
  recovery only.

### `main`

- Apply every `dev` restriction.
- Accept pull requests only from `dev`; the `Branch Topology` check enforces
  this in CI.
- Require the production release, deployed-smoke, accessibility and commerce
  checks introduced by later slices.
- Disable automatic deletion, force push and administrator bypass during a
  release.

## Emergency changes

An emergency does not justify an unaudited direct production edit. Create a
minimal hotfix branch from `main`, reproduce the fix on a slice branch targeting
`dev`, validate it, promote `dev` into `main`, and document the rollback SHA.

## Connector limitation

The connected GitHub integration can create branches, commits, pull requests,
reviews and merges, but does not expose repository ruleset or branch-protection
administration. The rules above must be enabled in GitHub settings and then
verified by attempting a blocked direct push and an unapproved PR merge.
