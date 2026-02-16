import { AsyncWorkerService } from './async.worker.service';
import { IdempotencyService } from './idempotency.service';

describe('AsyncWorkerService', () => {
  function buildService(overrides: Partial<IdempotencyService> = {}) {
    const idempotency = {
      wasProcessed: jest.fn().mockResolvedValue(false),
      recordProcessed: jest.fn().mockResolvedValue(true),
      ...overrides,
    } as unknown as IdempotencyService;

    return {
      service: new AsyncWorkerService(idempotency),
      idempotency,
    };
  }

  it('runs handler and records message once', async () => {
    const { service, idempotency } = buildService();
    const handler = jest.fn().mockResolvedValue(undefined);

    await service.handleMessage(
      {
        id: 'msg-1',
        topic: 'test.topic',
        key: null,
        occurredAt: new Date().toISOString(),
        payload: { hello: 'world' },
      },
      handler,
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect((idempotency.recordProcessed as jest.Mock).mock.calls[0][0]).toMatchObject({
      messageId: 'msg-1',
      topic: 'test.topic',
    });
  });

  it('skips handler when message already processed', async () => {
    const { service } = buildService({
      wasProcessed: jest.fn().mockResolvedValue(true),
    });
    const handler = jest.fn().mockResolvedValue(undefined);

    await service.handleMessage(
      {
        id: 'msg-2',
        topic: 'test.topic',
        key: null,
        occurredAt: new Date().toISOString(),
        payload: {},
      },
      handler,
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it('handles concurrent processing signal when insert returns false', async () => {
    const { service, idempotency } = buildService({
      recordProcessed: jest.fn().mockResolvedValue(false),
    });
    const handler = jest.fn().mockResolvedValue(undefined);

    await service.handleMessage(
      {
        id: 'msg-3',
        topic: 'test.topic',
        key: null,
        occurredAt: new Date().toISOString(),
        payload: {},
      },
      handler,
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(idempotency.recordProcessed).toHaveBeenCalledTimes(1);
  });
});
