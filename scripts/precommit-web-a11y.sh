#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker/compose.yml"
STACK_SERVICES=(postgres api web)
STARTED_BY_HOOK=0

cleanup() {
  if [ "$STARTED_BY_HOOK" -eq 1 ]; then
    docker compose -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

existing_container="$(
  docker compose -f "$COMPOSE_FILE" ps -a -q web 2>/dev/null || true
)"
if [ -z "$existing_container" ]; then
  docker compose -f "$COMPOSE_FILE" up -d "${STACK_SERVICES[@]}"
  STARTED_BY_HOOK=1
fi

echo "Waiting for API to become healthy..."
i=1
while [ $i -le 60 ]; do
  if curl -fsS http://localhost:3000/v1/health/ready > /dev/null; then
    echo "API is healthy"
    break
  fi
  sleep 2
  i=$((i + 1))
done

if [ $i -gt 60 ]; then
  echo "API did not become healthy in time" >&2
  docker compose -f "$COMPOSE_FILE" logs --no-color api
  exit 1
fi

docker compose -f "$COMPOSE_FILE" exec -T api sh -lc "cd /app/apps/api && npm run migration:run"

echo "Waiting for web to become reachable..."
i=1
while [ $i -le 60 ]; do
  if curl -fsS http://localhost:3001 > /dev/null; then
    echo "Web is reachable"
    break
  fi
  sleep 2
  i=$((i + 1))
done

if [ $i -gt 60 ]; then
  echo "Web did not become reachable in time" >&2
  docker compose -f "$COMPOSE_FILE" logs --no-color web api
  exit 1
fi
WEB_BASE_URL=http://localhost:3001 npm run test:a11y -w web
