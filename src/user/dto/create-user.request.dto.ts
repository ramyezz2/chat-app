import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { GenderEnum } from 'src/shared/enums';

export class CreateUserRequest {
  @ApiProperty({
    type: String,
    description: 'user first name',
    example: 'admin',
  })
  @IsNotEmpty()
  readonly firstName: string;

  @ApiProperty({ type: String, description: 'user last name', example: 'Ezz' })
  @IsNotEmpty()
  readonly lastName: string;

  @ApiProperty({
    type: String,
    description: 'user email',
    example: 'admin@app.com',
  })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({
    type: String,
    description: 'user password',
    example: '123456',
  })
  @IsNotEmpty()
  @MinLength(6)
  readonly password: string;

  @ApiProperty({
    type: String,
    enum: GenderEnum,
    required: false,
    description: 'Member gender MALE | FEMALE',
  })
  @IsOptional()
  @IsEnum([GenderEnum.MALE, GenderEnum.FEMALE])
  gender: GenderEnum;
}
