import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { FeatureFlagsService } from './feature-flags.service';

@SkipThrottle()
@ApiTags('feature-flags')
@Controller({ path: 'feature-flags', version: '1' })
export class FeatureFlagsController {
  constructor(private readonly flags: FeatureFlagsService) {}

  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'boolean',
      },
      example: {
        swagger_docs: true,
        rum_ingest: true,
      },
    },
  })
  list() {
    return this.flags.getAll();
  }
}

