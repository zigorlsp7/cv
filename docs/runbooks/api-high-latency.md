# Runbook: CvApiHighLatencyP95

Alert: `CvApiHighLatencyP95`  
Condition: `cv_api:http_p95_seconds:5m > 0.3` for 5 minutes

## Why this matters

High p95 latency means many users are experiencing slow requests. It often precedes error-rate incidents.

## First 10 minutes

1. Verify if latency increase affects all routes or specific endpoints.
2. Check request rate (`cv_api:http_rps:rate30s`) for traffic spikes.
3. Check DB latency and lock/contention signals.
4. Inspect recent deploys or feature flags that changed query/request paths.

## Triage checklist

- CPU/memory saturation on API or DB?
- Slow external dependency calls?
- N+1 query or missing index behavior?
- Queue backlog or thread/event-loop pressure?

## Mitigation options

1. Roll back recent performance-regressive change.
2. Increase capacity temporarily if load-driven.
3. Cache hot paths or reduce expensive response payloads.
4. Tighten expensive query limits/pagination.

## Exit criteria

- p95 latency is below 300ms for at least 15 minutes.
- No correlated increase in 5xx error ratio.

## Follow-up

- Add endpoint-level latency SLO dashboards.
- Add regression load test for the identified slow path.
