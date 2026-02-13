# Deployment Skeleton

Deployment workflow: `.github/workflows/deploy.yml`

Trigger mode: manual (`workflow_dispatch`), per environment.

## What it does

1. Builds production images for `apps/api` and `apps/web`.
2. Pushes images to ECR.
3. Triggers ECS service rolling deployments.
4. Runs post-deploy smoke check against `DEPLOY_HEALTH_URL`.

## Required GitHub environment variables

- `AWS_REGION`
- `ECR_API_REPOSITORY`
- `ECR_WEB_REPOSITORY`
- `ECS_CLUSTER_NAME`
- `ECS_API_SERVICE_NAME`
- `ECS_WEB_SERVICE_NAME`
- `DEPLOY_HEALTH_URL`

## Required GitHub environment secrets

- `AWS_DEPLOY_ROLE_ARN` (OIDC-assumable IAM role)

## Relation with Terraform

Use `infra/terraform` to provision VPC, ECS, ECR, RDS, Secrets, and ACM.  
Then wire resulting names/URLs into GitHub environment vars.
