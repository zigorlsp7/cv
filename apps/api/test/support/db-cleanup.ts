import { DataSource } from 'typeorm';

const DEFAULT_TABLES = ['dummy', 'processed_messages', 'outbox_events'] as const;

export async function truncateTestTables(
  dataSource: DataSource,
  tables = [...DEFAULT_TABLES],
): Promise<void> {
  if (tables.length === 0) return;

  const targets = tables.map((table) => `"${table}"`).join(', ');
  await dataSource.query(`TRUNCATE TABLE ${targets} RESTART IDENTITY CASCADE`);
}
