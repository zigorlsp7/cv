# API (NestJS)

Backend workspace for the CV platform template.

## Scripts

- `npm run start:dev -w @cv/api` - Start API in watch mode
- `npm run build -w @cv/api` - Build API to `apps/api/dist`
- `npm run start:prod -w @cv/api` - Run built API
- `npm run lint -w @cv/api` - Lint API sources
- `npm run typecheck -w @cv/api` - TypeScript type checks
- `npm run test:cov -w @cv/api -- --watchman=false --ci` - Unit coverage
- `npm run test:int -w @cv/api -- --watchman=false --detectOpenHandles` - Integration tests
- `npm run test:e2e -w @cv/api -- --watchman=false --detectOpenHandles` - E2E tests

## Database and Migrations

- Runtime DB config comes from `apps/api/.env`.
- Test DB config comes from `apps/api/.env.test`.
- Run migrations:
  - `npm run migration:run -w @cv/api`
- Revert latest migration:
  - `npm run migration:revert -w @cv/api`

## Configuration

- Typed config source: `apps/api/src/config/app.config.ts`
- Config docs: `docs/config.md`
- Feature flags are passed via `FEATURE_FLAGS` (example: `swagger_docs=true,rum_ingest=true`)

## Local Stack

Use Docker Compose from repo root:

- Start app stack:
  - `docker compose -f docker/compose.yml up -d postgres api web`
- Start test services:
  - `docker compose -f docker/compose.yml --profile test up -d postgres_test api_test`

## Related Docs

- `docs/api-contract.md`
- `docs/backup-restore.md`
- `docs/observability.md`
- `docs/runbooks/api-high-error-rate.md`
- `docs/runbooks/api-high-latency.md`
