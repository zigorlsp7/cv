import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { CvProfileDto, UpsertCvProfileDto } from './cv.dto';
import { CvService } from './cv.service';

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
  @ApiOperation({ summary: 'Create/update persisted CV profile content' })
  @ApiBody({ type: UpsertCvProfileDto })
  @ApiOkResponse({ type: CvProfileDto })
  upsertProfile(@Body() body: UpsertCvProfileDto): Promise<CvProfileDto> {
    return this.cvService.upsertProfile(body);
  }
}
