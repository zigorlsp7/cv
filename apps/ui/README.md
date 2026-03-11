# Web App (Next.js)

Frontend workspace for the CV platform template.

## Scripts

- `npm run dev -w web`
- `npm run build -w web`
- `npm run start -w web`
- `npm run lint -w web`
- `npm run typecheck -w web`
- `npm run test:smoke -w web`

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_RELEASE`

Runtime Tolgee variables (server-side):

- `TOLGEE_API_KEY`

`TOLGEE_API_URL` and `TOLGEE_PROJECT_ID` are fixed by app compose.

## Localization (Tolgee)

Runtime source selection is automatic. If `TOLGEE_API_URL`, `TOLGEE_PROJECT_ID`, and `TOLGEE_API_KEY` are set, the app loads translations from Tolgee. Otherwise it falls back to local JSON files. Locale is stored in `cv-language` cookie.

`cv` no longer runs Tolgee itself. Tolgee is provided by `platform-ops`.

For local Docker usage:

1. Start local ops stack from `platform-ops`.
2. Store `TOLGEE_API_KEY` in OpenBao path `kv/cv`.
3. Start app stack with `npm run local:up`.

CI and precommit run with local JSON fallback by default (Tolgee vars are not set there).

## Secrets (OpenBao)

`cv` reads runtime secrets from OpenBao through `scripts/openbao-run.mjs`.

Expected contract:

- `OPENBAO_KV_MOUNT=kv`
- `OPENBAO_SECRET_PATH=cv`
- Web token has read access on `kv/data/cv`

Typical keys in `kv/cv`:

- `TOLGEE_API_KEY`
- `POSTGRES_PASSWORD` (used by app stack startup/deploy scripts)
