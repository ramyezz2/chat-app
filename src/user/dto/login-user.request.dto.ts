import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginUserRequest {
  @ApiProperty({
    type: String,
    description: 'user email',
    example: 'admin@app.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    description: 'user password',
    example: '123456',
  })
  @IsNotEmpty()
  @MinLength(6)
  readonly password: string;
}
