import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class UpdateUserPasswordRequest {
  @ApiProperty({ type: String, description: 'User old password', example: '123456' })
  @IsNotEmpty()
  @MinLength(6)
  oldPassword?: string;

  @ApiProperty({ type: String, description: 'User new password', example: 'Pass123!@#' })
  @IsNotEmpty()
  newPassword?: string;
}
