import { ApiProperty } from '@nestjs/swagger';

export class UserResponse {
  @ApiProperty({ type: String, description: 'user id' })
  id: string;

  @ApiProperty({ type: String, description: 'user first name' })
  firstName: string;

  @ApiProperty({ type: String, description: 'user last name' })
  lastName: string;

  @ApiProperty({ type: String, description: 'user email' })
  email: string;

  @ApiProperty({ type: String, description: 'user access token' })
  accessToken: string;

  @ApiProperty({ type: String, description: 'user refresh token' })
  refreshToken: string;

  @ApiProperty({ type: String, description: 'user phone number' })
  phone?: string;
}
