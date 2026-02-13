import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { typeOrmCliConfig } from './config/typeorm.cli.config';

export default new DataSource(typeOrmCliConfig);
