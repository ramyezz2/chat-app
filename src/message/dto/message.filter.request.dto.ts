import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { pickBy } from 'lodash';

export class MessageFilterRequest {
  constructor(initialize?) {
    if (initialize) {
      Object.assign(this, initialize);
    }
  }

  @ApiProperty({
    type: String,
    description: 'Message content',
    required: false,
  })
  @IsOptional()
  content?: string;

  public buildFilterRO?(): any {
    const filterObj = {
      content: this.content ? new RegExp(this.content, 'i') : null,
    };

    return pickBy(filterObj, function (value) {
      return !(value === null);
    });
  }
}
