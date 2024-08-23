import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateMessageRequest {
  @ApiProperty({
    type: String,
    description: 'Message content',
    example: 'Message content',
  })
  @IsNotEmpty()
  content?: string;
}
