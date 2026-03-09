# API Contract Strategy

This repo uses a shared-types contract flow between `apps/api` and `apps/ui`.

## Source of truth

- Source: Nest Swagger document from `apps/api`
- Endpoint (in `api_test` container): `http://localhost:3000/docs-json`

## Consumer artifact

- Generated web contract: `apps/ui/src/lib/api/generated.ts`

## Generation command

```bash
docker compose -f docker/compose.ci.yml --profile test up -d postgres_test api_test
docker compose -f docker/compose.ci.yml --profile test exec -T api_test sh -lc 'wget -qO- http://localhost:3000/docs-json' > artifacts/openapi.test.json
npm run contract:gen:web -- artifacts/openapi.test.json apps/ui/src/lib/api/generated.ts
```

## CI policy

1. Export OpenAPI from running `api_test`.
2. Regenerate `apps/ui/src/lib/api/generated.ts`.
3. Fail if generated output differs from committed file.
4. Review contract diffs together with API changes.
