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

## Ruleset contract files (R23)

Importable definitions live in `.github/rulesets/dev.json` and `.github/rulesets/main.json` with the exact
check names the workflow emits today. Applying them is an owner/admin action (Settings → Rules → Rulesets →
Import); agents never change repository settings and never weaken a rule to merge remediation.

Decisions the owner must make before importing:
- **Review requirement:** `require_code_owner_review` + one approval means no PR (including agent PRs) merges without
  an owner approval. Drop it on `dev` only if agent merges on green CI are meant to continue.
- **Bypass list:** empty by design (no administrator bypass). Add the owner only for audited emergency recovery.
- **Up-to-date branch:** strict status checks force a branch update before each merge, which serializes PRs.

After import, read the rulesets back and confirm: (1) check names match the PR's check list exactly, (2) a direct push
to `dev`/`main` and a merge with a failing check are both rejected in a safe test, (3) the `claude/* → dev → main`
topology still works.

## Release provenance (R23)

- The deploy job builds with `VITE_RELEASE_SHA=${{ github.sha }}`; the same SHA passed `quality` and `e2e`.
- After deploy, `GET /api/release` on the deployed URL must return `ok:true`, `missing:0` and exactly that SHA,
  or the job fails (it reports presence/count only — never variable names or values).
- Every deploy uploads `release-evidence-<sha>` (SHA, run, lockfile hash, deploy URL, outcome).
- A failed verification prints the last healthy deploy SHA. Recovery is a normal revert PR through CI.
- Still owed: the Oxygen CLI builds its own bundle, so the tested artifact and the deployed artifact are the same
  *commit and lockfile* but not the same bytes; adopting a prebuilt-artifact deploy path needs a supported CLI flow.
