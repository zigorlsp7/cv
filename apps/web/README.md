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
## Localization (Tolgee)

Translations are managed in Tolgee and pulled at runtime (no local fallback).
The UI locale is stored in the `cv-language` cookie and can be changed from the header.

### Run Tolgee locally

1. Start Tolgee:
   - `docker compose -f docker/compose.yml up -d tolgee`
2. Open `http://localhost:8090` and sign in with:
   - user: `admin`
   - pass: `admin`
### Automatic pull (recommended)

Set these environment variables (server-side only):

- `TOLGEE_API_URL` (ex: `http://localhost:8090`)
- `TOLGEE_PROJECT_ID` (ex: `2`)
- `TOLGEE_API_KEY` (project API key)

When set, the web app will pull translations at runtime and cache them for 60 seconds.

## Secrets (Infisical)

Infisical is included for local secret management. Tolgee API key should be stored in Infisical
and injected into the web container at runtime.

### Run Infisical locally

1. Create `docker/infisical/.env` from the example:
   - `cp docker/infisical/.env.example docker/infisical/.env`
2. Start Infisical:
   - `set -a && source docker/infisical/.env && set +a && docker compose -f docker/compose.yml up -d infisical infisical_db infisical_redis`
3. Open `http://localhost:8091` and create a project.
4. Create a secret `TOLGEE_API_KEY` in the `dev` environment.
5. Create a service token and export:
   - `INFISICAL_TOKEN`
   - `INFISICAL_PROJECT_ID`

Then create a root `.env` and start the web container:

- `cp .env.example .env`
- Fill in `INFISICAL_PROJECT_ID` and `INFISICAL_TOKEN`

## Quality Gates in CI

- Lint + typecheck + build
- Playwright smoke (`/` and `/health`)
- API contract drift gate (generated contract file must be up to date)

## Notes

- This workspace intentionally stays minimal until business UI starts.
- RUM capture is designed as near-future instrumentation and can stay disabled while UI is still skeletal.


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
