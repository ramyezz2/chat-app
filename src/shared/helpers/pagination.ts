import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsOptional, Length, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderEnum } from '../enums';
import { Model, Document } from 'mongoose';

const defaultLimit = 10;

export interface IPagination<T> {
  // data: Record<string, any>[];
  data: any[];
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  selfLink: string;
  nextLink: string;
  prevLink: string;
}

export async function pagination<T extends Document>({
  model,
  page,
  limit,
  sort,
  query,
  appUrl,
  populate,
}: {
  model: Model<T>;
  page: number;
  limit: number;
  sort;
  query: any;
  appUrl: string;
  populate?: string[];
}): Promise<IPagination<T>> {
  page = page ? parseInt(page.toString()) : 1;
  limit = limit ? parseInt(limit.toString()) : defaultLimit;
  page = page <= 0 ? 1 : page;
  limit = limit <= 0 ? 1 : limit;
  sort = sort && Object.keys(sort).length > 0 ? sort : { createdAt: 1 };

  const data = await model
    .find(query)
    .populate(populate)
    .skip(limit * (page - 1))
    .limit(limit)
    .sort(sort);

  const docsCount = await model.find(query).countDocuments();
  const pagesCount = docsCount / limit;
  const totalPages = Math.round(pagesCount + 0.4);
  return {
    data,
    itemsPerPage: data.length,
    totalItems: docsCount,
    currentPage: page,
    totalPages,
    prevLink: `${appUrl}?page=${page > 1 ? page - 1 : 1}&limit=${limit}`,
    selfLink: `${appUrl}?page=${page}&limit=${limit}`,
    nextLink: `${appUrl}?page=${
      page >= totalPages ? totalPages : page + 1
    }&limit=${limit}`,
  };
}

export abstract class PaginationAdapter {
  @ApiProperty({ description: 'number of item in page' })
  itemsPerPage: number;
  @ApiProperty({ description: 'total of item in all page' })
  totalItems: number;
  @ApiProperty({ description: 'current page' })
  currentPage: number;
  @ApiProperty({ description: 'total page count' })
  totalPages: number;

  @ApiProperty({ description: 'selfLink' })
  selfLink: string;
  @ApiProperty({ description: 'nextLink' })
  nextLink: string;
  @ApiProperty({ description: 'prevLink' })
  prevLink: string;
}

export class OrderFilterDto {
  @ApiProperty({
    type: String,
    required: false,
    description: 'column name of Entity',
  })
  sort?: string;

  @ApiProperty({
    enum: OrderEnum,
    required: false,
    description: 'type of sorting ASC | DESC',
    default: OrderEnum.ASC,
  })
  @IsEnum(OrderEnum)
  @IsOptional()
  sortType?: OrderEnum;
}
export class PaginationDto extends OrderFilterDto {
  @ApiProperty({
    type: Number,
    required: false,
    description: 'number of page',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({
    type: Number,
    required: false,
    description: 'number of item in each page ',
    default: defaultLimit,
    example: defaultLimit,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;
}

export class SimpleListPaginationDto {
  @ApiProperty({
    type: Number,
    required: false,
    description: 'number of page',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({
    type: Number,
    required: false,
    description: 'number of item in each page ',
    default: defaultLimit,
    example: defaultLimit,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;

  @ApiProperty({
    type: String,
    required: false,
    description: 'search by name (optional)',
  })
  @IsOptional()
  @Length(3, 50)
  search?: string;
}
