# AWS Production Deployment (cv on platform-ops)

This repo now deploys only the `cv` app stack. Ops infrastructure is managed in the `platform-ops` repository.

## Architecture

- `platform-ops` manages host/infrastructure + ops services (OpenBao, Tolgee, observability).
- `cv` deploy workflow builds app images and runs remote app deploy.
- App runtime non-secrets come from SSM (`/cv/prod/app`).
- App runtime secrets come from OpenBao (`kv/cv`).

## Prerequisites

1. Platform ops is already provisioned and healthy.
2. `cv` and `platform-ops` share network `platform_ops_shared` on the host.
3. OpenBao is initialized/unsealed and has:
   - KV v2 mount `kv/`
   - secret path `kv/cv`
   - app token with read policy on `kv/data/cv`

## GitHub Environment Setup (`production`)

Deploy workflow: `.github/workflows/deploy.yml`

Set secret:

1. `AWS_DEPLOY_ROLE_ARN` (use `terraform output cv_github_deploy_role_arn` from `platform-ops/infra/terraform/aws-compose`)

Set variables (prefer `terraform output -json cv_github_actions_variables` from `platform-ops`):

1. `AWS_REGION`
2. `AWS_DEPLOY_BUCKET`
3. `AWS_DEPLOY_INSTANCE_ID`
4. `AWS_ECR_API_REPOSITORY_URI`
5. `AWS_ECR_WEB_REPOSITORY_URI`
6. `AWS_SSM_APP_PREFIX` (example `/cv/prod/app`)
7. `NEXT_PUBLIC_API_BASE_URL`
8. `DEPLOY_HEALTHCHECK_URL` (optional, recommended)

## SSM App Parameters

`cv` remote deploy rewrites `docker/.env.app.prod` on the instance from SSM path `AWS_SSM_APP_PREFIX`.

Template source in repo: `docker/.env.app.prod`

Sync example:

```bash
./scripts/aws-ssm-sync-env.sh \
  --file docker/.env.app.prod \
  --prefix /cv/prod/app \
  --region eu-west-1 \
  --secure-keys OPENBAO_TOKEN
```

## OpenBao App Secrets

Ensure these keys exist under `kv/cv`:

1. `AUTH_SESSION_SECRET`
2. `TOLGEE_API_KEY`
3. `GOOGLE_CLIENT_SECRET` (if Google SSO enabled)
4. `ADMIN_GOOGLE_EMAILS` (if admin auth enabled)
5. `POSTGRES_PASSWORD`

## Deploy

1. Merge to `main`.
2. `Release Please` creates/updates a release PR.
3. Release PR is auto-approved and auto-merged after checks pass.
4. `Deploy AWS App (EC2 Compose)` runs automatically on `release.published`.

Manual deploy is also possible via workflow dispatch with a release tag.

## Troubleshooting

### OpenBao 403/404 during app startup

Check:

1. `OPENBAO_KV_MOUNT=kv`
2. `OPENBAO_SECRET_PATH=cv`
3. App token policy includes `path "kv/data/cv" { capabilities = ["read"] }`
4. Secret keys exist at `kv/cv`

### SSM env missing at deploy time

Check that `AWS_SSM_APP_PREFIX` points to a path with parameters and that parameter names match keys from `docker/.env.app.prod`.

### Immutable ECR tag conflict

If release reuses an existing immutable tag, workflow should reuse images. If not, create a new release tag.
