import { ApiProperty } from '@nestjs/swagger';
import {
  PaginationAdapter,
  IPagination,
} from '../../shared/helpers/pagination';
import { GroupResponse } from './group.response';

export class GroupsPagination
  extends PaginationAdapter
  implements IPagination<GroupResponse>
{
  @ApiProperty({
    description: 'data contain the group Data ',
    type: GroupResponse,
    isArray: true,
  })
  data: GroupResponse[];
}
