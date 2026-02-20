#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage:
  $0 \
    --release-dir <path> \
    --region <aws-region> \
    --app-ssm-prefix </cv-web/prod/app> \
    --ops-ssm-prefix </cv-web/prod/ops> \
    --api-image <ecr-uri:tag> \
    --web-image <ecr-uri:tag> \
    --release-tag <tag>
USAGE
}

RELEASE_DIR=""
AWS_REGION=""
APP_SSM_PREFIX=""
OPS_SSM_PREFIX=""
API_IMAGE=""
WEB_IMAGE=""
RELEASE_TAG=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --release-dir)
      RELEASE_DIR="$2"
      shift 2
      ;;
    --region)
      AWS_REGION="$2"
      shift 2
      ;;
    --app-ssm-prefix)
      APP_SSM_PREFIX="$2"
      shift 2
      ;;
    --ops-ssm-prefix)
      OPS_SSM_PREFIX="$2"
      shift 2
      ;;
    --api-image)
      API_IMAGE="$2"
      shift 2
      ;;
    --web-image)
      WEB_IMAGE="$2"
      shift 2
      ;;
    --release-tag)
      RELEASE_TAG="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [ -z "$RELEASE_DIR" ] || [ -z "$AWS_REGION" ] || [ -z "$APP_SSM_PREFIX" ] || [ -z "$OPS_SSM_PREFIX" ] || [ -z "$API_IMAGE" ] || [ -z "$WEB_IMAGE" ] || [ -z "$RELEASE_TAG" ]; then
  usage
  exit 1
fi

retry() {
  local attempts="$1"
  local sleep_seconds="$2"
  shift 2
  local i=1

  while true; do
    if "$@"; then
      return 0
    fi

    if [ "$i" -ge "$attempts" ]; then
      return 1
    fi

    sleep "$sleep_seconds"
    i=$((i + 1))
  done
}

ensure_runtime_dependencies() {
  local packages=()

  if ! command -v aws >/dev/null 2>&1; then
    packages+=("awscli")
  fi

  if ! command -v jq >/dev/null 2>&1; then
    packages+=("jq")
  fi

  if ! command -v curl >/dev/null 2>&1; then
    packages+=("curl")
  fi

  if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
    packages+=("docker" "docker-compose-plugin")
  fi

  if [ "${#packages[@]}" -gt 0 ]; then
    if ! command -v dnf >/dev/null 2>&1; then
      echo "Missing required dependencies and dnf is unavailable for install: ${packages[*]}" >&2
      exit 1
    fi

    echo "[deploy] Installing missing runtime dependencies: ${packages[*]}"
    retry 12 10 dnf install -y "${packages[@]}"
  fi

  if command -v docker >/dev/null 2>&1 && command -v systemctl >/dev/null 2>&1; then
    systemctl enable --now docker >/dev/null 2>&1 || true
    systemctl start docker >/dev/null 2>&1 || true
  fi
}

ensure_runtime_dependencies

for cmd in aws jq docker curl; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing command: $cmd" >&2
    exit 1
  fi
done

if ! docker compose version >/dev/null 2>&1; then
  echo "Missing command: docker compose (Docker Compose plugin)" >&2
  exit 1
fi

if [ ! -d "$RELEASE_DIR" ]; then
  echo "Release dir not found: $RELEASE_DIR" >&2
  exit 1
fi

cd "$RELEASE_DIR"

APP_ENV_FILE="docker/.env.app.prod"
OPS_ENV_FILE="docker/.env.ops.prod"

fetch_ssm_path_to_env_file() {
  local prefix="$1"
  local output_file="$2"
  local response
  local count

  response="$(aws ssm get-parameters-by-path --region "$AWS_REGION" --path "$prefix" --recursive --with-decryption --output json)"
  count="$(printf '%s' "$response" | jq '.Parameters | length')"

  if [ "$count" -eq 0 ]; then
    echo "No SSM parameters found under $prefix" >&2
    exit 1
  fi

  printf '%s' "$response" \
    | jq -r '.Parameters | sort_by(.Name)[] | "\(.Name | split("/") | last)=\(.Value)"' > "$output_file"

  chmod 600 "$output_file"
}

upsert_env_var() {
  local file="$1"
  local key="$2"
  local value="$3"
  local tmp

  tmp="$(mktemp)"

  awk -v key="$key" -v value="$value" -F= '
    BEGIN { updated=0 }
    $1 == key { print key "=" value; updated=1; next }
    { print }
    END { if (!updated) print key "=" value }
  ' "$file" > "$tmp"

  mv "$tmp" "$file"
}

fetch_ssm_path_to_env_file "$APP_SSM_PREFIX" "$APP_ENV_FILE"
fetch_ssm_path_to_env_file "$OPS_SSM_PREFIX" "$OPS_ENV_FILE"

upsert_env_var "$APP_ENV_FILE" "API_IMAGE" "$API_IMAGE"
upsert_env_var "$APP_ENV_FILE" "WEB_IMAGE" "$WEB_IMAGE"
upsert_env_var "$APP_ENV_FILE" "NEXT_PUBLIC_RELEASE" "$RELEASE_TAG"

network_name="$(grep -E '^CV_SHARED_NETWORK=' "$APP_ENV_FILE" | tail -n1 | cut -d'=' -f2- || true)"
if [ -z "$network_name" ]; then
  network_name="cv_shared"
fi

docker network create "$network_name" >/dev/null 2>&1 || true

echo "[deploy] Starting ops stack"
docker compose --env-file "$OPS_ENV_FILE" -f docker/compose.ops.prod.yml up -d

echo "[deploy] Waiting for OpenBao health"
i=1
while [ $i -le 60 ]; do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8200/v1/sys/health || true)"
  if [ "$code" = "200" ] || [ "$code" = "429" ]; then
    break
  fi
  sleep 2
  i=$((i + 1))
done

if [ $i -gt 60 ]; then
  echo "OpenBao did not become ready (expected 200/429). It may be sealed." >&2
  docker compose --env-file "$OPS_ENV_FILE" -f docker/compose.ops.prod.yml logs --no-color --tail=120 openbao || true
  exit 1
fi

echo "[deploy] Starting app stack"
docker compose --env-file "$APP_ENV_FILE" -f docker/compose.app.prod.yml up -d

echo "[deploy] Running migrations"
docker compose --env-file "$APP_ENV_FILE" -f docker/compose.app.prod.yml --profile tools run --rm api_migrate

api_domain="$(grep -E '^API_DOMAIN=' "$APP_ENV_FILE" | tail -n1 | cut -d'=' -f2- || true)"
web_domain="$(grep -E '^WEB_DOMAIN=' "$APP_ENV_FILE" | tail -n1 | cut -d'=' -f2- || true)"

if [ -z "$api_domain" ] || [ -z "$web_domain" ]; then
  echo "API_DOMAIN and WEB_DOMAIN must be present in $APP_ENV_FILE" >&2
  exit 1
fi

echo "[deploy] Health checking API via Caddy"
curl -fsS -H "Host: $api_domain" http://127.0.0.1/v1/health/ready >/dev/null

echo "[deploy] Health checking web via Caddy"
curl -fsS -H "Host: $web_domain" http://127.0.0.1/ >/dev/null


docker compose --env-file "$APP_ENV_FILE" -f docker/compose.app.prod.yml ps

echo "[deploy] Release $RELEASE_TAG deployed successfully"
