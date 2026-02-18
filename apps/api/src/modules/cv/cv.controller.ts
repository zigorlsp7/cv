import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { CvProfileDto, UpsertCvProfileDto } from './cv.dto';
import { CvService } from './cv.service';
import { AdminTokenGuard, ADMIN_TOKEN_HEADER } from '../../common/auth/admin-token.guard';

@ApiTags('cv')
@Controller({ path: 'cv', version: '1' })
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Get persisted CV profile content' })
  @ApiOkResponse({ type: CvProfileDto })
  getProfile(): Promise<CvProfileDto> {
    return this.cvService.getProfile();
  }

  @Put()
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: 'Create/update persisted CV profile content' })
  @ApiHeader({
    name: ADMIN_TOKEN_HEADER,
    required: true,
    description: 'Admin token required for write operations',
  })
  @ApiBody({ type: UpsertCvProfileDto })
  @ApiOkResponse({ type: CvProfileDto })
  upsertProfile(@Body() body: UpsertCvProfileDto): Promise<CvProfileDto> {
    return this.cvService.upsertProfile(body);
  }
}
