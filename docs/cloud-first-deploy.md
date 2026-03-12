# Cloud First Deploy (cv)

Use this runbook when you are deploying `cv` to AWS from scratch.
Complete `platform-ops/docs/cloud-first-deploy.md` first. `cv` depends on the shared production host, OpenBao, Tolgee, observability stack, and central ingress provided there.

## 1. What You Are Building

When this runbook is complete, you will have:

- the `cv` API and web images built in ECR
- a `cv` application deployment running on the shared EC2 host
- runtime secrets stored in OpenBao and SSM
- public routing through the central `platform-ops` ingress

## 2. Prerequisites

Run every command in this document from the `cv` repo root unless stated otherwise.

Required:

- `platform-ops` production is already deployed
- OpenBao production is initialized, unsealed, and has `kv` v2 enabled
- Tolgee production is reachable
- AWS CLI with access to the target account
- `jq`
- GitHub access to configure repository environments

## 3. Create The Tolgee Project And API Key

`cv` requires a Tolgee project and API key in production just like it does locally.

Open the Tolgee production UI from the domain configured by `platform-ops`.

Then:

1. create a project for `cv` if it does not already exist
2. note the numeric project id
3. create an API key for that project that the server-side runtime can use to read or export translations

You will need:

- the project id for tracked file `docker/.env.app.prod`
- the API key for OpenBao secret `kv/cv`

Important:

- the tracked file currently defaults `TOLGEE_PROJECT_ID=2`
- if your real production project id is different, update `docker/.env.app.prod` before deploying

## 4. Configure The GitHub `production` Environment

In the `cv` GitHub repository, create or update environment `production`.

Required environment variables:

- `AWS_REGION`
  - AWS region used by the workflow
- `AWS_ECR_API_REPOSITORY_URI`
  - ECR repository for the API image
- `AWS_ECR_WEB_REPOSITORY_URI`
  - ECR repository for the web image
- `AWS_DEPLOY_BUCKET`
  - S3 bucket used for the deploy bundle
- `AWS_DEPLOY_INSTANCE_ID`
  - EC2 instance targeted through SSM
- `AWS_SSM_APP_PREFIX`
  - SSM prefix for `cv`, for example `/cv/prod/app`

Optional environment variable:

- `DEPLOY_HEALTHCHECK_URL`
  - if set, GitHub runs the post-deploy smoke check against this URL

Required environment secret:

- `AWS_DEPLOY_ROLE_ARN`
  - IAM role assumed by GitHub Actions through OIDC

## 5. Review The Tracked Non-Secret Config

`docker/.env.app.prod` is the tracked non-secret config file used during deploy.

Review these values before the first deploy:

- `TRUST_PROXY`
  - usually `1` behind the shared ingress
- `SWAGGER_ENABLED`
  - normally `false` in production
- `CORS_ORIGINS`
  - allowed browser origins for the API
- `TOLGEE_PROJECT_ID`
  - numeric id of the Tolgee project for `cv`
- `NEXT_PUBLIC_API_BASE_URL`
  - public API base URL used by the web build
- `NOTIFICATIONS_KAFKA_BROKERS`
  - Kafka bootstrap servers reachable from the production host
- `NOTIFICATIONS_EMAIL_TOPIC`
  - topic used when `cv` publishes email requests

Do not put real secrets into this file.

These placeholders are expected and are filled at deploy time:

- `POSTGRES_PASSWORD=SET_FROM_OPEN_BAO`
- `OPENBAO_TOKEN=CHANGE_ME_PROD_OPENBAO_APP_READ_TOKEN`
- `API_IMAGE=REQUIRED_SET_BY_DEPLOY`
- `WEB_IMAGE=REQUIRED_SET_BY_DEPLOY`
- `NEXT_PUBLIC_RELEASE=bootstrap`

## 6. Create The OpenBao Secret `kv/cv`

Open the OpenBao production UI and create secret path `kv/cv`.

Add these keys:

- `TOLGEE_API_KEY`
  - the production Tolgee API key for the `cv` project
- `POSTGRES_PASSWORD`
  - password for the production `cv` Postgres database

Keep these values only in OpenBao, not in git.

## 7. Create The OpenBao Read Policy And App Token

Open an SSM shell on the production EC2 instance:

```bash
aws ssm start-session --profile platform-ops --target <AWS_DEPLOY_INSTANCE_ID> --region <AWS_REGION>
```

Inside that shell, resolve the latest deployed `platform-ops` release directory:

```bash
OPS_DIR="$(ls -1dt /opt/platform-ops/releases/* | head -n1)"
echo "$OPS_DIR"
```

Create the narrow read policy:

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

Create the token and print only the token value:

```bash
CV_OPENBAO_TOKEN="$(
  sudo docker compose --env-file "$OPS_DIR/docker/.env.ops.prod" -f "$OPS_DIR/docker/compose.ops.prod.yml" exec -T \
    -e BAO_ADDR=http://127.0.0.1:8200 \
    -e BAO_TOKEN="$ROOT_TOKEN" \
    openbao bao token create -policy=cv-prod-read -format=json | jq -r '.auth.client_token'
)"
echo "$CV_OPENBAO_TOKEN"
```

Important:

- this token should only read `kv/cv`
- do not reuse the OpenBao root token for the app

## 8. Store The App Token In SSM

Store the `cv` app token under the app SSM prefix:

```bash
aws ssm put-parameter \
  --profile platform-ops \
  --name /cv/prod/app/OPENBAO_TOKEN \
  --type SecureString \
  --value "$CV_OPENBAO_TOKEN" \
  --overwrite \
  --region <AWS_REGION>
```

If your prefix differs, use:

```bash
${AWS_SSM_APP_PREFIX}/OPENBAO_TOKEN
```

## 9. Trigger The First Deploy

The workflow is:

- `Deploy AWS App (EC2 Compose)` in `.github/workflows/deploy.yml`

You can trigger it in either way:

- publish a release tag
- or run `workflow_dispatch` with an existing `release_tag`

What the workflow does:

- builds and pushes the API and web images
- uploads the tracked deploy bundle to S3
- runs the remote deploy script over SSM

## 10. Validate The Production App

Validate the public API:

```bash
curl -fsS https://cv-api.zigordev.com/v1/health/ready
```

Validate the public web app:

```bash
curl -fsS https://cv.zigordev.com/
```

If you configured `DEPLOY_HEALTHCHECK_URL`, GitHub also performs the post-deploy smoke step automatically.

## 11. Troubleshooting

Deploy fails with missing non-secret config:

- review `docker/.env.app.prod`
- make sure `TOLGEE_PROJECT_ID` and the notification settings are present

Deploy fails when reading OpenBao:

- confirm OpenBao is unsealed
- confirm `kv/cv` exists
- confirm the app token in SSM matches the `cv-prod-read` policy

The web app fails to load translations:

- `TOLGEE_PROJECT_ID` does not match the real project id
- `TOLGEE_API_KEY` is wrong or stale

The app is deployed but email publishing fails:

- Kafka brokers in `NOTIFICATIONS_KAFKA_BROKERS` are wrong
- the shared notifications service is not reachable from the host

DNS or TLS issues:

- those are owned by `platform-ops`
- go back to `../platform-ops/docs/cloud-first-deploy.md` and verify the shared ingress and DNS records
