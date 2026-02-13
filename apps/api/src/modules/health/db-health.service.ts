import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DbHealthService {
  constructor(private readonly dataSource: DataSource) {}

  async ping(): Promise<'ok'> {
    await this.dataSource.query('SELECT 1');
    return 'ok';
  }
}
