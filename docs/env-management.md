# Environment Variable Management (Single Source of Truth)

This document defines where each variable class lives and who owns it.

Goal: avoid drift between local files, SSM, OpenBao, GitHub environment variables, and compose manifests.

## Canonical Sources

| Class | Examples | Local Source | Production Source | Notes |
| --- | --- | --- | --- | --- |
| App runtime non-secrets | `WEB_DOMAIN`, `API_DOMAIN`, `CORS_ORIGINS`, `DB_HOST`, `DB_USER`, `NEXT_PUBLIC_API_BASE_URL`, `TOLGEE_API_URL`, `TOLGEE_PROJECT_ID` | `docker/.env.app.local` | SSM path `/cv-web/prod/app` | Deploy rewrites EC2 `docker/.env.app.prod` from SSM each run. |
| Ops runtime non-secrets | `CV_SHARED_NETWORK`, `GRAFANA_ADMIN_USER` | `docker/.env.ops.local` | SSM path `/cv-web/prod/ops` | Same rewrite behavior via deploy script. |
| App runtime secrets | `ADMIN_API_TOKEN`, `AUTH_SESSION_SECRET`, `TOLGEE_API_KEY`, `GOOGLE_CLIENT_SECRET`, `ADMIN_GOOGLE_EMAILS` | `docker/.env.secrets.local` then seeded to OpenBao by `npm run local:up:app` (or `npm run local:up`) | OpenBao KV v2 path `kv/cv-web/app` | App/web read via `scripts/openbao-run.mjs`. |
| Secret access pointer | `OPENBAO_TOKEN` | `docker/.env.app.local` | SSM `/cv-web/prod/app/OPENBAO_TOKEN` (`SecureString`) | This token must have read policy on `kv/data/cv-web/app`. |
| CI/prod deploy infra vars | `AWS_REGION`, `AWS_DEPLOY_BUCKET`, `AWS_DEPLOY_INSTANCE_ID`, `AWS_ECR_*`, `AWS_SSM_*` | n/a | GitHub Environment `production` vars | Populated from Terraform outputs. |
| Build-time web vars | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_RUM_ENABLED`, `NEXT_PUBLIC_RUM_ENDPOINT` | local app env | GitHub Environment `production` vars | Baked into the web image at build time. |
| Cloud credentials | `AWS_DEPLOY_ROLE_ARN` | n/a | GitHub Environment secret | OIDC role assumed by workflows. |

## Canonical OpenBao Convention

Use the same values everywhere:

- `OPENBAO_KV_MOUNT=kv`
- `OPENBAO_SECRET_PATH=cv-web/app`

`openbao-run` uses KV v2 API and always calls:

- `http://<OPENBAO_ADDR>/v1/<OPENBAO_KV_MOUNT>/data/<OPENBAO_SECRET_PATH>`

For the canonical values, runtime reads:

- `.../v1/kv/data/cv-web/app`

Policy must allow:

```hcl
path "kv/data/cv-web/app" {
  capabilities = ["read"]
}
```

## Operational Rules

1. Do not manually edit `/opt/cv-web/releases/*/docker/.env.*.prod` on EC2 for long-term fixes.
2. Change production app/ops env in SSM, then redeploy.
3. Change runtime secrets in OpenBao, then recreate affected services (`api`, `web`).
4. Change build-time `NEXT_PUBLIC_*` in GitHub `production` environment vars, then run a new release deploy.
5. Keep local and prod values separated:
   - local: `.env.app.local`, `.env.ops.local`, `.env.secrets.local`
   - prod: SSM + OpenBao + GitHub `production` vars
6. Keep compose interpolation strict: use required vars (`${VAR:?message}`) and keep runtime `environment:` values sourced from `.env`/SSM/OpenBao, not hardcoded literals in compose.

## Common Drift Patterns

1. OpenBao path drift (`secret/cv-web/app` vs `cv-web/app`)
   - Symptom: `404` or `403` from OpenBao in `api`/`web` logs.
2. Tolgee key drift (key from different instance/project)
   - Symptom: `401 invalid_project_api_key` from Tolgee.
3. SSM overwritten EC2 file confusion
   - Symptom: manual EC2 edits disappear on next deploy.
4. Build vs runtime confusion for `NEXT_PUBLIC_*`
   - Symptom: web behaves with stale frontend values until image rebuilt.

## Quick Checks

Check effective app OpenBao config inside container:

```bash
docker compose --env-file docker/.env.app.prod -f docker/compose.app.prod.yml exec -T web \
  sh -lc 'echo OPENBAO_KV_MOUNT=$OPENBAO_KV_MOUNT; echo OPENBAO_SECRET_PATH=$OPENBAO_SECRET_PATH'
```

Check if app token can read canonical path:

```bash
curl -s -o /tmp/bao_can_read.json -w "%{http_code}\n" \
  -H "X-Vault-Token: $OPENBAO_TOKEN" \
  "http://127.0.0.1:8200/v1/kv/data/cv-web/app"
cat /tmp/bao_can_read.json
```

List SSM app prefix keys:

```bash
aws ssm get-parameters-by-path \
  --path /cv-web/prod/app \
  --recursive \
  --with-decryption \
  --query 'Parameters[].Name' \
  --output table
```

## Suggested Routine

1. Edit local template files in `docker/`.
2. Validate with `npm run env:doctor`.
3. Sync to SSM using `scripts/aws-ssm-sync-env.sh`.
4. Update OpenBao secrets as needed.
5. Deploy.
