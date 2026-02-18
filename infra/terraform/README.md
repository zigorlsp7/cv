# Terraform Skeleton (AWS)

This is a production-oriented skeleton covering:

- VPC/network baseline
- ECR repositories (`api`, `web`)
- ECS Fargate cluster/services (container deploy target)
- RDS PostgreSQL
- Secrets Manager + SSM parameters
- ACM certificate + optional CloudFront front door

It is intentionally minimal and needs environment values before apply.

## Structure

- `providers.tf` provider + backend placeholders
- `variables.tf` required environment inputs
- `main.tf` core resource skeleton
- `outputs.tf` key IDs/endpoints
- `environments/dev.tfvars.example` example inputs

## Bootstrap

```bash
cd infra/terraform
terraform init
terraform plan -var-file=environments/dev.tfvars.example
```

## Notes

- This skeleton favors ECS Fargate. Lambda container can be added as an alternative module.
- Store DB credentials in Secrets Manager and inject to ECS task definitions.
- Use ACM cert + ALB (and optional CloudFront) for TLS/domain.
- ECS services are provisioned with `bootstrap` image tags by default; push images and set `api_image_tag`/`web_image_tag` before production rollout.
