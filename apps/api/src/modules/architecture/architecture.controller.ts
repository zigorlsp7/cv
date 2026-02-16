import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ArchitectureGraphDto } from './architecture.dto';
import { ArchitectureService } from './architecture.service';

@SkipThrottle()
@ApiTags('architecture')
@Controller({ path: 'architecture', version: '1' })
export class ArchitectureController {
  constructor(private readonly architectureService: ArchitectureService) {}

  @Get('graph')
  @ApiOperation({
    summary:
      'Returns architecture graph nodes/edges for interactive visualization.',
  })
  @ApiOkResponse({ type: ArchitectureGraphDto })
  getGraph(): ArchitectureGraphDto {
    return this.architectureService.getGraph();
  }
}
