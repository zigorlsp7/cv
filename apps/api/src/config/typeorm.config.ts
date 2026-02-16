import { DataSourceOptions } from 'typeorm';
import { config } from './app.config';
import { Dummy } from '../modules/infrastructure/dummy.entity';
import { OutboxEvent } from '../modules/async/entities/outbox-event.entity';
import { ProcessedMessage } from '../modules/async/entities/processed-message.entity';
import { CvProfile } from '../modules/cv/entities/cv-profile.entity';

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
  entities: [Dummy, ProcessedMessage, OutboxEvent, CvProfile],

  migrations: isProd ? ['dist/migrations/*.js'] : [],
};
