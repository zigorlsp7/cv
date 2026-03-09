import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { CvProfileDto, UpsertCvProfileDto } from './cv.dto';
import { CvService } from './cv.service';
import { SessionUserGuard } from '../../common/auth/session-user.guard';

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
  @UseGuards(SessionUserGuard)
  @ApiOperation({ summary: 'Create/update persisted CV profile content' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid signed session headers' })
  @ApiForbiddenResponse({ description: 'Admin role is required' })
  @ApiBody({ type: UpsertCvProfileDto })
  @ApiOkResponse({ type: CvProfileDto })
  upsertProfile(
    @Body() body: UpsertCvProfileDto,
    @Req() req: Request,
  ): Promise<CvProfileDto> {
    const user = (req as any).user as { role?: string } | undefined;
    if (user?.role !== 'admin') {
      throw new ForbiddenException('Admin role is required');
    }
    return this.cvService.upsertProfile(body);
  }
}
