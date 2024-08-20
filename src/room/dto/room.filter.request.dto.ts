import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { pickBy } from 'lodash';
import { RoomTypeEnum } from 'src/shared/enums';

export class RoomFilterRequest {
  constructor(initialize?) {
    if (initialize) {
      Object.assign(this, initialize);
    }
  }

  @ApiProperty({
    type: String,
    description: 'Room name',
    required: false,
  })
  @IsOptional()
  name?: string;

  @ApiProperty({
    type: String,
    enum: RoomTypeEnum,
    description: 'Room type',
    required: false,
  })
  @IsOptional()
  @IsEnum(RoomTypeEnum)
  type?: RoomTypeEnum;

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
