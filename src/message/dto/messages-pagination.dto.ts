import { ApiProperty } from '@nestjs/swagger';
import {
  PaginationAdapter,
  IPagination,
} from '../../shared/helpers/pagination';
import { MessageResponse } from './message.response';

export class MessagesPagination
  extends PaginationAdapter
  implements IPagination<MessageResponse>
{
  @ApiProperty({
    description: 'data contain the message Data ',
    type: MessageResponse,
    isArray: true,
  })
  data: MessageResponse[];
}
