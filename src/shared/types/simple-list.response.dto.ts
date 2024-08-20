import { ApiProperty } from '@nestjs/swagger';

export class SimpleListResponse {
  @ApiProperty({
    type: String,
    description: 'list mongo object id with length 24 chars',
    example: '000000000000000000000001',
  })
  id: string;

  @ApiProperty({ type: String, description: 'list name', example: 'name' })
  name: string;
}
