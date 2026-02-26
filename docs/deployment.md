# Deployment

Current production deployment model:

1. `platform-ops` provisions/operates infra and ops services.
2. `cv-web` deploys app images and app compose only.
3. Runtime app env comes from SSM (`/cv-web/prod/app`), and runtime secrets from OpenBao (`kv/cv-web`).

Main docs:

- `docs/deploy-aws-terraform.md`
- `docs/env-management.md`
