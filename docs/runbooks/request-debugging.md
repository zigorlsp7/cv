# Runbook: Debug A Single Request

Use this flow when a request is reported as failing or slow.

## Inputs

- `requestId` (from API response header/body/logs)
- Approximate timestamp
- Endpoint path and method

## Steps

1. Find the request in API logs using `requestId`.
2. Check the same request in traces (Jaeger) to see span breakdown.
3. Confirm HTTP status, latency, and downstream DB/dependency spans.
4. Correlate with metrics:
   - `http_requests_total` by route/status
   - `http_request_duration_seconds_*` by route
5. If DB involved, validate query plan/index for slow query path.

## Common outcomes

- App bug/regression: create fix + regression test.
- Dependency slowdown: add timeout/retry/circuit policy review.
- Capacity issue: autoscaling/limits and query optimization.

## What to capture in incident notes

- Request ID(s)
- Trace ID(s)
- Failing endpoint + status code pattern
- Root cause hypothesis and confidence
- Immediate mitigation and permanent fix
