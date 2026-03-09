# GitHub Governance

## Branch protection (main)

Required checks before merge:

- `CI / Quality (Lint + Typecheck + Build + Unit Coverage)`
- `CI / Secrets Scan (Gitleaks)`
- `CI / Integration + E2E + k6`
- `CI / Security + Supply Chain`
- `CI / Web Smoke (Playwright)`
- `CodeQL / Analyze (javascript-typescript)`
- `Commitlint / pr-title`

Apply policy in GitHub:

- Repository `Settings` -> `Branches`
- Edit the protection rule for `main` with the required checks above

Prerequisites:

- Repo admin access to edit branch protection rules

## Secrets scanning gate

CI job:

- `.github/workflows/ci.yml` job `Secrets Scan (Gitleaks)`

Config:

- `.gitleaks.toml`

## Release Please trigger notes

- Release Please skips publishing when no user-facing conventional commits are found since the last release.
- Use at least one `fix:` or `feat:` commit in the merged PR when you need a new release to be created.
