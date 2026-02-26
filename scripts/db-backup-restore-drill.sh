#!/usr/bin/env sh
set -eu

COMPOSE_FILES="docker/compose.ci.yml"
COMPOSE_PROFILE="test"
POSTGRES_SERVICE="postgres_test"
DB_USER="app"
DB_PASSWORD="app"
SOURCE_DB="cv_test"
RESTORE_DB="cv_restore_drill"
DUMP_FILE="/tmp/${SOURCE_DB}_drill.sql"

COMPOSE_ARGS=""
for file in $COMPOSE_FILES; do
  COMPOSE_ARGS="$COMPOSE_ARGS -f $file"
done

docker compose $COMPOSE_ARGS --profile "$COMPOSE_PROFILE" exec -T "$POSTGRES_SERVICE" sh -lc "
set -eu
export PGPASSWORD='$DB_PASSWORD'
pg_dump -U '$DB_USER' -d '$SOURCE_DB' > '$DUMP_FILE'
dropdb -U '$DB_USER' --if-exists '$RESTORE_DB'
createdb -U '$DB_USER' '$RESTORE_DB'
psql -U '$DB_USER' -d '$RESTORE_DB' -f '$DUMP_FILE' >/dev/null
psql -U '$DB_USER' -d '$RESTORE_DB' -Atc \"SELECT to_regclass('public.migrations');\" | grep -qx migrations
psql -U '$DB_USER' -d '$RESTORE_DB' -Atc \"SELECT to_regclass('public.outbox_events');\" | grep -qx outbox_events
psql -U '$DB_USER' -d '$RESTORE_DB' -Atc \"SELECT to_regclass('public.processed_messages');\" | grep -qx processed_messages
echo 'Backup/restore drill passed'
"
