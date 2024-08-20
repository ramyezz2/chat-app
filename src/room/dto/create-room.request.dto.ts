import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { RoomTypeEnum } from 'src/shared/enums';
import { Types } from 'mongoose';

export class CreateRoomRequest {
  @ApiProperty({ type: String, description: 'Room name', example: 'Room' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Room type',
    example: RoomTypeEnum.PUBLIC,
  })
  @IsNotEmpty()
  @IsEnum(RoomTypeEnum)
  type: RoomTypeEnum;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Room description',
    example: 'Room description',
  })
  @IsOptional()
  description: string;

  @ApiProperty({
    type: String,
    description: 'Room members',
    example: [new Types.ObjectId().toString()],
  })
  @IsNotEmpty()
  @IsMongoId({ each: true })
  members: string[];
}
