# Terraform Layout

`cv` no longer owns the primary production infrastructure Terraform.

Current model:

1. `platform-ops` repository
   - Primary source for AWS infra and ops runtime provisioning.

2. `infra/terraform/aws-compose` in this repo
   - Legacy reference only.

3. `infra/terraform` root files
   - Legacy ECS-era skeleton.

For active infra changes, use `platform-ops`.
