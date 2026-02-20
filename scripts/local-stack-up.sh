#!/usr/bin/env bash
set -euo pipefail

APP_ENV_FILE="docker/.env.app.local"
OPS_ENV_FILE="docker/.env.ops.local"
SECRETS_ENV_FILE="docker/.env.secrets.local"
NETWORK_NAME="${CV_SHARED_NETWORK:-cv_shared}"
OPENBAO_LOCAL_ADDR="${OPENBAO_LOCAL_ADDR:-http://localhost:8200}"

read_env_var_from_file() {
  local file="$1"
  local key="$2"
  local line
  line="$(grep -E "^${key}=" "$file" | tail -n1 || true)"
  if [ -z "${line:-}" ]; then
    printf ''
    return
  fi
  printf '%s' "${line#*=}"
}

if [ ! -f "$APP_ENV_FILE" ]; then
  echo "Missing $APP_ENV_FILE. Create it and fill required values." >&2
  exit 1
fi

if [ ! -f "$OPS_ENV_FILE" ]; then
  echo "Missing $OPS_ENV_FILE. Create it and fill required values." >&2
  exit 1
fi

if [ ! -f "$SECRETS_ENV_FILE" ]; then
  echo "Missing $SECRETS_ENV_FILE. Add runtime secrets there (ADMIN_API_TOKEN, AUTH_SESSION_SECRET, TOLGEE_API_KEY)." >&2
  exit 1
fi

openbao_addr="$(read_env_var_from_file "$APP_ENV_FILE" "OPENBAO_ADDR")"
openbao_token="$(read_env_var_from_file "$APP_ENV_FILE" "OPENBAO_TOKEN")"
openbao_kv_mount="$(read_env_var_from_file "$APP_ENV_FILE" "OPENBAO_KV_MOUNT")"
openbao_secret_path="$(read_env_var_from_file "$APP_ENV_FILE" "OPENBAO_SECRET_PATH")"
openbao_dev_root_token="$(read_env_var_from_file "$OPS_ENV_FILE" "OPENBAO_DEV_ROOT_TOKEN")"

if [ -z "${openbao_addr:-}" ] || [ -z "${openbao_token:-}" ] || [ -z "${openbao_kv_mount:-}" ] || [ -z "${openbao_secret_path:-}" ]; then
  echo "OPENBAO_ADDR, OPENBAO_TOKEN, OPENBAO_KV_MOUNT and OPENBAO_SECRET_PATH are required in $APP_ENV_FILE" >&2
  exit 1
fi

if [ -z "${openbao_dev_root_token:-}" ]; then
  echo "OPENBAO_DEV_ROOT_TOKEN is required in $OPS_ENV_FILE" >&2
  exit 1
fi

if [ "$openbao_token" != "$openbao_dev_root_token" ]; then
  echo "Warning: OPENBAO_TOKEN and OPENBAO_DEV_ROOT_TOKEN differ. Ensure OPENBAO_TOKEN has read access to ${openbao_kv_mount}/${openbao_secret_path}." >&2
fi

set -a
# shellcheck disable=SC1090
source "$SECRETS_ENV_FILE"
set +a

required_secret_vars=(ADMIN_API_TOKEN AUTH_SESSION_SECRET TOLGEE_API_KEY)
for required_var in "${required_secret_vars[@]}"; do
  if [ -z "${!required_var:-}" ]; then
    echo "$required_var is required in $SECRETS_ENV_FILE" >&2
    exit 1
  fi
done

docker network create "$NETWORK_NAME" >/dev/null 2>&1 || true

docker compose --env-file "$OPS_ENV_FILE" -f docker/compose.ops.local.yml up -d

echo "Waiting for OpenBao to become ready..."
i=1
while [ $i -le 60 ]; do
  if curl -fsS "$OPENBAO_LOCAL_ADDR/v1/sys/health" >/dev/null; then
    echo "OpenBao is ready"
    break
  fi
  sleep 2
  i=$((i + 1))
done

if [ $i -gt 60 ]; then
  echo "OpenBao did not become ready in time" >&2
  docker compose --env-file "$OPS_ENV_FILE" -f docker/compose.ops.local.yml logs --no-color --tail=120 openbao || true
  exit 1
fi

mount_path="${openbao_kv_mount%/}"
mounts_json="$(curl -fsS -H "X-Vault-Token: $openbao_dev_root_token" "$OPENBAO_LOCAL_ADDR/v1/sys/mounts")"
if ! MOUNT_PATH="$mount_path" node -e '
const fs = require("node:fs");
const mounts = JSON.parse(fs.readFileSync(0, "utf8"));
const mountPath = `${process.env.MOUNT_PATH}/`;
process.exit(Object.prototype.hasOwnProperty.call(mounts, mountPath) ? 0 : 1);
' <<<"$mounts_json"; then
  echo "OpenBao mount '$mount_path' does not exist. Create it (kv-v2) or set OPENBAO_KV_MOUNT to an existing mount." >&2
  exit 1
fi

secret_payload="$(
  OPENBAO_SECRET_KEYS="ADMIN_API_TOKEN,AUTH_SESSION_SECRET,TOLGEE_API_KEY,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,GOOGLE_OAUTH_REDIRECT_URI,ADMIN_GOOGLE_EMAILS" \
  node -e '
const keys = (process.env.OPENBAO_SECRET_KEYS ?? "").split(",").map((k) => k.trim()).filter(Boolean);
const data = {};
for (const key of keys) {
  const value = process.env[key];
  if (typeof value === "string" && value.length > 0) {
    data[key] = value;
  }
}
process.stdout.write(JSON.stringify({ data }));
'
)"

curl -fsS \
  -H "X-Vault-Token: $openbao_dev_root_token" \
  -H "Content-Type: application/json" \
  -X POST \
  --data "$secret_payload" \
  "$OPENBAO_LOCAL_ADDR/v1/${mount_path}/data/${openbao_secret_path#/}" >/dev/null

echo "Seeded OpenBao path ${mount_path}/${openbao_secret_path#/} with local runtime secrets."

docker compose --env-file "$APP_ENV_FILE" -f docker/compose.app.local.yml up -d --build
docker compose --env-file "$APP_ENV_FILE" -f docker/compose.app.local.yml --profile tools run --rm --build api_migrate
