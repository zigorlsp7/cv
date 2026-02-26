# Compose Scope (cv-web + platform-ops)

`cv-web` now owns only the application compose stacks:

- `docker/compose.app.local.yml`
- `docker/compose.app.prod.yml`

Platform services (OpenBao, Tolgee, Grafana, Prometheus, etc.) are owned by the separate `platform-ops` repository.

## Local flow

1. Start the local ops stack from `platform-ops` first.
2. In this repo, configure:
   - `docker/.env.app.local`
   - app secrets directly in OpenBao path `kv/cv-web`
3. Ensure app env points to ops OpenBao:
   - `OPENBAO_ADDR=http://openbao:8200`
   - `OPENBAO_KV_MOUNT=kv`
   - `OPENBAO_SECRET_PATH=cv-web`
   - `CV_SHARED_NETWORK=platform_ops_shared`
4. Start app stack:
   - `npm run local:up`

## Production flow

1. Deploy/maintain ops host with `platform-ops`.
2. Keep app non-secret runtime env in SSM under `AWS_SSM_APP_PREFIX`.
3. Keep app runtime secrets in OpenBao path `kv/cv-web`.
4. Run `cv-web` release deploy workflow (`.github/workflows/deploy.yml`).

## Important

- `cv-web` no longer contains `compose.ops.*` or `.env.ops.*`.
- If app deploy fails with OpenBao errors, fix `platform-ops` state (health/unseal/policy/path) instead of changing `cv-web` compose files.
