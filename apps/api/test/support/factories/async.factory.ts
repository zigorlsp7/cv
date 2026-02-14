import { AsyncEnvelope } from '../../../src/modules/async/async.worker.service';

export function buildAsyncEnvelope(
  overrides: Partial<AsyncEnvelope> = {},
): AsyncEnvelope {
  return {
    id: 'msg-1',
    topic: 'test.topic',
    key: 'key-1',
    occurredAt: new Date().toISOString(),
    payload: { value: 1 },
    ...overrides,
  };
}
