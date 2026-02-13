import { ApiProperty } from '@nestjs/swagger';

export class DbHealthDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 3 })
  latencyMs!: number;
}

export class HealthDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ type: DbHealthDto })
  db!: DbHealthDto;
}
