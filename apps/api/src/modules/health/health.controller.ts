import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DbHealthService } from './db-health.service';
import { LivenessDto, ReadinessDto } from './health.dto';

@SkipThrottle()
@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly db: DbHealthService) {}

  @Get('live')
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        requestId: { type: 'string', example: 'demo123' },
        data: { $ref: '#/components/schemas/LivenessDto' },
      },
      required: ['ok', 'requestId', 'data'],
    },
  })
  live(): LivenessDto {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        requestId: { type: 'string', example: 'demo123' },
        data: { $ref: '#/components/schemas/ReadinessDto' },
      },
      required: ['ok', 'requestId', 'data'],
    },
  })
  async ready(): Promise<ReadinessDto> {
    const db = await this.db.ping();
    return { status: 'ok', db };
  }

  @Get()
  @ApiOperation({
    deprecated: true,
    summary: 'Backward-compatible readiness endpoint. Prefer /v1/health/ready.',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        requestId: { type: 'string', example: 'demo123' },
        data: { $ref: '#/components/schemas/ReadinessDto' },
      },
      required: ['ok', 'requestId', 'data'],
    },
  })
  ok(): Promise<ReadinessDto> {
    return this.ready();
  }
}
