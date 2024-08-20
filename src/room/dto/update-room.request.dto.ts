import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateRoomRequest {
  @ApiProperty({ type: String, description: 'Room name', example: 'Room' })
  @IsOptional()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Room description',
    example: 'Room description',
  })
  @IsOptional()
  description: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Room members',
    example: [new Types.ObjectId().toString()],
  })
  @IsOptional()
  @IsMongoId({ each: true })
  members: string[];
}
