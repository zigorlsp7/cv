import { DataSource } from 'typeorm';
import { buildTypeOrmCliConfig } from '../../src/config/typeorm.cli.config';

export async function initTestDataSource(): Promise<DataSource> {
  const dataSource = new DataSource({
    ...buildTypeOrmCliConfig(),
    logging: false,
  });
  await dataSource.initialize();
  return dataSource;
}
