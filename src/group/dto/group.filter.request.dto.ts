import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { pickBy } from 'lodash';
import { GroupTypeEnum } from 'src/shared/enums';

export class GroupFilterRequest {
  constructor(initialize?) {
    if (initialize) {
      Object.assign(this, initialize);
    }
  }

  @ApiProperty({
    type: String,
    description: 'Group name',
    required: false,
  })
  @IsOptional()
  name?: string;

  @ApiProperty({
    type: String,
    enum: GroupTypeEnum,
    description: 'Group type',
    required: false,
  })
  @IsOptional()
  @IsEnum(GroupTypeEnum)
  type?: GroupTypeEnum;

  public buildFilterRO?(): any {
    const filterObj = {
      name: this.name ? new RegExp(this.name, 'i') : null,
      type: this.type ? new RegExp(this.type, 'i') : null,
    };

    return pickBy(filterObj, function (value) {
      return !(value === null);
    });
  }
}
