import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent } from './entities/outbox-event.entity';
import { ProcessedMessage } from './entities/processed-message.entity';
import { AsyncWorkerService } from './async.worker.service';
import { IdempotencyService } from './idempotency.service';
import { OutboxService } from './outbox.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProcessedMessage, OutboxEvent])],
  providers: [IdempotencyService, OutboxService, AsyncWorkerService],
  exports: [IdempotencyService, OutboxService, AsyncWorkerService],
})
export class AsyncModule {}
