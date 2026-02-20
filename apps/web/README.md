# Web App (Next.js)

Frontend workspace for the CV platform template.

## Scripts

- `npm run dev -w web` - Start Next.js dev server
- `npm run build -w web` - Production build
- `npm run start -w web` - Run built app
- `npm run lint -w web` - Lint source files
- `npm run typecheck -w web` - TypeScript type checking
- `npm run test:smoke -w web` - Playwright smoke tests

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL` - API base URL used by server-side pages
- `NEXT_PUBLIC_RUM_ENABLED` - Enable browser RUM emission (`true`/`false`)
- `NEXT_PUBLIC_RUM_ENDPOINT` - Optional explicit RUM ingest URL (defaults to `${NEXT_PUBLIC_API_BASE_URL}/v1/rum/events` when not set)
- `NEXT_PUBLIC_RELEASE` - Optional release tag attached to RUM events
- `AUTH_SESSION_SECRET` - Server-side secret used to sign auth session cookies
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_OAUTH_REDIRECT_URI` - Optional explicit callback URL (defaults to `${origin}/api/auth/google/callback`)
- `ADMIN_GOOGLE_EMAILS` - Comma-separated Google account emails that get `admin` role
- `ADMIN_API_TOKEN` - Shared token used by web server proxy when calling protected API write endpoints
- `I18N_SOURCE` - Translation source mode (`tolgee` default, `local` for CI/offline)

`GOOGLE_CLIENT_ID` is not secret. In local Docker compose it now defaults to:

- `21513663095-94st5vu04uq1pebivq8m7m229tbim4pk.apps.googleusercontent.com`
## Localization (Tolgee)

Translations are managed in Tolgee and pulled at runtime by default (`I18N_SOURCE=tolgee`).
The UI locale is stored in the `cv-language` cookie and can be changed from the header.

### Run Tolgee locally

1. Start Tolgee:
   - `docker compose -f docker/compose.yml up -d tolgee`
2. Open `http://localhost:8090` and sign in with:
   - user: `cv_admin` (default from `docker/tolgee/config.yaml`)
   - pass: `change-this-tolgee-password` (default from `docker/tolgee/config.yaml`)
   - For real usage, set `TOLGEE_INITIAL_USERNAME`, `TOLGEE_INITIAL_PASSWORD`, and `TOLGEE_JWT_SECRET` before starting Tolgee.
### Runtime pull

Set these environment variables (server-side only):

- `TOLGEE_API_URL` (ex: `http://localhost:8090`)
- `TOLGEE_PROJECT_ID` (ex: `2`)
- `TOLGEE_API_KEY` (project API key)

When set, the web app will pull translations at runtime and cache them for 60 seconds.

For Docker local development, keep non-secret app config in `docker/.env.app.local` and store
runtime secrets in OpenBao (seeded from `docker/.env.secrets.local` by `npm run local:up`).

Use `I18N_SOURCE=local` only for CI or offline development. In local Docker and production-like environments, keep `I18N_SOURCE=tolgee`.

## Secrets (OpenBao)

OpenBao is used for local runtime secret management. Tolgee API key should be stored in OpenBao
and injected into the web container at runtime.

### Run OpenBao locally

1. In `docker/.env.ops.local`, set:
   - `OPENBAO_DEV_ROOT_TOKEN=<your-dev-root-token>`
2. In `docker/.env.app.local`, set:
   - `OPENBAO_ADDR=http://openbao:8200`
   - `OPENBAO_TOKEN=<same token or read-only token with access>`
   - `OPENBAO_KV_MOUNT=secret`
   - `OPENBAO_SECRET_PATH=cv-web/app`
3. Create `docker/.env.secrets.local` with at least:
   - `ADMIN_API_TOKEN`
   - `AUTH_SESSION_SECRET`
   - `TOLGEE_API_KEY`
4. Run `npm run local:up`.

`local:up` starts OpenBao (`http://localhost:8200`), writes the secrets to
`${OPENBAO_KV_MOUNT}/${OPENBAO_SECRET_PATH}`, then starts API/Web.

## Quality Gates in CI

- Lint + typecheck + build
- Playwright smoke (`/` and `/health`)
- API contract drift gate (generated contract file must be up to date)

## Google SSO + Roles

- Header user icon triggers Google OAuth sign-in.
- Session cookie is server-signed with `AUTH_SESSION_SECRET`.
- `ADMIN_GOOGLE_EMAILS` controls who receives `admin` role.
- Only `admin` users can use write actions in the CV UI.
- Recommended OpenBao secrets:
  - `GOOGLE_CLIENT_SECRET`
  - `AUTH_SESSION_SECRET`
  - `ADMIN_API_TOKEN`
  - `ADMIN_GOOGLE_EMAILS`

## Notes

- This workspace intentionally stays minimal until business UI starts.
- RUM capture is designed as near-future instrumentation and can stay disabled while UI is still skeletal.


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
