import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateGroupRequest {
  @ApiProperty({ type: String, description: 'Group name', example: 'Group' })
  @IsOptional()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Group description',
    example: 'Group description',
  })
  @IsOptional()
  description: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Group members',
    example: [new Types.ObjectId().toString()],
  })
  @IsOptional()
  @IsMongoId({ each: true })
  members: string[];
}
