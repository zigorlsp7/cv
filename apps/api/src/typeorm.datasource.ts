import * as dotenv from 'dotenv';
import * as path from 'path';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildTypeOrmCliConfig } from './config/typeorm.cli.config';

dotenv.config({
  path:
    process.env.NODE_ENV === 'test'
      ? path.resolve(__dirname, '..', '.env.test') // __dirname is apps/api/src
      : path.resolve(__dirname, '..', '.env'),
});

export default new DataSource(buildTypeOrmCliConfig());
