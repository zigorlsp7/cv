# Deployment

Current recommended production deployment path for this repository is:

1. AWS EC2 + split compose stacks
2. Terraform-managed infra (`infra/terraform/aws-compose`)
3. GitHub Release-triggered deployment (`.github/workflows/deploy.yml`)

Use the full guide:

- `docs/deploy-aws-terraform.md`
- `docs/env-management.md`

Legacy files kept for reference:

- `infra/terraform` (ECS-oriented skeleton)
