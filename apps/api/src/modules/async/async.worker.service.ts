import { Injectable, Logger } from '@nestjs/common';

export type AsyncEnvelope<TPayload = unknown> = {
  id: string;
  topic: string;
  key?: string;
  occurredAt: string;
  payload: TPayload;
};

/**
 * Skeleton worker contract for future Kafka/SQS integration.
 * It centralizes idempotent message handling semantics before wiring a broker.
 */
@Injectable()
export class AsyncWorkerService {
  private readonly logger = new Logger(AsyncWorkerService.name);

  async handleMessage(message: AsyncEnvelope): Promise<void> {
    // TODO(P2): replace with a real idempotency store lookup.
    const alreadyProcessed = false;
    if (alreadyProcessed) {
      this.logger.debug(`skip duplicate message id=${message.id}`);
      return;
    }

    this.logger.log(`processing topic=${message.topic} id=${message.id}`);
    // TODO(P2): apply domain handler by topic.
    // TODO(P2): mark message as processed in idempotency store.
  }
}
