import { Repository } from 'typeorm';
import { OutboxEvent } from './entities/outbox-event.entity';
import { OutboxService } from './outbox.service';

describe('OutboxService', () => {
  function buildRepoMock() {
    return {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(undefined),
      findOneByOrFail: jest.fn().mockResolvedValue({
        id: 'evt-1',
        attempts: 0,
        availableAt: new Date(),
      }),
    } as unknown as Repository<OutboxEvent>;
  }

  it('enqueues pending events', async () => {
    const repo = buildRepoMock();
    const service = new OutboxService(repo);

    const event = await service.enqueue({
      aggregateType: 'user',
      aggregateId: 'u-1',
      eventType: 'UserCreated',
      payload: { userId: 'u-1' },
    });

    expect(event.aggregateType).toBe('user');
    expect(event.status).toBe('pending');
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('marks events as published', async () => {
    const repo = buildRepoMock();
    const service = new OutboxService(repo);

    await service.markPublished('evt-1');

    expect(repo.update).toHaveBeenCalledWith(
      { id: 'evt-1' },
      expect.objectContaining({ status: 'published' }),
    );
  });

  it('marks failed events as retryable when retryAt is provided', async () => {
    const repo = buildRepoMock();
    const service = new OutboxService(repo);

    await service.markFailed('evt-1', 'broker timeout', new Date());

    expect(repo.update).toHaveBeenCalledWith(
      { id: 'evt-1' },
      expect.objectContaining({
        status: 'pending',
        attempts: 1,
        lastError: 'broker timeout',
      }),
    );
  });
});
