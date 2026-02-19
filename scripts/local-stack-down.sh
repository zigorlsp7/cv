#!/usr/bin/env bash
set -euo pipefail

APP_ENV_FILE="docker/.env.app.local"
OPS_ENV_FILE="docker/.env.ops.local"

if [ ! -f "$APP_ENV_FILE" ]; then
  echo "Missing $APP_ENV_FILE. Create it and fill required values." >&2
  exit 1
fi

if [ ! -f "$OPS_ENV_FILE" ]; then
  echo "Missing $OPS_ENV_FILE. Create it and fill required values." >&2
  exit 1
fi

docker compose --env-file "$APP_ENV_FILE" -f docker/compose.app.local.yml down
docker compose --env-file "$OPS_ENV_FILE" -f docker/compose.ops.local.yml down
