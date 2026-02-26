# Observability

Observability runtime (Grafana, Prometheus, Loki, tracing backend, alerting) is owned by `platform-ops`.

`cv-web` responsibilities are:

1. Emit API metrics and health endpoints.
2. Emit API/web logs to stdout/stderr for collection by platform agent.
3. Emit OTLP traces/metrics using app env vars (`OTEL_*`).
4. Optionally emit browser RUM events (`NEXT_PUBLIC_RUM_*`).

## App-side Required Env

- `OTEL_SERVICE_NAME`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `NEXT_PUBLIC_RUM_ENABLED`
- `NEXT_PUBLIC_RUM_ENDPOINT`
- `NEXT_PUBLIC_RELEASE`

## Platform-side Ownership

Configure dashboards, alert rules, and notification channels in the `platform-ops` repository.

If you need to debug production observability access/routing, use the `platform-ops` runbooks and workflows.
