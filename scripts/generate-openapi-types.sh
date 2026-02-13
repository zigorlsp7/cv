#!/usr/bin/env sh
set -eu

SPEC_URL="${1:-http://localhost:3000/docs-json}"
OUT_FILE="apps/web/src/lib/api/generated.ts"

mkdir -p "$(dirname "$OUT_FILE")"

npx --yes openapi-typescript "$SPEC_URL" --output "$OUT_FILE"
echo "Generated $OUT_FILE from $SPEC_URL"
