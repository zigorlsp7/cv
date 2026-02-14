import { DataSource } from 'typeorm';
import { OutboxEvent } from '../src/modules/async/entities/outbox-event.entity';
import { ProcessedMessage } from '../src/modules/async/entities/processed-message.entity';
import { AsyncWorkerService } from '../src/modules/async/async.worker.service';
import { IdempotencyService } from '../src/modules/async/idempotency.service';
import { OutboxService } from '../src/modules/async/outbox.service';
import { truncateTestTables } from './support/db-cleanup';
import { buildAsyncEnvelope } from './support/factories/async.factory';
import { buildOutboxPayload } from './support/factories/outbox.factory';
import { initTestDataSource } from './support/test-data-source';

describe('integration: async persistence', () => {
  let ds: DataSource;
  let idempotencyService: IdempotencyService;
  let outboxService: OutboxService;
  let worker: AsyncWorkerService;

  beforeAll(async () => {
    ds = await initTestDataSource();

    idempotencyService = new IdempotencyService(
      ds.getRepository(ProcessedMessage),
    );
    outboxService = new OutboxService(ds.getRepository(OutboxEvent));
    worker = new AsyncWorkerService(idempotencyService);
  });

  beforeEach(async () => {
    await truncateTestTables(ds);
  });

  afterAll(async () => {
    if (ds?.isInitialized) await ds.destroy();
  });

  it('records processed message once and skips duplicates', async () => {
    const message = buildAsyncEnvelope({ id: 'msg-dedup-1', topic: 'user.sync' });
    const handler = jest.fn(async () => undefined);

    await worker.handleMessage(message, handler);
    await worker.handleMessage(message, handler);

    const stored = await ds.getRepository(ProcessedMessage).find();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(stored).toHaveLength(1);
    expect(stored[0].messageId).toBe('msg-dedup-1');
  });

  it('enqueues outbox event and marks it published', async () => {
    const event = await outboxService.enqueue({
      aggregateType: 'user',
      aggregateId: 'u-123',
      eventType: 'UserCreated',
      payload: buildOutboxPayload({ userId: 'u-123' }),
    });

    const pending = await outboxService.claimPending(10);
    expect(pending.map((item) => item.id)).toContain(event.id);
    expect(pending[0].status).toBe('pending');

    await outboxService.markPublished(event.id);

    const reloaded = await ds.getRepository(OutboxEvent).findOneByOrFail({
      id: event.id,
    });
    expect(reloaded.status).toBe('published');
    expect(reloaded.publishedAt).toBeTruthy();
  });

  it('marks failed events with retry metadata', async () => {
    const event = await outboxService.enqueue({
      aggregateType: 'invoice',
      aggregateId: 'inv-7',
      eventType: 'InvoiceIssued',
      payload: buildOutboxPayload({ invoiceId: 'inv-7' }),
    });

    const retryAt = new Date(Date.now() + 60_000);
    await outboxService.markFailed(event.id, 'temporary broker error', retryAt);

    const reloaded = await ds.getRepository(OutboxEvent).findOneByOrFail({
      id: event.id,
    });
    expect(reloaded.status).toBe('pending');
    expect(reloaded.attempts).toBe(1);
    expect(reloaded.lastError).toContain('temporary broker error');
    expect(new Date(reloaded.availableAt).getTime()).toBe(retryAt.getTime());
  });
});
