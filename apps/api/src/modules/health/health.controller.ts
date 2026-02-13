import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DbHealthService } from './db-health.service';
import { HealthDto } from './health.dto';

@SkipThrottle()
@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly db: DbHealthService) {}

  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        requestId: { type: 'string', example: 'demo123' },
        data: { $ref: '#/components/schemas/HealthDto' },
      },
      required: ['ok', 'requestId', 'data'],
    },
  })
  async ok(): Promise<HealthDto> {
    const db = await this.db.ping();
    return { status: 'ok', db };
  }
}
