# API (NestJS)

Backend workspace for the CV platform template.

## Scripts

- `npm run start:dev -w @cv/api`
- `npm run build -w @cv/api`
- `npm run start:prod -w @cv/api`
- `npm run lint -w @cv/api`
- `npm run typecheck -w @cv/api`
- `npm run test:cov -w @cv/api -- --watchman=false --ci`
- `npm run test:int -w @cv/api -- --watchman=false --detectOpenHandles`
- `npm run test:e2e -w @cv/api -- --watchman=false --detectOpenHandles`

## Database and Migrations

- Runtime DB config comes from Docker service env (`docker/.env.app.local` via `docker/compose.app.local.yml`).
- Test DB config comes from compose test services (`docker/compose.precommit.yml` and `docker/compose.ci.yml`).
- Run migrations: `npm run migration:run -w @cv/api`
- Revert latest migration: `npm run migration:revert -w @cv/api`

## Configuration

- Typed config source: `apps/api/src/config/app.config.ts`
- Config docs: `docs/config.md`
- Swagger docs toggle via `SWAGGER_ENABLED` (`true`/`false`)
- Feature flags via `FEATURE_FLAGS` (example: `rum_ingest=true`)

## Local Stack

From repo root:

- Start app stack (requires platform-ops local stack already up):
  - `npm run local:up`
- Stop app stack:
  - `npm run local:down`

For test containers used by integration/e2e flows:

- `docker compose -f docker/compose.ci.yml --profile test up -d postgres_test api_test`

## Related Docs

- `docs/api-contract.md`
- `docs/backup-restore.md`
- `docs/observability.md`
- `docs/runbooks/api-high-error-rate.md`
- `docs/runbooks/api-high-latency.md`
