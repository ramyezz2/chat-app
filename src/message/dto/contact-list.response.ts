import { ApiProperty } from '@nestjs/swagger';
import { MessageTypeEnum } from 'src/shared/enums';
import { SimpleListResponse } from 'src/shared/types/simple-list.response.dto';

export class ContactListResponse {
  // @ApiProperty({ type: String, description: 'Message id' })
  // id: string;

  @ApiProperty({
    type: String,
    enum: MessageTypeEnum,
    description: 'Message type',
    example: MessageTypeEnum.DIRECT,
  })
  type: MessageTypeEnum;

  @ApiProperty({
    type: String,
    description: 'Message content',
    example: 'message content',
  })
  content: string;

  @ApiProperty({ type: SimpleListResponse, description: 'Message sender' })
  member: SimpleListResponse;

  @ApiProperty({ type: SimpleListResponse, description: 'Message room' })
  room: SimpleListResponse;

  @ApiProperty({ type: String, description: 'Message createdAt' })
  createdAt: Date;
}
