import { DataSourceOptions } from 'typeorm';
import { config } from './app.config';
import { Dummy } from '../modules/infrastructure/dummy.entity';

const isProd = config.nodeEnv === 'production';

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,

  synchronize: false,

  logging: !isProd,
  entities: [Dummy],

  migrations: isProd ? ['dist/migrations/*.js'] : [],
};
