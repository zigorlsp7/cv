import { ApiProperty } from '@nestjs/swagger';

export class ArchitectureNodeDto {
  @ApiProperty({ example: 'api' })
  id!: string;

  @ApiProperty({ example: 'API (NestJS)' })
  label!: string;

  @ApiProperty({
    enum: ['frontend', 'api', 'data', 'observability', 'delivery'],
    example: 'api',
  })
  layer!: 'frontend' | 'api' | 'data' | 'observability' | 'delivery';

  @ApiProperty({
    enum: ['ui', 'service', 'database', 'pipeline', 'gateway'],
    example: 'service',
  })
  kind!: 'ui' | 'service' | 'database' | 'pipeline' | 'gateway';

  @ApiProperty({ example: 'Secure API runtime with typed config and health.' })
  summary!: string;

  @ApiProperty({ example: 420 })
  x!: number;

  @ApiProperty({ example: 260 })
  y!: number;
}

export class ArchitectureEdgeDto {
  @ApiProperty({ example: 'web' })
  from!: string;

  @ApiProperty({ example: 'api' })
  to!: string;

  @ApiProperty({ example: 'calls' })
  relation!: string;
}

export class ArchitectureStatsDto {
  @ApiProperty({ example: 18 })
  nodeCount!: number;

  @ApiProperty({ example: 22 })
  edgeCount!: number;
}

export class ArchitectureGraphDto {
  @ApiProperty({ example: '2026.02' })
  version!: string;

  @ApiProperty({ example: '2026-02-14T15:00:00.000Z' })
  generatedAt!: string;

  @ApiProperty({
    type: [String],
    example: ['frontend', 'api', 'data', 'observability', 'delivery'],
  })
  layers!: Array<'frontend' | 'api' | 'data' | 'observability' | 'delivery'>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'boolean' },
    example: { swagger_docs: true, rum_ingest: true },
  })
  featureFlags!: Record<string, boolean>;

  @ApiProperty({ type: [ArchitectureNodeDto] })
  nodes!: ArchitectureNodeDto[];

  @ApiProperty({ type: [ArchitectureEdgeDto] })
  edges!: ArchitectureEdgeDto[];

  @ApiProperty({ type: ArchitectureStatsDto })
  stats!: ArchitectureStatsDto;
}
