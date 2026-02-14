# GitHub Governance

## Branch protection (main)

Required checks before merge:

- `CI / Quality (Lint + Typecheck + Build + Unit Coverage)`
- `CI / Secrets Scan (Gitleaks)`
- `CI / Integration + E2E + k6`
- `CI / Security + Supply Chain`
- `CI / Web Smoke (Playwright)`

Apply policy via script:

```bash
./scripts/apply-branch-protection.sh main
```

Prerequisites:

- GitHub CLI installed (`gh`)
- Authenticated with repo admin permissions:
  - `gh auth login`

## Secrets scanning gate

CI job:

- `.github/workflows/ci.yml` job `Secrets Scan (Gitleaks)`

Config:

- `.gitleaks.toml`
