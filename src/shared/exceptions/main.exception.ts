import { ApiProperty } from '@nestjs/swagger';

export class MainExceptionDto {
  @ApiProperty({
    type: String,
    description: 'exception message error',
    example: 'Input data validation failed',
  })
  message: string;

  @ApiProperty({ type: Object, description: 'error object' })
  errors: [];
}
