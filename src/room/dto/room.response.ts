import { ApiProperty } from '@nestjs/swagger';
import { RoomTypeEnum } from 'src/shared/enums';
import { SimpleListResponse } from 'src/shared/types/simple-list.response.dto';

export class RoomResponse {
  @ApiProperty({ type: String, description: 'Room id' })
  id: string;

  @ApiProperty({ type: String, description: 'Room name', example: 'room' })
  name: string;

  @ApiProperty({
    type: String,
    enum: RoomTypeEnum,
    description: 'Room type',
    example: RoomTypeEnum.PUBLIC,
  })
  type: RoomTypeEnum;

  @ApiProperty({ type: String, description: 'Room description' })
  description: string;

  @ApiProperty({ type: String, description: 'Room members' })
  members: SimpleListResponse[];

  @ApiProperty({ type: SimpleListResponse, description: 'Room name' })
  createdBy: SimpleListResponse;
}
