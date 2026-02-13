import { DataSource } from 'typeorm';

describe('integration: postgres connectivity', () => {
  let ds: DataSource;

  beforeAll(async () => {
    ds = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'app',
      password: process.env.DB_PASSWORD ?? 'app',
      database: process.env.DB_NAME ?? 'cv',
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
