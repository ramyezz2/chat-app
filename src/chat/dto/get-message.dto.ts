import { ApiProperty } from '@nestjs/swagger';

export class GetMessageDto {
  @ApiProperty({
    required: false,
  })
  readonly lastId: string;

  @ApiProperty({
    required: false,
    default: 10,
  })
  readonly limit: number = 10;

  constructor(data) {
    Object.assign(this, data);
  }
}
