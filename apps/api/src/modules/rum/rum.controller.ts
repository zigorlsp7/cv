import { Body, Controller, NotFoundException, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { RumBatchDto } from './rum.dto';
import { RumService } from './rum.service';

@SkipThrottle()
@ApiTags('rum')
@Controller({ path: 'rum', version: '1' })
export class RumController {
  constructor(
    private readonly rumService: RumService,
    private readonly flags: FeatureFlagsService,
  ) {}

  @Post('events')
  @ApiOperation({ summary: 'Ingest browser RUM events' })
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: {
        accepted: { type: 'number', example: 2 },
      },
      required: ['accepted'],
    },
  })
  ingest(@Body() body: RumBatchDto) {
    if (!this.flags.isEnabled('rum_ingest')) {
      throw new NotFoundException('RUM ingest is disabled');
    }

    this.rumService.ingest(body.events);
    return { accepted: body.events.length };
  }
}

