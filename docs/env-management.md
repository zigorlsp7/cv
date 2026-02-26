# Environment Variable Management

This document defines the source of truth for `cv-web` runtime config after the ops split.

## Canonical Sources

| Class | Examples | Local Source | Production Source | Notes |
| --- | --- | --- | --- | --- |
| App runtime non-secrets | `WEB_DOMAIN`, `API_DOMAIN`, `CORS_ORIGINS`, `DB_HOST`, `NEXT_PUBLIC_API_BASE_URL`, `TOLGEE_API_URL`, `TOLGEE_PROJECT_ID` | `docker/.env.app.local` | SSM path `/cv-web/prod/app` | Deploy rewrites EC2 `docker/.env.app.prod` from this SSM prefix on every release. |
| App runtime secrets | `ADMIN_API_TOKEN`, `AUTH_SESSION_SECRET`, `TOLGEE_API_KEY`, `GOOGLE_CLIENT_SECRET`, `ADMIN_GOOGLE_EMAILS` | OpenBao KV v2 path `kv/cv-web` (set manually) | OpenBao KV v2 path `kv/cv-web` | Read at runtime via `scripts/openbao-run.mjs`. |
| OpenBao access pointer | `OPENBAO_TOKEN` | `docker/.env.app.local` | SSM `/cv-web/prod/app/OPENBAO_TOKEN` (`SecureString`) | Token must allow read on `kv/data/cv-web`. |
| Deploy infra vars | `AWS_REGION`, `AWS_DEPLOY_BUCKET`, `AWS_DEPLOY_INSTANCE_ID`, `AWS_ECR_*`, `AWS_SSM_APP_PREFIX` | n/a | GitHub Environment `production` vars | Usually exported from `platform-ops` Terraform outputs. |
| Deploy infra secret | `AWS_DEPLOY_ROLE_ARN` | n/a | GitHub Environment `production` secret | OIDC role assumed by deploy workflow. |
| Web build-time vars | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_RUM_ENABLED`, `NEXT_PUBLIC_RUM_ENDPOINT` | local app env | GitHub Environment `production` vars | Baked into web image during deploy build. |

## OpenBao Contract

Use these values everywhere:

- `OPENBAO_KV_MOUNT=kv`
- `OPENBAO_SECRET_PATH=cv-web`

`openbao-run` calls:

- `http://<OPENBAO_ADDR>/v1/kv/data/cv-web`

Required policy for app token:

```hcl
path "kv/data/cv-web" {
  capabilities = ["read"]
}
```

## Rules

1. Do not manually edit `/opt/cv-web/releases/*/docker/.env.app.prod` for long-term fixes.
2. Change app non-secrets in SSM (`/cv-web/prod/app`), then redeploy.
3. Change runtime secrets in OpenBao (`kv/cv-web`), then recreate `api`/`web`.
4. Change `NEXT_PUBLIC_*` in GitHub `production` vars, then deploy a new release.
5. Keep compose interpolation strict (`${VAR:?message}`), no hardcoded runtime literals in compose.

## Quick Checks

List SSM app keys:

```bash
aws ssm get-parameters-by-path \
  --path /cv-web/prod/app \
  --recursive \
  --with-decryption \
  --query 'Parameters[].Name' \
  --output table
```

Check effective OpenBao config in running `web` container:

```bash
docker compose --env-file docker/.env.app.prod -f docker/compose.app.prod.yml exec -T web \
  sh -lc 'echo OPENBAO_KV_MOUNT=$OPENBAO_KV_MOUNT; echo OPENBAO_SECRET_PATH=$OPENBAO_SECRET_PATH'
```

Check app token read access:

```bash
curl -s -o /tmp/bao_can_read.json -w "%{http_code}\n" \
  -H "X-Vault-Token: $OPENBAO_TOKEN" \
  "http://127.0.0.1:8200/v1/kv/data/cv-web"
cat /tmp/bao_can_read.json
```

## Suggested Routine

1. Edit `docker/.env.app.*` templates in repo.
2. Validate with `./scripts/env-doctor.sh`.
3. Sync app non-secrets to SSM via `scripts/aws-ssm-sync-env.sh`.
4. Update OpenBao secrets if needed.
5. Deploy a new release.
