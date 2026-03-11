# Cloud First Deploy (cv)

Use this runbook to deploy `cv` to AWS for the first time.

## 1. Prerequisites

- `platform-ops` is already deployed to the same EC2 host.
- OpenBao is initialized, unsealed, and has `kv` (v2) enabled.
- ECR repositories exist for `cv` API and web images.
- `docker/.env.app.prod` is updated with correct non-secret prod values.

## 2. GitHub `production` Environment Configuration

In the `cv` GitHub repository, create/update environment `production`.

Required environment variables:

- `AWS_REGION`
- `AWS_ECR_API_REPOSITORY_URI`
- `AWS_ECR_WEB_REPOSITORY_URI`
- `AWS_DEPLOY_BUCKET`
- `AWS_DEPLOY_INSTANCE_ID`
- `AWS_SSM_APP_PREFIX` (example: `/cv/prod/app`)

Optional environment variables:

- `DEPLOY_HEALTHCHECK_URL` (enables post-deploy smoke step)

Required environment secrets:

- `AWS_DEPLOY_ROLE_ARN`

## 3. Confirm Non-Secret App Config in Repo

These are read from tracked file `docker/.env.app.prod` during deploy:

- `TRUST_PROXY`
- `SWAGGER_ENABLED`
- `CORS_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `NEXT_PUBLIC_API_BASE_URL`

Public host routing is handled by `platform-ops` central ingress.

Values set by deploy script automatically (do not hardcode final values):

- `API_IMAGE`
- `WEB_IMAGE`
- `NEXT_PUBLIC_RELEASE`
- `OPENBAO_TOKEN` (fetched from SSM)

## 4. Create OpenBao Secret `kv/cv` (Prod) In The UI

Use the OpenBao UI for secret creation.

1. Open OpenBao UI and log in with the root/admin token.
2. Go to `Secrets engines` -> `kv` -> `Create secret`.
3. Set secret path to `cv` (this creates `kv/cv`).
4. Add these keys:
- `AUTH_SESSION_SECRET` (recommended value generation: `openssl rand -hex 32`)
- `TOLGEE_API_KEY`
- `GOOGLE_CLIENT_SECRET`
- `ADMIN_GOOGLE_EMAILS` (comma-separated emails)
- `POSTGRES_PASSWORD`
5. Save the secret.

## 5. Create Read Policy + App Token for CV

Policy and token creation is done with CLI/API.

Open an SSM shell on the instance:

```bash
aws ssm start-session --profile platform-ops --target <AWS_DEPLOY_INSTANCE_ID> --region <AWS_REGION>
```

In the SSM shell, find latest `platform-ops` release:

```bash
OPS_DIR="$(ls -1dt /opt/platform-ops/releases/* | head -n1)"
echo "$OPS_DIR"
```

Create policy:

```bash
ROOT_TOKEN='paste_openbao_root_token'
sudo docker compose --env-file "$OPS_DIR/docker/.env.ops.prod" -f "$OPS_DIR/docker/compose.ops.prod.yml" exec -T \
  -e BAO_ADDR=http://127.0.0.1:8200 \
  -e BAO_TOKEN="$ROOT_TOKEN" \
  openbao sh -lc "
cat > /tmp/cv-prod-read.hcl <<'EOF'
path \"kv/data/cv\" { capabilities = [\"read\"] }
path \"kv/metadata/cv\" { capabilities = [\"read\"] }
EOF
bao policy write cv-prod-read /tmp/cv-prod-read.hcl
"
```

Create token and capture value:

```bash
CV_OPENBAO_TOKEN="$(
  sudo docker compose --env-file "$OPS_DIR/docker/.env.ops.prod" -f "$OPS_DIR/docker/compose.ops.prod.yml" exec -T \
    -e BAO_ADDR=http://127.0.0.1:8200 \
    -e BAO_TOKEN="$ROOT_TOKEN" \
    openbao bao token create -policy=cv-prod-read -format=json | jq -r '.auth.client_token'
)"
echo "$CV_OPENBAO_TOKEN"
```

## 6. Store CV OpenBao Token in SSM

Store the token under app SSM prefix:

```bash
aws ssm put-parameter \
  --profile platform-ops \
  --name /cv/prod/app/OPENBAO_TOKEN \
  --type SecureString \
  --value "$CV_OPENBAO_TOKEN" \
  --overwrite \
  --region <AWS_REGION>
```

If you use a different prefix, use `${AWS_SSM_APP_PREFIX}/OPENBAO_TOKEN`.

## 7. Trigger First CV Deploy

Workflow:

- `Deploy AWS App (EC2 Compose)` (`.github/workflows/deploy.yml`)

Run options:

- Publish a release tag, or
- Run `workflow_dispatch` with an existing `release_tag`

## 8. Validate

After deploy:

```bash
curl -fsS https://cv-api.zigordev.com/v1/health/ready
curl -fsS https://cv.zigordev.com/
```

If `DEPLOY_HEALTHCHECK_URL` is configured, GitHub runs this smoke check automatically.
