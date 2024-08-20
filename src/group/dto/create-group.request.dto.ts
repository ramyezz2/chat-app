import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { GroupTypeEnum } from 'src/shared/enums';
import { Types } from 'mongoose';

export class CreateGroupRequest {
  @ApiProperty({ type: String, description: 'Group name', example: 'Group' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Group type',
    example: GroupTypeEnum.PUBLIC,
  })
  @IsNotEmpty()
  @IsEnum(GroupTypeEnum)
  type: GroupTypeEnum;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Group description',
    example: 'Group description',
  })
  @IsOptional()
  description: string;

  @ApiProperty({
    type: String,
    description: 'Group members',
    example: [new Types.ObjectId().toString()],
  })
  @IsNotEmpty()
  @IsMongoId({ each: true })
  members: string[];
}
