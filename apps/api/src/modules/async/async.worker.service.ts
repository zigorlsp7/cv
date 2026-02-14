import { Injectable, Logger } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';

export type AsyncEnvelope<TPayload = unknown> = {
  id: string;
  topic: string;
  key?: string;
  occurredAt: string;
  payload: TPayload;
};

/**
 * Transport-agnostic worker contract (Kafka/SQS integration will call this).
 * It enforces idempotency semantics at the handler boundary.
 */
@Injectable()
export class AsyncWorkerService {
  private readonly logger = new Logger(AsyncWorkerService.name);

  constructor(private readonly idempotency: IdempotencyService) {}

  async handleMessage(
    message: AsyncEnvelope,
    handler: (message: AsyncEnvelope) => Promise<void>,
  ): Promise<void> {
    const alreadyProcessed = await this.idempotency.wasProcessed(message.id);
    if (alreadyProcessed) {
      this.logger.debug(`skip duplicate message id=${message.id}`);
      return;
    }

    this.logger.log(`processing topic=${message.topic} id=${message.id}`);
    await handler(message);

    const inserted = await this.idempotency.recordProcessed({
      messageId: message.id,
      topic: message.topic,
      key: message.key,
    });
    if (!inserted) {
      this.logger.debug(`message concurrently processed id=${message.id}`);
    }
  }
}
