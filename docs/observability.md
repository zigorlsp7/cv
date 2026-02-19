# Observability

This project includes a local observability stack in `docker/compose.yml`:

- `Prometheus` for metrics and recording/alert rules
- `Alertmanager` for alert routing
- `Grafana` for dashboards
- `Loki` + `Alloy` for logs
- `Jaeger` + `OTEL Collector` for traces
- Optional browser RUM ingest endpoint (`/v1/rum/events`)

## Bring up the stack

```bash
docker compose -f docker/compose.yml up -d api prometheus alertmanager grafana loki alloy jaeger otel-collector
```

Access points:

- Prometheus: `http://localhost:9090`
- Alertmanager: `http://localhost:9093`
- Grafana: `http://localhost:3002` (`cv_admin` / `change-this-admin-password` by default, override with `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`)
- Jaeger: `http://localhost:16686`

## Alert wiring

- Recording rules: `docker/prometheus.rules.yml`
- Alert rules: `docker/prometheus.alerts.yml`
- Alertmanager routes/receivers: `docker/alertmanager.yml`
- Production channels template: `docker/alertmanager.prod.yml`

Prometheus loads both rule files and sends firing alerts to Alertmanager.

## Real notification channels

Local compose defaults to `docker/alertmanager.yml` (local webhook receiver).

### Quick setup: email to Gmail

1. Export required env vars in your shell:
   - `export SMTP_SMARTHOST=smtp.gmail.com:587`
   - `export SMTP_FROM=your-alerts@example.com`
   - `export SMTP_AUTH_USERNAME=your-account@example.com`
   - `export SMTP_AUTH_PASSWORD=your-gmail-app-password`
   - `export ALERT_EMAIL_TO=you@example.com`
2. Render Alertmanager config:
   - `envsubst < docker/alertmanager.email.tpl.yml > docker/alertmanager.yml`
3. Restart Alertmanager:
   - `docker compose -f docker/compose.yml up -d alertmanager`

### Full setup: Slack/PagerDuty/Email

1. Copy `docker/alertmanager.prod.yml` to your deployment config path.
2. Set required env vars:
   - `SLACK_WEBHOOK_URL`
   - `SLACK_CHANNEL`
   - `PAGERDUTY_ROUTING_KEY`
   - `SMTP_SMARTHOST`
   - `SMTP_FROM`
   - `SMTP_AUTH_USERNAME`
   - `SMTP_AUTH_PASSWORD`
   - `ALERT_EMAIL_TO`
3. Render the config with env substitution before starting Alertmanager, for example:
   - `envsubst < docker/alertmanager.prod.yml > /tmp/alertmanager.rendered.yml`
   - Start Alertmanager with `--config.file=/tmp/alertmanager.rendered.yml`.

## Validation flow

1. Open Prometheus and verify both files were loaded in `Status -> Rules`.
2. Open Alertmanager and verify active route/receiver config.
3. Trigger traffic:
   - `docker compose -f docker/compose.yml --profile loadtest up --abort-on-container-exit --exit-code-from k6 k6`
4. Confirm rule time series exist:
   - `cv_api:http_rps:rate30s`
   - `cv_api:http_error_ratio:rate5m`
   - `cv_api:http_p95_seconds:5m`
5. Force-test one alert delivery path:
   - In Prometheus expression browser, run:
     - `ALERTS{alertname="CvApiHighLatencyP95"}`
   - Then temporarily lower threshold in `docker/prometheus.alerts.yml` and reload Prometheus.

## Runbooks

- `docs/runbooks/api-high-error-rate.md`
- `docs/runbooks/api-high-latency.md`
- `docs/runbooks/request-debugging.md`

## Runtime feature flags

Runtime feature flags are configured in API env with:

- `FEATURE_FLAGS=swagger_docs=true,rum_ingest=true`

Current built-in flags:

- `swagger_docs` (controls OpenAPI UI/docs-json exposure)
- `rum_ingest` (controls `/v1/rum/events` availability)
