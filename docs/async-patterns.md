# Async Messaging Skeleton

This repo now includes a worker skeleton at:

- `apps/api/src/modules/async/async.worker.service.ts`
- `apps/api/src/modules/async/async.module.ts`

It is intentionally transport-agnostic so we can wire Kafka or SQS later without changing core processing semantics.

## Idempotency strategy

Every consumed message must carry a stable message ID (`envelope.id`).

Recommended storage shape:

- Table: `processed_messages`
- Columns:
  - `message_id` (PK)
  - `topic`
  - `processed_at`

Processing flow:

1. Check if `message_id` exists.
2. If yes, skip processing.
3. If not, execute handler.
4. Persist `message_id` in the same transaction boundary where possible.

## Outbox pattern strategy

For reliable publish-after-write:

1. Inside the same DB transaction as domain changes, insert event rows into `outbox`.
2. A publisher job polls `outbox` rows with `status='pending'`.
3. Publish to broker (Kafka/SQS).
4. Mark row as `published` (or retry with backoff on failure).

Recommended outbox table:

- `id` UUID PK
- `aggregate_type` TEXT
- `aggregate_id` TEXT
- `event_type` TEXT
- `payload` JSONB
- `status` TEXT (`pending|published|failed`)
- `attempts` INT
- `available_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ

## Broker choice notes

- Kafka: strong ordering/streaming semantics, higher ops overhead.
- SQS: simpler managed queue on AWS, easier operational model.

Pick one by throughput/ordering/ops constraints, but keep worker contract and idempotency behavior unchanged.
