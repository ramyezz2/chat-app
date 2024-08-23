import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserDocument, UserSchema } from '../user/user.schema';
import { MessageController } from './message.controller';
import { MessageDocument, MessageSchema } from './message.schema';
import { MessageService } from './message.service';
import { RoomDocument, RoomSchema } from 'src/room/room.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MessageDocument.name, schema: MessageSchema },
      { name: UserDocument.name, schema: UserSchema },
      { name: RoomDocument.name, schema: RoomSchema },
    ]),
  ],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
