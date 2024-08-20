import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreateUserRequest } from "./create-user.request.dto";
import { IsOptional } from "class-validator";


export class UpdateUserRequest extends PartialType(CreateUserRequest) {
  @ApiProperty({
    type: String,
    required: false,
    description: 'User telephone number',
  })
  @IsOptional()
  // TODO: add this validation @IsPhoneNumber() later on based on region
  phone?: string;
}
