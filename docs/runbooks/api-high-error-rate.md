# Runbook: CvApiHighErrorRate

Alert: `CvApiHighErrorRate`  
Condition: `cv_api:http_error_ratio:rate5m > 0.02` for 5 minutes

## Why this matters

The API is returning too many 5xx responses. This usually indicates a backend dependency issue, a deployment regression, or resource exhaustion.

## First 10 minutes

1. Check `/v1/health/ready` and `/v1/health/live`.
2. In Grafana/Prometheus, confirm if `http_requests_total{status=~"5.."}` increased suddenly.
3. Check recent deploy/change window and logs for stack traces.
4. Verify Postgres connectivity and saturation (connections/timeouts).

## Triage checklist

- Is error rate global or endpoint-specific?
- Is it isolated to one instance/container?
- Did latency spike before errors?
- Are there DB pool timeout or connection reset errors?

## Mitigation options

1. Roll back the last deployment if error started right after deploy.
2. Temporarily reduce load (traffic shaping/rate-limits) if system is saturated.
3. Restart unhealthy API instances if stuck resources are suspected.

## Exit criteria

- Error ratio remains below 1% for at least 15 minutes.
- Health endpoints stable and no sustained new 5xx bursts.

## Follow-up

- Add/adjust tests for regression path.
- Add targeted metrics/log fields for the failing endpoint/dependency.
