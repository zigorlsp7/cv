import { DataSource } from 'typeorm';
import { truncateTestTables } from './support/db-cleanup';
import { initTestDataSource } from './support/test-data-source';

describe('integration: postgres connectivity', () => {
  let ds: DataSource;

  beforeAll(async () => {
    ds = await initTestDataSource();
  });

  beforeEach(async () => {
    await truncateTestTables(ds);
  });

  afterAll(async () => {
    if (ds?.isInitialized) await ds.destroy();
  });

  it('can query and sees migration + async persistence tables', async () => {
    const res = await ds.query(`
      SELECT
        to_regclass('public.migrations') as migrations_table,
        to_regclass('public.processed_messages') as processed_messages_table,
        to_regclass('public.outbox_events') as outbox_events_table
    `);
    expect(res?.[0]?.migrations_table).toBe('migrations');
    expect(res?.[0]?.processed_messages_table).toBe('processed_messages');
    expect(res?.[0]?.outbox_events_table).toBe('outbox_events');
  });
});
