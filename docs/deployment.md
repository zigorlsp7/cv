# Deployment Skeleton

Deployment workflow: `.github/workflows/deploy.yml`

Trigger mode: manual (`workflow_dispatch`), per environment.

## What it does

1. Builds production images for `apps/api` and `apps/web`.
2. Pushes images to ECR.
3. Optionally runs DB migrations as one-off ECS task.
4. Triggers ECS service rolling deployments.
5. Runs post-deploy smoke check against `DEPLOY_HEALTH_URL`.

## Required GitHub environment variables

- `AWS_REGION`
- `ECR_API_REPOSITORY`
- `ECR_WEB_REPOSITORY`
- `ECS_CLUSTER_NAME`
- `ECS_API_SERVICE_NAME`
- `ECS_WEB_SERVICE_NAME`
- `DEPLOY_HEALTH_URL`
- `ECS_MIGRATION_TASK_DEF` (optional)
- `ECS_MIGRATION_NETWORK_CONFIG_JSON` (optional)

## Migration strategy

Preferred deployment order:

1. Deploy backward-compatible schema migration (expand).
2. Deploy new app version using the new schema.
3. Remove old columns/constraints in a later release (contract).

If `ECS_MIGRATION_TASK_DEF` and `ECS_MIGRATION_NETWORK_CONFIG_JSON` are set, workflow executes migration task before service rollout.

## Rollback strategy

1. Re-deploy previous known-good image tag for API/Web services.
2. Avoid destructive schema migrations in same release as app changes.
3. If migration was additive-only, rollback should be app-only.
4. If migration failed, stop rollout and restore from latest validated backup.

## Required GitHub environment secrets

- `AWS_DEPLOY_ROLE_ARN` (OIDC-assumable IAM role)

## Relation with Terraform

Use `infra/terraform` to provision VPC, ECS, ECR, RDS, Secrets, and ACM.  
Then wire resulting names/URLs into GitHub environment vars.

## Related operational docs

- `docs/backup-restore.md`
- `docs/observability.md`
