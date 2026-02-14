import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class RumEventDto {
  @IsIn(['web-vital', 'js-error', 'navigation'])
  type!: 'web-vital' | 'js-error' | 'navigation';

  @IsString()
  @MaxLength(2048)
  path!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  metricName?: string;

  @IsOptional()
  @IsNumber()
  metricValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  message?: string;

  @IsOptional()
  @IsUUID()
  requestId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  release?: string;
}

export class RumBatchDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => RumEventDto)
  events!: RumEventDto[];
}
