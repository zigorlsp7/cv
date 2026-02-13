import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DbHealthService } from './db-health.service';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly db: DbHealthService) {}

  @Get()
  async ok() {
    const db = await this.db.ping();
    return { status: 'ok', db };
  }
}
