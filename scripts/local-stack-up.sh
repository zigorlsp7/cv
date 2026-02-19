#!/usr/bin/env bash
set -euo pipefail

APP_ENV_FILE="docker/.env.app.local"
OPS_ENV_FILE="docker/.env.ops.local"
NETWORK_NAME="${CV_SHARED_NETWORK:-cv_shared}"

if [ ! -f "$APP_ENV_FILE" ]; then
  echo "Missing $APP_ENV_FILE. Create it and fill required values." >&2
  exit 1
fi

if [ ! -f "$OPS_ENV_FILE" ]; then
  echo "Missing $OPS_ENV_FILE. Create it and fill required values." >&2
  exit 1
fi

infisical_api_url="$(grep -E '^INFISICAL_API_URL=' "$APP_ENV_FILE" | tail -n1 | cut -d= -f2-)"
infisical_project_id="$(grep -E '^INFISICAL_PROJECT_ID=' "$APP_ENV_FILE" | tail -n1 | cut -d= -f2-)"
infisical_env="$(grep -E '^INFISICAL_ENV=' "$APP_ENV_FILE" | tail -n1 | cut -d= -f2-)"
infisical_token="$(grep -E '^INFISICAL_TOKEN=' "$APP_ENV_FILE" | tail -n1 | cut -d= -f2-)"

if [ -z "${infisical_api_url:-}" ] || [ -z "${infisical_project_id:-}" ] || [ -z "${infisical_env:-}" ] || [ -z "${infisical_token:-}" ]; then
  echo "INFISICAL_API_URL, INFISICAL_PROJECT_ID, INFISICAL_ENV and INFISICAL_TOKEN are required in $APP_ENV_FILE" >&2
  exit 1
fi

docker network create "$NETWORK_NAME" >/dev/null 2>&1 || true

docker compose --env-file "$OPS_ENV_FILE" -f docker/compose.ops.local.yml up -d
docker compose --env-file "$APP_ENV_FILE" -f docker/compose.app.local.yml up -d --build
docker compose --env-file "$APP_ENV_FILE" -f docker/compose.app.local.yml --profile tools run --rm api_migrate
