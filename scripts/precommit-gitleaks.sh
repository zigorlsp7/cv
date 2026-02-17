#!/usr/bin/env bash
set -euo pipefail

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks is not installed. Install it to run secret scans." >&2
  echo "macOS (brew): brew install gitleaks" >&2
  echo "Other: https://github.com/gitleaks/gitleaks#installation" >&2
  exit 1
fi

gitleaks detect --source . --no-git --redact --config .gitleaks.toml
