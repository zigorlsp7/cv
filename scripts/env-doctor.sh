#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/env-doctor.sh [--mode all|local|prod]

Checks app env-file contract drift across local/prod files.
USAGE
}

MODE="all"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --mode)
      MODE="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

case "$MODE" in
  all|local|prod) ;;
  *)
    echo "Invalid --mode value: $MODE (expected all|local|prod)" >&2
    exit 1
    ;;
esac

APP_LOCAL="docker/.env.app.local"
APP_PROD="docker/.env.app.prod"

error_count=0
warning_count=0

has_key() {
  local file="$1"
  local key="$2"
  grep -Eq "^${key}=" "$file"
}

read_value() {
  local file="$1"
  local key="$2"
  local line
  line="$(grep -E "^${key}=" "$file" | tail -n1 || true)"
  if [ -z "$line" ]; then
    printf ''
    return
  fi
  printf '%s' "${line#*=}"
}

require_file() {
  local file="$1"
  if [ ! -f "$file" ]; then
    echo "ERROR  missing file: $file" >&2
    error_count=$((error_count + 1))
  fi
}

check_required_keys() {
  local file="$1"
  local scope="$2"
  shift 2

  local key value
  for key in "$@"; do
    if ! has_key "$file" "$key"; then
      echo "ERROR  [$scope] missing key: $key ($file)" >&2
      error_count=$((error_count + 1))
      continue
    fi

    value="$(read_value "$file" "$key")"
    if [ -z "$value" ]; then
      echo "ERROR  [$scope] empty value: $key ($file)" >&2
      error_count=$((error_count + 1))
    fi
  done
}

check_present_keys() {
  local file="$1"
  local scope="$2"
  shift 2

  local key
  for key in "$@"; do
    if ! has_key "$file" "$key"; then
      echo "ERROR  [$scope] missing key: $key ($file)" >&2
      error_count=$((error_count + 1))
    fi
  done
}

check_forbidden_keys() {
  local file="$1"
  local scope="$2"
  shift 2

  local key value
  for key in "$@"; do
    if has_key "$file" "$key"; then
      value="$(read_value "$file" "$key")"
      if [ -n "$value" ]; then
        echo "WARN   [$scope] secret-like key should not live in $file: $key" >&2
        warning_count=$((warning_count + 1))
      fi
    fi
  done
}

check_openbao_contract() {
  local file="$1"
  local scope="$2"
  local mount path

  mount="$(read_value "$file" "OPENBAO_KV_MOUNT")"
  path="$(read_value "$file" "OPENBAO_SECRET_PATH")"

  if [ "$mount" != "kv" ]; then
    echo "ERROR  [$scope] OPENBAO_KV_MOUNT must be 'kv' (got '$mount')" >&2
    error_count=$((error_count + 1))
  fi

  if [ "$path" != "cv-web" ]; then
    echo "ERROR  [$scope] OPENBAO_SECRET_PATH must be 'cv-web' (got '$path')" >&2
    error_count=$((error_count + 1))
  fi
}

if [ "$MODE" = "all" ] || [ "$MODE" = "local" ]; then
  require_file "$APP_LOCAL"

  if [ -f "$APP_LOCAL" ]; then
    check_required_keys "$APP_LOCAL" "local-app" \
      CV_SHARED_NETWORK NODE_ENV API_PORT POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB DB_HOST \
      DB_PORT DB_USER DB_PASSWORD DB_NAME LOG_LEVEL CORS_ORIGINS CORS_METHODS \
      CORS_ALLOWED_HEADERS CORS_EXPOSED_HEADERS CORS_CREDENTIALS CORS_MAX_AGE_SECONDS \
      RATE_LIMIT_TTL_MS RATE_LIMIT_LIMIT TRUST_PROXY REQUEST_TIMEOUT_MS HEADERS_TIMEOUT_MS \
      KEEP_ALIVE_TIMEOUT_MS REQUEST_BODY_LIMIT FEATURE_FLAGS OTEL_SERVICE_NAME \
      OTEL_EXPORTER_OTLP_ENDPOINT OPENBAO_ADDR OPENBAO_TOKEN OPENBAO_KV_MOUNT \
      OPENBAO_SECRET_PATH OPENBAO_REQUIRED_KEYS_API OPENBAO_REQUIRED_KEYS_WEB \
      NEXT_PUBLIC_API_BASE_URL NEXT_PUBLIC_RUM_ENABLED NEXT_PUBLIC_RUM_ENDPOINT \
      NEXT_PUBLIC_RELEASE I18N_SOURCE TOLGEE_API_URL TOLGEE_PROJECT_ID
    check_present_keys "$APP_LOCAL" "local-app" \
      GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_OAUTH_REDIRECT_URI ADMIN_GOOGLE_EMAILS
    check_openbao_contract "$APP_LOCAL" "local-app"
    check_forbidden_keys "$APP_LOCAL" "local-app" \
      ADMIN_API_TOKEN AUTH_SESSION_SECRET TOLGEE_API_KEY GOOGLE_CLIENT_SECRET
  fi
fi

if [ "$MODE" = "all" ] || [ "$MODE" = "prod" ]; then
  require_file "$APP_PROD"

  if [ -f "$APP_PROD" ]; then
    check_required_keys "$APP_PROD" "prod-app-template" \
      CV_SHARED_NETWORK API_IMAGE WEB_IMAGE WEB_DOMAIN API_DOMAIN NODE_ENV API_PORT LOG_LEVEL \
      TRUST_PROXY FEATURE_FLAGS DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME POSTGRES_USER \
      POSTGRES_PASSWORD POSTGRES_DB CORS_ORIGINS CORS_METHODS CORS_ALLOWED_HEADERS \
      CORS_EXPOSED_HEADERS CORS_CREDENTIALS CORS_MAX_AGE_SECONDS RATE_LIMIT_TTL_MS \
      RATE_LIMIT_LIMIT REQUEST_TIMEOUT_MS HEADERS_TIMEOUT_MS KEEP_ALIVE_TIMEOUT_MS \
      REQUEST_BODY_LIMIT OTEL_SERVICE_NAME OTEL_EXPORTER_OTLP_ENDPOINT OPENBAO_ADDR \
      OPENBAO_TOKEN OPENBAO_KV_MOUNT OPENBAO_SECRET_PATH OPENBAO_REQUIRED_KEYS_API \
      OPENBAO_REQUIRED_KEYS_WEB NEXT_PUBLIC_API_BASE_URL NEXT_PUBLIC_RUM_ENABLED \
      NEXT_PUBLIC_RUM_ENDPOINT NEXT_PUBLIC_RELEASE I18N_SOURCE TOLGEE_API_URL TOLGEE_PROJECT_ID
    check_present_keys "$APP_PROD" "prod-app-template" GOOGLE_CLIENT_ID
    check_openbao_contract "$APP_PROD" "prod-app-template"
    check_forbidden_keys "$APP_PROD" "prod-app-template" \
      ADMIN_API_TOKEN AUTH_SESSION_SECRET TOLGEE_API_KEY GOOGLE_CLIENT_SECRET
  fi
fi

echo

echo "Env doctor summary:"
echo "  mode: $MODE"
echo "  errors: $error_count"
echo "  warnings: $warning_count"

if [ "$error_count" -gt 0 ]; then
  exit 1
fi

echo "OK: env contract checks passed."
