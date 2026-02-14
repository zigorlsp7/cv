import { OutboxEvent } from '../../../src/modules/async/entities/outbox-event.entity';

export function buildOutboxPayload(overrides: Record<string, unknown> = {}) {
  return {
    actorId: 'system',
    version: 1,
    ...overrides,
  };
}

export function outboxSummary(event: OutboxEvent) {
  return {
    id: event.id,
    eventType: event.eventType,
    aggregateType: event.aggregateType,
    status: event.status,
    attempts: event.attempts,
  };
}
