# API Contract Strategy

This repo uses a **shared-types contract flow** between `apps/api` and `apps/web`.

## Source of truth

- Source: Nest Swagger document from `apps/api`
- Endpoint (local): `http://localhost:3000/docs-json` (or from `api_test` in compose)

## Consumer artifact

- Generated contract types for web: `apps/web/src/lib/api/generated.ts`

## Generation command

Export OpenAPI spec and generate shared contract types:

```bash
docker compose -f docker/compose.yml --profile test up -d postgres_test api_test
docker compose -f docker/compose.yml --profile test exec -T api_test sh -lc 'wget -qO- http://localhost:3000/docs-json' > artifacts/openapi.test.json
npm run contract:gen:web -- artifacts/openapi.test.json apps/web/src/lib/api/generated.ts
```

This command writes web-consumable contract types from the OpenAPI JSON.

## Why this approach

- Prevents drift between backend routes and frontend assumptions.
- Keeps API changes explicit in PR diffs (generated file changes).
- Avoids hand-maintained duplicated endpoint catalogs.

## CI policy (recommended)

1. Export OpenAPI from running `api_test`.
2. Regenerate `apps/web/src/lib/api/generated.ts`.
3. Fail if generated output differs from committed file.
4. Treat contract diffs as part of API review.
