# Split Compose Stacks (Local + Prod)

This repo now provides split Docker Compose manifests so app and ops can run independently:

- App stack: `docker/compose.app.local.yml`, `docker/compose.app.prod.yml`
- Ops stack: `docker/compose.ops.local.yml`, `docker/compose.ops.prod.yml`

Both stacks connect through a shared external Docker network (`cv_shared` by default).

## Why split

- Better production parity (separate failure domains and lifecycle).
- You can restart app services without restarting observability/Tolgee/Infisical.
- You can move stacks to separate hosts later with minimal config changes.

## Local production-like mode

1. Create the env files:
   - `docker/.env.app.local`
   - `docker/.env.ops.local`
2. Fill Infisical values in `docker/.env.app.local`:
   - `INFISICAL_API_URL`
   - `INFISICAL_PROJECT_ID`
   - `INFISICAL_ENV`
   - `INFISICAL_TOKEN`
3. Create the shared network once:
   - `docker network create cv_shared || true`
4. Start ops stack:
   - `docker compose --env-file docker/.env.ops.local -f docker/compose.ops.local.yml up -d`
5. Start app stack:
   - `docker compose --env-file docker/.env.app.local -f docker/compose.app.local.yml up -d --build`
6. Run DB migrations once before first traffic:
   - `docker compose --env-file docker/.env.app.local -f docker/compose.app.local.yml --profile tools run --rm api_migrate`

Stop stacks:

- `docker compose --env-file docker/.env.app.local -f docker/compose.app.local.yml down`
- `docker compose --env-file docker/.env.ops.local -f docker/compose.ops.local.yml down`

Shortcuts from repo root:

- `npm run local:up` (create network, start ops + app, run migrations)
- `npm run local:down` (stop stacks, keep volumes)
- `npm run local:reset` (stop stacks, remove volumes, remove shared network)

## Production split mode

1. Create env files:
   - `docker/.env.app.prod`
   - `docker/.env.ops.prod`
2. Fill real values (images, secrets, domains).
3. Create the shared network:
   - `docker network create cv_shared || true`
4. Start ops stack:
   - `docker compose --env-file docker/.env.ops.prod -f docker/compose.ops.prod.yml up -d`
5. Start app stack:
   - `docker compose --env-file docker/.env.app.prod -f docker/compose.app.prod.yml up -d`
6. Run DB migrations for each release:
   - `docker compose --env-file docker/.env.app.prod -f docker/compose.app.prod.yml --profile tools run --rm api_migrate`

Notes:

- `docker/compose.app.prod.yml` includes Caddy exposing only `80/443`.
- Observability/Tolgee/Infisical ports in `docker/compose.ops.prod.yml` are bound to `127.0.0.1` by default.
- For real alert channels, render `docker/alertmanager.prod.yml` and mount the rendered file.
- `docker/compose.ops.prod.yml` uses `docker/prometheus.prod.yml`; set the API metrics target there before deploy.

If app and ops run on different VMs:

1. Set `OTEL_EXPORTER_OTLP_ENDPOINT` in `docker/.env.app.prod` to the ops collector URL.
2. Update `docker/alloy/config.alloy` client URL to point to the ops Loki URL.
3. Set the `docker/prometheus.prod.yml` target to the app/API public or private DNS name.

## CI impact

Current CI flow can stay as-is (`docker/compose.yml` + `docker/compose.ci.yml`) for speed and existing coverage.

Recommended minimum change (included): validate split compose manifests with `docker compose ... config` so drift is caught early.
