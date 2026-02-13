import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorBody {
  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code!: string;

  @ApiProperty({ example: 'Validation failed' })
  message!: string;

  @ApiProperty({ required: false })
  details?: unknown;
}

export class ApiErrorEnvelope {
  @ApiProperty({ example: false })
  ok!: false;

  @ApiProperty({ example: '8e8f2b6a-2e2e-4c08-8d8e-6a2f1a8f7a0c' })
  requestId!: string;

  @ApiProperty()
  error!: ApiErrorBody;
}

export class ApiSuccessEnvelope<TData> {
  @ApiProperty({ example: true })
  ok!: true;

  @ApiProperty({ example: '8e8f2b6a-2e2e-4c08-8d8e-6a2f1a8f7a0c' })
  requestId!: string;

  // Swagger can’t express generics well; we’ll override per-endpoint with ApiOkResponse({schema})
  data!: TData;
}
