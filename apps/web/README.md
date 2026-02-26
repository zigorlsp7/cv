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
- `NEXT_PUBLIC_RUM_ENABLED`
- `NEXT_PUBLIC_RUM_ENDPOINT`
- `NEXT_PUBLIC_RELEASE`
- `AUTH_SESSION_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `ADMIN_GOOGLE_EMAILS`
- `ADMIN_API_TOKEN`
- `I18N_SOURCE`

Runtime Tolgee variables (server-side):

- `TOLGEE_API_URL`
- `TOLGEE_PROJECT_ID`
- `TOLGEE_API_KEY`

## Localization (Tolgee)

Default runtime mode is `I18N_SOURCE=tolgee`. Locale is stored in `cv-language` cookie.

`cv-web` no longer runs Tolgee itself. Tolgee is provided by `platform-ops`.

For local Docker usage:

1. Start local ops stack from `platform-ops`.
2. Set in `docker/.env.app.local`:
   - `TOLGEE_API_URL=http://tolgee:8080`
   - `TOLGEE_PROJECT_ID=<project-id>`
3. Store `TOLGEE_API_KEY` in OpenBao path `kv/cv-web`.
4. Start app stack with `npm run local:up`.

Use `I18N_SOURCE=local` only for CI or offline fallback.

## Secrets (OpenBao)

`cv-web` reads runtime secrets from OpenBao through `scripts/openbao-run.mjs`.

Expected contract:

- `OPENBAO_KV_MOUNT=kv`
- `OPENBAO_SECRET_PATH=cv-web`
- Web token has read access on `kv/data/cv-web`

Typical keys in `kv/cv-web`:

- `TOLGEE_API_KEY`
- `AUTH_SESSION_SECRET`
- `ADMIN_API_TOKEN`
- `GOOGLE_CLIENT_SECRET`
- `ADMIN_GOOGLE_EMAILS`

## Google SSO + Roles

- Header user icon triggers Google OAuth sign-in.
- Session cookie is signed with `AUTH_SESSION_SECRET`.
- `ADMIN_GOOGLE_EMAILS` controls admin role assignment.
- Only admins can perform protected write actions in UI.
