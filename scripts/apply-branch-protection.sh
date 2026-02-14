#!/usr/bin/env sh
set -eu

BRANCH="${1:-main}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required."
  exit 1
fi

REPO="${GITHUB_REPOSITORY:-}"
origin_url=""
if [ -z "$REPO" ]; then
  origin_url="$(git remote get-url origin)"
  REPO="$(printf '%s' "$origin_url" | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')"
fi

if [ -z "$REPO" ] || [ "$REPO" = "$origin_url" ]; then
  echo "Unable to resolve owner/repo. Set GITHUB_REPOSITORY explicitly."
  exit 1
fi

echo "Applying branch protection to $REPO:$BRANCH"

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO/branches/$BRANCH/protection" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "CI / Quality (Lint + Typecheck + Build + Unit Coverage)",
      "CI / Secrets Scan (Gitleaks)",
      "CI / Integration + E2E + k6",
      "CI / Security + Supply Chain",
      "CI / Web Smoke (Playwright)"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
JSON

echo "Branch protection applied successfully."
