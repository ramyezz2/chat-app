import { ApiProperty } from '@nestjs/swagger';
import { MessageTypeEnum } from 'src/shared/enums';
import { SimpleListResponse } from 'src/shared/types/simple-list.response.dto';

class MessageEditHistoryResponse {
  @ApiProperty({ type: String, description: 'Message editHistory content' })
  content: string;

  @ApiProperty({ type: String, description: 'Message editHistory createdAt' })
  createdAt: Date;
}

export class MessageResponse {
  @ApiProperty({ type: String, description: 'Message id' })
  id: string;

  @ApiProperty({
    type: String,
    description: 'Message content',
    example: 'message content',
  })
  content: string;

  @ApiProperty({
    type: String,
    description: 'Message type',
    example: MessageTypeEnum.DIRECT,
  })
  type: MessageTypeEnum;

  @ApiProperty({ type: SimpleListResponse, description: 'Message sender' })
  sender: SimpleListResponse;

  @ApiProperty({ type: SimpleListResponse, description: 'Message receiver' })
  receiver: SimpleListResponse;

  @ApiProperty({ type: SimpleListResponse, description: 'Message room' })
  room: SimpleListResponse;

  @ApiProperty({ type: String, description: 'Message createdAt' })
  createdAt: Date;

  @ApiProperty({ type: String, description: 'Message updatedAt' })
  updatedAt: Date;

  @ApiProperty({ type: String, description: 'Message editHistory' })
  editHistory: MessageEditHistoryResponse[];
}
