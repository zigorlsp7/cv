#!/usr/bin/env bash
set -euo pipefail

if [ ! -f "docker/infisical/.env" ]; then
  echo "docker/infisical/.env not found. Create it first." >&2
  exit 1
fi

set -a
source docker/infisical/.env
set +a

docker compose -f docker/compose.yml up -d infisical infisical_db infisical_redis

cat <<'EOF'
Infisical is starting at http://localhost:8091

Next steps in the UI:
1) Create project "CV-web"
2) Create environment "dev"
3) Add secret: TOLGEE_API_KEY
4) Create a Service Token for env "dev"
5) Export:
   export INFISICAL_PROJECT_ID=...
   export INFISICAL_TOKEN=...

Then start web:
  docker compose -f docker/compose.yml up -d web
EOF
