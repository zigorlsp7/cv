# Backup/Restore Drill

This template includes a practical restore drill against the test Postgres environment.

Script:

- `scripts/db-backup-restore-drill.sh`

CI integration:

- `.github/workflows/ci.yml` (job `integration-e2e`)

## What the drill does

1. Dumps `cv_test`.
2. Restores into `cv_restore_drill`.
3. Verifies critical tables exist:
   - `migrations`
   - `outbox_events`
   - `processed_messages`

## Run locally

```bash
docker compose -f docker/compose.yml --profile test up -d postgres_test api_test
./scripts/db-backup-restore-drill.sh
```

## Why this matters

- Proves backups are restorable, not only creatable.
- Protects against migration errors and schema drift.
- Creates an operational habit before production rollout.
