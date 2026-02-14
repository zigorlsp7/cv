import { MigrationInterface, QueryRunner } from 'typeorm';

export class AsyncOutboxAndIdempotency1771060000000
  implements MigrationInterface
{
  name = 'AsyncOutboxAndIdempotency1771060000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "processed_messages" (
        "message_id" varchar(191) NOT NULL,
        "topic" varchar(120) NOT NULL,
        "key" varchar(191),
        "processed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_processed_messages_message_id" PRIMARY KEY ("message_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "outbox_events" (
        "id" varchar(36) NOT NULL,
        "aggregate_type" varchar(120) NOT NULL,
        "aggregate_id" varchar(191) NOT NULL,
        "event_type" varchar(120) NOT NULL,
        "payload" jsonb NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'pending',
        "attempts" integer NOT NULL DEFAULT 0,
        "available_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "published_at" TIMESTAMPTZ,
        "last_error" text,
        CONSTRAINT "PK_outbox_events_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_outbox_status_available_at"
      ON "outbox_events" ("status", "available_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_outbox_status_available_at"`);
    await queryRunner.query(`DROP TABLE "outbox_events"`);
    await queryRunner.query(`DROP TABLE "processed_messages"`);
  }
}
