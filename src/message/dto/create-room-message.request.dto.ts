import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class CreateRoomMessageRequest {
  @ApiProperty({
    type: String,
    description: 'Message content',
    example: 'Message content',
  })
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    type: String,
    description: 'Message roomId',
    example: new Types.ObjectId().toString(),
  })
  @IsNotEmpty()
  @IsMongoId()
  roomId: string;
}
