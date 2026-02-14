# Browser RUM

This template includes a lightweight browser RUM path that can be enabled when UI logic starts growing.

## What is collected

- Web Vitals metrics (`web-vital`)
- Unhandled browser errors (`js-error`)
- Basic navigation events (`navigation`)

## Web configuration

Set in `apps/web` runtime:

- `NEXT_PUBLIC_RUM_ENABLED=true`
- `NEXT_PUBLIC_RUM_ENDPOINT=http://localhost:3000/v1/rum/events` (or your deployed API URL)
- `NEXT_PUBLIC_RELEASE=<git-sha-or-version>` (optional)

If `NEXT_PUBLIC_RUM_ENDPOINT` is not set, web falls back to `${NEXT_PUBLIC_API_BASE_URL}/v1/rum/events`.

## API configuration

Ensure API allows ingest:

- `FEATURE_FLAGS=rum_ingest=true`

Endpoint:

- `POST /v1/rum/events`

Payload shape:

```json
{
  "events": [
    {
      "type": "web-vital",
      "path": "/health",
      "metricName": "LCP",
      "metricValue": 1200.5,
      "release": "0.1.2"
    }
  ]
}
```

## Validation and limits

- Max 20 events per request
- Payloads are validated with class-validator
- Endpoint is skip-throttled and intended for batched browser telemetry

## Quick test

1. Start stack with API + web.
2. Enable web env flags and reload page.
3. Open API logs and confirm `RumService` entries appear after navigation.

