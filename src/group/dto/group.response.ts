import { ApiProperty } from '@nestjs/swagger';
import { SimpleListResponse } from 'src/shared/types/simple-list.response.dto';

export class GroupResponse {
  @ApiProperty({ type: String, description: 'Group id' })
  id: string;

  @ApiProperty({ type: String, description: 'Group name', example: 'group' })
  name: string;

  @ApiProperty({ type: String, description: 'Group type', example: 'group' })
  type: string;

  @ApiProperty({ type: String, description: 'Group description' })
  description: string;

  @ApiProperty({ type: String, description: 'Group members' })
  members: SimpleListResponse[];

  @ApiProperty({ type: SimpleListResponse, description: 'Group name' })
  createdBy: SimpleListResponse;
}
