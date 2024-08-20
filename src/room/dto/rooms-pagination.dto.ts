import { ApiProperty } from '@nestjs/swagger';
import {
  PaginationAdapter,
  IPagination,
} from '../../shared/helpers/pagination';
import { RoomResponse } from './room.response';

export class RoomsPagination
  extends PaginationAdapter
  implements IPagination<RoomResponse>
{
  @ApiProperty({
    description: 'data contain the room Data ',
    type: RoomResponse,
    isArray: true,
  })
  data: RoomResponse[];
}
