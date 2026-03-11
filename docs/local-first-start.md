# Local First Start (cv)

Use this runbook when you are creating the `cv` local environment from scratch.
Complete `platform-ops/docs/local-first-start.md` first. `cv` depends on OpenBao, Tolgee, the shared Docker network, and the shared observability services started there.

## 1. What You Are Building

When this runbook is complete, you will have:

- the `cv` API running on `http://localhost:3000`
- the `cv` web app running on `http://localhost:3001`
- a local Postgres database for `cv`
- runtime translations loaded from Tolgee
- optional email/contact delivery through the separate `notifications` local stack

## 2. Prerequisites

Run every command in this document from the `cv` repo root.

Required:

- `platform-ops` local stack is already running
- OpenBao in `platform-ops` is initialized and unsealed
- `kv` v2 is enabled in OpenBao
- Docker
- `npm`
- `jq`

Optional but recommended:

- the `notifications` local stack, if you want the contact form to deliver messages locally

## 3. Create The Tolgee Project And API Key

`cv` requires a Tolgee project and an API key before the web container can start.

Open Tolgee:

- `http://localhost:8090`

Log in with the bootstrap credentials you configured in `platform-ops/docker/.env.ops.local`.

Then:

1. create a project for `cv` if it does not already exist
2. note the numeric project id
   - you can usually see it in the Tolgee project URL or project settings
3. create an API key for that project that can be used by the server-side runtime to read or export translations

You will need:

- the project id for `TOLGEE_PROJECT_ID` in `docker/.env.app.local`
- the API key for `TOLGEE_API_KEY` in OpenBao

Important:

- the tracked local env file defaults `TOLGEE_PROJECT_ID=2`
- if your fresh Tolgee instance gives `cv` a different id, update `docker/.env.app.local` before starting the stack

## 4. Create The OpenBao Secret `kv/cv`

Open OpenBao:

- `http://localhost:8200/ui`

Create secret path `kv/cv` with these keys:

- `TOLGEE_API_KEY`
  - the Tolgee API key from the previous step
- `POSTGRES_PASSWORD`
  - password used by the local `cv` Postgres container
  - choose any strong local-only value

Why these are needed:

- the web app reads `TOLGEE_API_KEY` from OpenBao at runtime
- the startup script reads `POSTGRES_PASSWORD` from OpenBao before starting Docker Compose

## 5. Create A Read-Only Policy For `cv`

Create an OpenBao ACL policy named `cv-local-read`:

```bash
docker compose --env-file ../platform-ops/docker/.env.ops.local -f ../platform-ops/docker/compose.ops.local.yml exec -T openbao bao policy write cv-local-read - <<'EOF'
path "kv/data/cv" { capabilities = ["read"] }
path "kv/metadata/cv" { capabilities = ["read"] }
EOF
```

This policy allows the app to read only its own secret path and nothing else.

## 6. Create The `cv` OpenBao Token

Use the OpenBao root token you saved during the `platform-ops` bootstrap.

Create a token bound to the policy above:

```bash
ROOT_TOKEN='paste_root_token_here'

docker compose --env-file ../platform-ops/docker/.env.ops.local -f ../platform-ops/docker/compose.ops.local.yml exec -T \
  -e BAO_ADDR=http://127.0.0.1:8200 \
  -e BAO_TOKEN="$ROOT_TOKEN" \
  openbao bao token create -policy=cv-local-read -format=json \
  | jq -r '.auth.client_token'
```

Copy the printed token value.

Important:

- do not put the root token in the `cv` env file
- use only the narrow read token created for `cv`

## 7. Prepare The Local Env File

Create the real local env file from the tracked example:

```bash
cp docker/.env.app.local.example docker/.env.app.local
```

Edit `docker/.env.app.local`.

Set or review these values:

- `OPENBAO_TOKEN`
  - set it to the `cv-local-read` token from the previous step
- `TOLGEE_PROJECT_ID`
  - set it to the real Tolgee project id for `cv`
  - change it if your project id is not the default value
- `SWAGGER_ENABLED`
  - set to `true` if you want Swagger locally
- `CORS_ORIGINS`
  - keep `http://localhost:3001` unless your local web origin is different
- `NOTIFICATIONS_KAFKA_BROKERS`
  - keep the default if you use the local `notifications` stack on the shared network

Leave these placeholders as they are:

- `POSTGRES_PASSWORD=SET_FROM_OPEN_BAO`
- `API_IMAGE=REQUIRED_SET_BY_DEPLOY`
- `WEB_IMAGE=REQUIRED_SET_BY_DEPLOY`

They are not meant to be edited manually for local startup.

## 8. Start The Local Stack

Start the app:

```bash
npm run local:up
```

What the script does:

- validates that OpenBao is reachable
- validates that your token can read `kv/cv`
- validates the required OpenBao keys
- exports `POSTGRES_PASSWORD` from OpenBao
- starts or rebuilds the local Docker Compose stack

## 9. Validate The Local App

Check the API:

```bash
curl -fsS http://localhost:3000/v1/health/ready
```

Open the web app:

- `http://localhost:3001`

Optional checks:

- Swagger, if enabled: `http://localhost:3000/docs`
- contact form delivery, if `notifications` is also running

## 10. Daily Commands

Start or restart the local app:

```bash
npm run local:up
```

Stop the stack but keep volumes:

```bash
npm run local:down
```

Stop the stack and delete local volumes:

```bash
npm run local:reset
```

## 11. Troubleshooting

`403 permission denied` when reading `kv/cv`:

- the token does not have the `cv-local-read` policy
- the token in `docker/.env.app.local` is old or incorrect

`missing required keys` during startup:

- one or more keys are missing or empty in `kv/cv`
- confirm `TOLGEE_API_KEY` and `POSTGRES_PASSWORD` exist

The web app fails to load translations:

- `TOLGEE_PROJECT_ID` does not match the real Tolgee project id
- `TOLGEE_API_KEY` is wrong or no longer valid
- Tolgee in `platform-ops` is not reachable

The contact form fails locally:

- the `notifications` local stack is not running
- `NOTIFICATIONS_KAFKA_BROKERS` points at the wrong broker

You need container logs:

```bash
docker compose --env-file docker/.env.app.local -f docker/compose.app.local.yml logs --no-color <service>
```

Common services:

- `api`
- `web`
- `postgres`

## 12. Next Step

If you also want local email delivery, continue with:

- `../notifications/docs/local-first-start.md`
