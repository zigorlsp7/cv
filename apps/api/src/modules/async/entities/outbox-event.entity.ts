import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

export type OutboxStatus = 'pending' | 'published' | 'failed';

@Entity({ name: 'outbox_events' })
@Index('IDX_outbox_status_available_at', ['status', 'availableAt'])
export class OutboxEvent {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'aggregate_type', type: 'varchar', length: 120 })
  aggregateType!: string;

  @Column({ name: 'aggregate_id', type: 'varchar', length: 191 })
  aggregateId!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 120 })
  eventType!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status!: OutboxStatus;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({
    name: 'available_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  availableAt!: Date;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;
}
