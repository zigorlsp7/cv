# API Contract Strategy

This repo uses an **OpenAPI-first contract flow** between `apps/api` and `apps/web`.

## Source of truth

- Source: Nest Swagger document from `apps/api`
- Endpoint (local): `http://localhost:3000/docs-json`

## Consumer artifact

- Generated TypeScript types for web: `apps/web/src/lib/api/generated.ts`

## Generation command

Run the API locally, then execute:

```bash
npm run contract:gen:web
```

This command writes web-consumable API types from the live OpenAPI spec.

## Why this approach

- Prevents drift between backend DTOs and frontend usage.
- Keeps API changes explicit in PR diffs (generated file changes).
- Avoids hand-maintained duplicated request/response types.

## CI policy (recommended)

1. Generate types in CI.
2. Fail if generated output differs from committed files.
3. Treat contract diffs as part of API review.
