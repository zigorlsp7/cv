import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config/app.config';
import { buildTypeOrmCliConfig } from './config/typeorm.cli.config';

void config;

export default new DataSource(buildTypeOrmCliConfig());
