import { DataSourceOptions } from 'typeorm';
import { config } from './app.config';

export function buildTypeOrmCliConfig(): DataSourceOptions {
  const isProd = config.nodeEnv === 'production';

  return {
    type: 'postgres',
    host: config.db.host,
    port: config.db.port,
    username: config.db.user,
    password: config.db.password,
    database: config.db.name,

    entities: isProd ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],
    migrations: isProd ? ['dist/migrations/*.js'] : ['src/migrations/*.ts'],
  };
}
