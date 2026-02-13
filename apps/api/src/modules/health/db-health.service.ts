import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DbHealthService {
  constructor(private readonly dataSource: DataSource) {}

  async ping(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    await this.dataSource.query('select 1');
    const latencyMs = Date.now() - start;

    return { ok: true, latencyMs };
  }
}
