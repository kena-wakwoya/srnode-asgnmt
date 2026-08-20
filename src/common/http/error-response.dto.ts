import { ApiProperty } from '@nestjs/swagger';

export class ErrorBodyDto {
  @ApiProperty({ example: 'IMPORT_FILE_TOO_LARGE' })
  code!: string;

  @ApiProperty({ example: 'The uploaded file exceeds the allowed size' })
  message!: string;

  @ApiProperty({ example: '6f1d2c8a-3b9e-4c11-9a0d-1f2e3d4c5b6a' })
  requestId!: string;
}

export class ErrorResponseDto {
  @ApiProperty({ type: ErrorBodyDto })
  error!: ErrorBodyDto;
}
