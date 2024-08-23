import { IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  readonly roomId: string;

  @IsNotEmpty()
  readonly content: string;
}
