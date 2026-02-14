import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'processed_messages' })
export class ProcessedMessage {
  @PrimaryColumn({ name: 'message_id', type: 'varchar', length: 191 })
  messageId!: string;

  @Column({ type: 'varchar', length: 120 })
  topic!: string;

  @Column({ type: 'varchar', length: 191, nullable: true })
  key!: string | null;

  @Column({
    name: 'processed_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  processedAt!: Date;
}
