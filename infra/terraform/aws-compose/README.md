# AWS Compose Terraform (Legacy in cv-web)

This module remains for historical reference and is no longer the primary source for production ops infrastructure.

Current ownership model:

- `platform-ops` repo: infrastructure + ops runtime (OpenBao/Tolgee/observability)
- `cv-web` repo: app images + app deployment workflow

If you are provisioning or changing production infra, do it in `platform-ops`.

For `cv-web` deployment setup, use:

- `docs/deploy-aws-terraform.md`
- `docs/env-management.md`
