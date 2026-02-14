#!/usr/bin/env sh
set -eu

ENV_FILE="${1:-.env.alerts}"
TEMPLATE_FILE="docker/alertmanager.email.tpl.yml"
OUTPUT_FILE="docker/alertmanager.yml"

if ! command -v envsubst >/dev/null 2>&1; then
  echo "envsubst is required. Install gettext first."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  cp .env.alerts.example "$ENV_FILE"
  echo "Created $ENV_FILE from template."
  echo "Set SMTP_AUTH_PASSWORD in $ENV_FILE, then rerun this script."
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

for var in SMTP_SMARTHOST SMTP_FROM SMTP_AUTH_USERNAME SMTP_AUTH_PASSWORD ALERT_EMAIL_TO; do
  eval "value=\${$var:-}"
  if [ -z "$value" ]; then
    echo "Missing required variable: $var in $ENV_FILE"
    exit 1
  fi
done

if [ "${SMTP_AUTH_PASSWORD}" = "replace-with-gmail-app-password" ]; then
  echo "Set SMTP_AUTH_PASSWORD in $ENV_FILE before running this script."
  exit 1
fi

envsubst < "$TEMPLATE_FILE" > "$OUTPUT_FILE"
echo "Rendered $OUTPUT_FILE from $TEMPLATE_FILE"

docker compose -f docker/compose.yml up -d alertmanager
echo "Alertmanager restarted with email receiver: $ALERT_EMAIL_TO"
