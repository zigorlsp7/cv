import { DataSource } from 'typeorm';
import { config } from '../src/config/app.config';

describe('integration: postgres connectivity', () => {
  let ds: DataSource;

  beforeAll(async () => {
    ds = new DataSource({
      type: 'postgres',
      host: config.db.host,
      port: config.db.port,
      username: config.db.user,
      password: config.db.password,
      database: config.db.name,
    });
    await ds.initialize();
  });

  afterAll(async () => {
    if (ds?.isInitialized) await ds.destroy();
  });

  it('can query and sees migrations table (after migration:run)', async () => {
    const res = await ds.query(`
      SELECT to_regclass('public.migrations') as migrations_table
    `);
    expect(res?.[0]?.migrations_table).toBe('migrations');
  });
});
