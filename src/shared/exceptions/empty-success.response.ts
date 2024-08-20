import { ApiProperty } from '@nestjs/swagger';

export class EmptySuccessData {
  @ApiProperty({
    type: String,
    description: 'exception message error',
    example: 'Input data validation failed',
  })
  message: string;
}
