import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class RefreshTokenRequest {
  @ApiProperty({ type: String, description: 'user refresh token' })
  @IsNotEmpty()
  readonly refreshToken: string;
}
