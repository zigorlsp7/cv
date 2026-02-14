import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { LessThanOrEqual, Repository } from 'typeorm';
import { OutboxEvent, OutboxStatus } from './entities/outbox-event.entity';

type EnqueueOutboxEventInput = {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  availableAt?: Date;
};

@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
  ) {}

  async enqueue(input: EnqueueOutboxEventInput): Promise<OutboxEvent> {
    const event = this.outboxRepo.create({
      id: randomUUID(),
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      eventType: input.eventType,
      payload: input.payload,
      availableAt: input.availableAt ?? new Date(),
      status: 'pending',
      attempts: 0,
      publishedAt: null,
      lastError: null,
    });
    return this.outboxRepo.save(event);
  }

  async claimPending(limit = 50): Promise<OutboxEvent[]> {
    return this.outboxRepo.find({
      where: {
        status: 'pending',
        availableAt: LessThanOrEqual(new Date()),
      },
      order: {
        createdAt: 'ASC',
      },
      take: limit,
    });
  }

  async markPublished(id: string): Promise<void> {
    await this.outboxRepo.update(
      { id },
      {
        status: 'published',
        publishedAt: new Date(),
        lastError: null,
      },
    );
  }

  async markFailed(id: string, error: string, retryAt?: Date): Promise<void> {
    const event = await this.outboxRepo.findOneByOrFail({ id });
    const nextStatus: OutboxStatus = retryAt ? 'pending' : 'failed';

    await this.outboxRepo.update(
      { id },
      {
        status: nextStatus,
        attempts: event.attempts + 1,
        availableAt: retryAt ?? event.availableAt,
        lastError: error,
      },
    );
  }
}
