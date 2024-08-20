import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class QuerySelected {
  @ApiProperty({
    required: false,
    type: Number,
    isArray: true,
  })
  @IsOptional()
  selected?: number[];
}
