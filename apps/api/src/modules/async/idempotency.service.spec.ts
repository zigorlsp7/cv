import { Repository } from 'typeorm';
import { ProcessedMessage } from './entities/processed-message.entity';
import { IdempotencyService } from './idempotency.service';

describe('IdempotencyService', () => {
  function buildRepoMock() {
    return {
      exist: jest.fn().mockResolvedValue(false),
      insert: jest.fn().mockResolvedValue(undefined),
    } as unknown as Repository<ProcessedMessage>;
  }

  it('returns processed status from repository', async () => {
    const repo = buildRepoMock();
    (repo.exist as jest.Mock).mockResolvedValue(true);
    const service = new IdempotencyService(repo);

    await expect(service.wasProcessed('msg-1')).resolves.toBe(true);
  });

  it('returns false on duplicate insert', async () => {
    const repo = buildRepoMock();
    (repo.insert as jest.Mock).mockRejectedValue({ code: '23505' });
    const service = new IdempotencyService(repo);

    await expect(
      service.recordProcessed({ messageId: 'msg-1', topic: 'topic', key: null }),
    ).resolves.toBe(false);
  });

  it('throws on non-unique insert errors', async () => {
    const repo = buildRepoMock();
    const error = new Error('boom');
    (repo.insert as jest.Mock).mockRejectedValue(error);
    const service = new IdempotencyService(repo);

    await expect(
      service.recordProcessed({ messageId: 'msg-1', topic: 'topic', key: null }),
    ).rejects.toThrow('boom');
  });

  it('throws when insert fails with a non-object error payload', async () => {
    const repo = buildRepoMock();
    (repo.insert as jest.Mock).mockRejectedValue('boom');
    const service = new IdempotencyService(repo);

    await expect(
      service.recordProcessed({ messageId: 'msg-1', topic: 'topic', key: null }),
    ).rejects.toEqual('boom');
  });
});
