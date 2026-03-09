# CV Web Template Wrap-Up (Archived)

This document previously described an older monolithic local stack layout.

Current source of truth is:

- `docs/deployment.md`
- `docs/deploy-aws-terraform.md`
- `docs/env-management.md`
- `docs/compose-split.md`

Key architecture update:

- `cv` owns only app build/deploy/runtime.
- `platform-ops` owns infrastructure and ops services (OpenBao, Tolgee, observability).

Do not use old commands that reference removed files such as `docker/compose.yml`, `docker/compose.ops.*`, or `docker/.env.ops.*`.
