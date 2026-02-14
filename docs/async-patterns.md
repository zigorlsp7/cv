# Async Messaging

This repo now includes persistence-backed async primitives:

- `apps/api/src/modules/async/async.worker.service.ts`
- `apps/api/src/modules/async/idempotency.service.ts`
- `apps/api/src/modules/async/outbox.service.ts`
- `apps/api/src/modules/async/entities/processed-message.entity.ts`
- `apps/api/src/modules/async/entities/outbox-event.entity.ts`
- Migration: `apps/api/src/migrations/1771060000000-AsyncOutboxAndIdempotency.ts`

The transport remains intentionally decoupled so Kafka/SQS can be wired later without changing core semantics.

## Idempotency strategy

Every consumed message must carry a stable message ID (`envelope.id`).

Implemented storage shape:

- Table: `processed_messages`
- PK: `message_id`
- Metadata: `topic`, `key`, `processed_at`

Processing flow:

1. Check if `message_id` exists.
2. If yes, skip processing.
3. If not, execute handler.
4. Persist `message_id`.
5. Duplicate `message_id` insert is treated as already-processed.

## Outbox pattern strategy

For reliable publish-after-write:

1. Inside the same DB transaction as domain changes, insert event rows into `outbox`.
2. A publisher job polls `outbox` rows with `status='pending'`.
3. Publish to broker (Kafka/SQS).
4. Mark row as `published` (or retry with backoff on failure).

Implemented outbox table (`outbox_events`):

- `id` VARCHAR(36) PK
- `aggregate_type`
- `aggregate_id`
- `event_type`
- `payload` JSONB
- `status` (`pending|published|failed`)
- `attempts`
- `available_at`
- `created_at`
- `published_at`
- `last_error`
- Index: `(status, available_at)`

Service API:

1. `enqueue(...)` inserts `pending` outbox rows.
2. `claimPending(limit)` loads publish-ready rows.
3. `markPublished(id)` marks success.
4. `markFailed(id, error, retryAt?)` increments attempts and keeps retry semantics.

## Test coverage

Integration coverage for persistence semantics:

- `apps/api/test/async.int-spec.ts`

Factory and fixture support:

- `apps/api/test/support/test-data-source.ts`
- `apps/api/test/support/db-cleanup.ts`
- `apps/api/test/support/factories/*.ts`

## Broker choice notes

- Kafka: strong ordering/streaming semantics, higher ops overhead.
- SQS: simpler managed queue on AWS, easier operational model.

Pick one by throughput/ordering/ops constraints, but keep worker contract and idempotency behavior unchanged.
