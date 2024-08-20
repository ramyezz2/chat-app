import { ApiProperty } from '@nestjs/swagger';
import {
  PaginationAdapter,
  IPagination,
} from '../../shared/helpers/pagination';
import { SimpleListResponse } from './simple-list.response.dto';

export class PaginationSimpleList
  extends PaginationAdapter
  implements IPagination<SimpleListResponse>
{
  @ApiProperty({
    description: 'data contain simple list data ',
    type: SimpleListResponse,
    isArray: true,
  })
  data: SimpleListResponse[];
}
