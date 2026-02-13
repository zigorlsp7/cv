import { DataSourceOptions } from 'typeorm';
import { Dummy } from '../modules/infrastructure/dummy.entity';

const isProd = process.env.NODE_ENV === 'production';

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'app',
  password: process.env.DB_PASSWORD ?? 'app',
  database: process.env.DB_NAME ?? 'cv',

  synchronize: false,

  logging: !isProd,
  entities: [Dummy],

  migrations: isProd ? ['dist/migrations/*.js'] : [],
};
