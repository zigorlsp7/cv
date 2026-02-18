#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker/compose.yml"
PROFILE_ARGS=(--profile test)
STARTED_BY_HOOK=0
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-cvweb}"
TEST_DB_VOLUME="${PROJECT_NAME}_pgdata_test"

cleanup() {
  if [ "$STARTED_BY_HOOK" -eq 1 ]; then
    docker compose -f "$COMPOSE_FILE" "${PROFILE_ARGS[@]}" rm -sf postgres_test >/dev/null 2>&1 || true
    docker volume rm "$TEST_DB_VOLUME" >/dev/null 2>&1 || true
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

if [ ! -f "apps/api/.env.test" ]; then
  echo "apps/api/.env.test not found" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source apps/api/.env.test
set +a

npm run migration:run -w @cv/api
npm run test:int:api
npm run test:e2e:api
