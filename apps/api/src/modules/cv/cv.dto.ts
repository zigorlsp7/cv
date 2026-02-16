import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CvSectionDto {
  @ApiProperty({ example: 'projects' })
  @IsString()
  @MaxLength(64)
  id!: string;

  @ApiProperty({ example: 'Projects' })
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: 'Flagship projects that prove execution and ownership.' })
  @IsString()
  @MaxLength(1_000)
  summary!: string;

  @ApiProperty({
    type: [String],
    example: [
      'Problem statement and architecture approach.',
      'What you implemented end-to-end.',
      'Measured result and lessons learned.',
    ],
  })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(240, { each: true })
  bullets!: string[];
}

export class CvDocumentDto {
  @ApiProperty({ example: 'Your Name' })
  @IsString()
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: 'Senior Software Engineer' })
  @IsString()
  @MaxLength(160)
  role!: string;

  @ApiProperty({
    example:
      'Backend, cloud, and platform engineering with a focus on reliability and delivery velocity.',
  })
  @IsString()
  @MaxLength(1_000)
  tagline!: string;

  @ApiProperty({
    type: [String],
    example: ['Location: City, Country', 'Email: your@email.com'],
  })
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(180, { each: true })
  chips!: string[];

  @ApiProperty({ type: [CvSectionDto] })
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => CvSectionDto)
  sections!: CvSectionDto[];
}

export class UpsertCvProfileDto extends CvDocumentDto {}

export class CvProfileDto extends CvDocumentDto {
  @ApiProperty({ example: '2026-02-16T16:00:00.000Z' })
  @IsDateString()
  updatedAt!: string;
}

