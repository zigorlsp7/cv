import { DataSourceOptions } from 'typeorm';
import { Dummy } from '../modules/infrastructure/dummy.entity';

export const typeOrmCliConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'app',
  password: process.env.DB_PASSWORD ?? 'app',
  database: process.env.DB_NAME ?? 'cv',

  synchronize: false,
  logging: true,

  entities: [Dummy],

  migrations: ['src/migrations/*.ts'],
};
