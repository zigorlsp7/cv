#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker/compose.precommit.yml"
PROJECT_NAME="cv-precommit"
TEST_DB_VOLUME="${PROJECT_NAME}_pgdata_test"
STARTED_POSTGRES=0
STARTED_API_TEST=0
TARGET="${1:-all}"

case "$TARGET" in
  migration|int|e2e|all) ;;
  *)
    echo "Usage: $0 [migration|int|e2e|all]" >&2
    exit 1
    ;;
esac

cleanup() {
  if [ "$STARTED_API_TEST" -eq 1 ]; then
    docker compose -f "$COMPOSE_FILE" rm -sf api_test >/dev/null 2>&1 || true
  fi
  if [ "$STARTED_POSTGRES" -eq 1 ]; then
    docker compose -f "$COMPOSE_FILE" rm -sf postgres_test >/dev/null 2>&1 || true
    docker volume rm "$TEST_DB_VOLUME" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

postgres_container="$(docker compose -f "$COMPOSE_FILE" ps -q postgres_test 2>/dev/null || true)"
if [ -z "$postgres_container" ]; then
  docker compose -f "$COMPOSE_FILE" up -d postgres_test
  STARTED_POSTGRES=1
fi

i=1
while [ $i -le 60 ]; do
  if docker compose -f "$COMPOSE_FILE" exec -T postgres_test pg_isready -U app -d cv_test >/dev/null 2>&1; then
    break
  fi
  sleep 2
  i=$((i + 1))
done

if [ $i -gt 60 ]; then
  echo "postgres_test did not become healthy in time" >&2
  exit 1
fi

api_container="$(docker compose -f "$COMPOSE_FILE" ps -q api_test 2>/dev/null || true)"
if [ -z "$api_container" ]; then
  docker compose -f "$COMPOSE_FILE" up -d --build api_test
  STARTED_API_TEST=1
fi

docker compose -f "$COMPOSE_FILE" exec -T api_test sh -lc "cd /app/apps/api && npm run migration:run"

if [ "$TARGET" = "int" ] || [ "$TARGET" = "all" ]; then
  docker compose -f "$COMPOSE_FILE" exec -T api_test sh -lc "cd /app/apps/api && npm run test:int -- --watchman=false --detectOpenHandles"
fi

if [ "$TARGET" = "e2e" ] || [ "$TARGET" = "all" ]; then
  docker compose -f "$COMPOSE_FILE" exec -T api_test sh -lc "cd /app/apps/api && npm run test:e2e -- --watchman=false --detectOpenHandles"
fi
