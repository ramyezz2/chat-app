import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class CreateDirectMessageRequest {
  @ApiProperty({
    type: String,
    description: 'Message content',
    example: 'Message content',
  })
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    type: String,
    description: 'Message receiverId',
    example: new Types.ObjectId().toString(),
  })
  @IsNotEmpty()
  @IsMongoId()
  receiverId: string;
}
