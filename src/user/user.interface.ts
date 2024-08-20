import { ApiProperty } from '@nestjs/swagger';
import { GenderEnum } from '../shared/enums';

export class UserData {
  @ApiProperty({ type: String, description: 'user id' })
  id: string;

  @ApiProperty({ type: String, description: 'user first name' })
  firstName: string;

  @ApiProperty({ type: String, description: 'user last name' })
  lastName: string;

  @ApiProperty({ type: String, description: 'userName' })
  userName: string;

  @ApiProperty({ enum: GenderEnum, description: 'user gender' })
  gender: GenderEnum;

  @ApiProperty({ type: String, description: 'user email' })
  email: string;

  @ApiProperty({ type: String, description: 'user access token' })
  accessToken: string;

  @ApiProperty({ type: String, description: 'user refresh token' })
  refreshToken: string;

  @ApiProperty({ type: String, description: 'user phone number' })
  phone?: string;

  @ApiProperty({ type: String, description: 'user whatsappNumber' })
  whatsappNumber?: string;
}
