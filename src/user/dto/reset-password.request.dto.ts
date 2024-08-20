import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export class ResetPasswordRequest {
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
    description: 'user reset token',
    example: 'token',
  })
  @IsNotEmpty()
  readonly resetToken: string;

  @ApiProperty({
    type: String,
    description: 'user password',
    example: '123456',
  })
  @IsNotEmpty()
  @MinLength(6)
  readonly newPassword: string;
}
