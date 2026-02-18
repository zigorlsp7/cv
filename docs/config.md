# Configuration

The API uses a single typed config module: `apps/api/src/config/app.config.ts`.

That module is consumed by:

- Nest runtime bootstrap (`apps/api/src/main.ts`, `apps/api/src/app.module.ts`)
- TypeORM CLI datasource (`apps/api/src/typeorm.datasource.ts`)
- Jest setup for integration/e2e (`apps/api/test/jest.env.ts`)

If configuration is invalid, startup fails immediately (fail-fast).

## Environment loading

The loader chooses env file by `NODE_ENV`:

- `test` -> `apps/api/.env.test`
- `development` / `production` -> `apps/api/.env`

`NODE_ENV` must already exist in process env (startup fails before file loading if it is missing).

System environment variables still take precedence over file values.

## Variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | yes | - | Runtime mode (`development`, `test`, `production`) |
| `PORT` | no | `3000` | API listen port |
| `LOG_LEVEL` | no | `info` | Pino log level |
| `DB_HOST` | yes | - | Postgres host |
| `DB_PORT` | yes | - | Postgres port |
| `DB_USER` | yes | - | Postgres user |
| `DB_PASSWORD` | yes | - | Postgres password |
| `DB_NAME` | yes | - | Postgres database |
| `RATE_LIMIT_TTL_MS` | no | `60000` | Throttling window size (ms) |
| `RATE_LIMIT_LIMIT` | no | `100` | Max requests per throttling window |
| `CORS_ORIGINS` | no | empty | Comma-separated explicit allowlist of origins |
| `CORS_METHODS` | no | `GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS` | Allowed CORS methods |
| `CORS_ALLOWED_HEADERS` | no | `Content-Type,Authorization,X-Request-Id` | Allowed CORS request headers |
| `CORS_EXPOSED_HEADERS` | no | `X-Request-Id` | Response headers exposed to browsers |
| `CORS_CREDENTIALS` | no | `true` | Whether credentials are allowed |
| `CORS_MAX_AGE_SECONDS` | no | `600` | CORS preflight cache duration |
| `TRUST_PROXY` | no | `false` | Express trust proxy setting (`false`, `true`, `loopback`, `linklocal`, `uniquelocal`, or hop count) |
| `REQUEST_TIMEOUT_MS` | no | `30000` | HTTP request timeout |
| `HEADERS_TIMEOUT_MS` | no | `30000` | HTTP headers timeout |
| `KEEP_ALIVE_TIMEOUT_MS` | no | `5000` | HTTP keep-alive timeout |
| `REQUEST_BODY_LIMIT` | no | `1mb` | JSON/urlencoded body max size |
| `OTEL_SERVICE_NAME` | no | `cv-api` | OpenTelemetry service name |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | no | `http://localhost:4318` | OTLP collector endpoint |
| `FEATURE_FLAGS` | no | empty | Comma-separated feature flags (example: `swagger_docs=true,rum_ingest=true`) |

## Validation rules

- `CORS_ORIGINS` entries must be full `http://` or `https://` origins.
- `CORS_ORIGINS=*` is rejected when `CORS_CREDENTIALS=true`.
- In `production`, `CORS_ORIGINS` must not be empty.
- `HEADERS_TIMEOUT_MS` must be greater than `KEEP_ALIVE_TIMEOUT_MS`.
- `TRUST_PROXY` must be one of the supported values listed above.
- `FEATURE_FLAGS` must use `name=true|false` pairs.

## Trust proxy strategy (ALB/CloudFront)

Recommended production baseline behind AWS ALB/CloudFront:

1. Configure ingress to set standard forwarded headers (`X-Forwarded-For`, `X-Forwarded-Proto`).
2. Set `TRUST_PROXY=1` when API is directly behind a single trusted proxy hop.
3. Increase hop count only when there are known, trusted extra hops.
4. Never set `TRUST_PROXY=true` in untrusted networks because client headers can be spoofed.

## Timeout policy

Current defaults are intentionally conservative:

- `REQUEST_TIMEOUT_MS=30000`
- `HEADERS_TIMEOUT_MS=30000`
- `KEEP_ALIVE_TIMEOUT_MS=5000`

Tune these per SLA and upstream behavior. Keep `HEADERS_TIMEOUT_MS` greater than `KEEP_ALIVE_TIMEOUT_MS`.

## Request size policy

`REQUEST_BODY_LIMIT` controls both JSON and urlencoded parsers. Default is `1mb`.

Increase only when needed by concrete payload requirements. Keep this small by default to reduce abuse and accidental oversized payloads.
