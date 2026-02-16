#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker/compose.yml"
PROFILE_ARGS=(--profile test)
STARTED_BY_HOOK=0

cleanup() {
  if [ "$STARTED_BY_HOOK" -eq 1 ]; then
    docker compose -f "$COMPOSE_FILE" "${PROFILE_ARGS[@]}" rm -sf postgres_test >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

existing_container="$(docker compose -f "$COMPOSE_FILE" "${PROFILE_ARGS[@]}" ps -a -q postgres_test 2>/dev/null || true)"
if [ -z "$existing_container" ]; then
  docker compose -f "$COMPOSE_FILE" "${PROFILE_ARGS[@]}" up -d postgres_test
  STARTED_BY_HOOK=1
fi

i=1
while [ $i -le 60 ]; do
  if docker compose -f "$COMPOSE_FILE" "${PROFILE_ARGS[@]}" exec -T postgres_test pg_isready -U app -d cv_test >/dev/null 2>&1; then
    break
  fi
  sleep 2
  i=$((i + 1))
done

if [ $i -gt 60 ]; then
  echo "postgres_test did not become healthy in time" >&2
  exit 1
fi

export NODE_ENV=test
export PORT=3000
export LOG_LEVEL=info
export DB_HOST=localhost
export DB_PORT=5433
export DB_USER=app
export DB_PASSWORD=app
export DB_NAME=cv_test
export CORS_ORIGINS=http://localhost:3001
export CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
export CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Request-Id
export CORS_EXPOSED_HEADERS=X-Request-Id
export CORS_CREDENTIALS=true
export CORS_MAX_AGE_SECONDS=600
export RATE_LIMIT_TTL_MS=60000
export RATE_LIMIT_LIMIT=100
export TRUST_PROXY=false
export REQUEST_TIMEOUT_MS=30000
export HEADERS_TIMEOUT_MS=30000
export KEEP_ALIVE_TIMEOUT_MS=5000
export REQUEST_BODY_LIMIT=1mb
export OTEL_SERVICE_NAME=cv-api-test
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
export OTEL_TRACES_EXPORTER=otlp
export OTEL_METRICS_EXPORTER=none
export OTEL_LOGS_EXPORTER=none
export FEATURE_FLAGS=swagger_docs=true,rum_ingest=true

npm run migration:run -w @cv/api
npm run test:int:api
npm run test:e2e:api
