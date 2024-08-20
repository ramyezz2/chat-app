import { ApiProperty } from '@nestjs/swagger';

export class MemberResponse {
  @ApiProperty({ type: Number, description: 'user id' })
  id: number;

  @ApiProperty({ type: String, description: 'user first name' })
  firstName: string;

  @ApiProperty({ type: String, description: 'user last name' })
  lastName: string;

  @ApiProperty({ type: String, description: 'user email' })
  email: string;

  @ApiProperty({ type: String, description: 'user phone number' })
  phone?: string;
}
