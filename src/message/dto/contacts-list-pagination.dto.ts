import { ApiProperty } from '@nestjs/swagger';
import {
  PaginationAdapter,
  IPagination,
} from '../../shared/helpers/pagination';
import { ContactListResponse } from './contact-list.response';

export class ContactsListPagination
  extends PaginationAdapter
  implements IPagination<ContactListResponse>
{
  @ApiProperty({
    description: 'data contain the contact Data ',
    type: ContactListResponse,
    isArray: true,
  })
  data: ContactListResponse[];
}
