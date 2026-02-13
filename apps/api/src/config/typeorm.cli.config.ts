import { DataSourceOptions } from 'typeorm';
import { config } from './app.config';

export function buildTypeOrmCliConfig(): DataSourceOptions {
  return {
    type: 'postgres',
    host: config.db.host,
    port: config.db.port,
    username: config.db.user,
    password: config.db.password,
    database: config.db.name,

    entities: ['src/**/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
  };
}
