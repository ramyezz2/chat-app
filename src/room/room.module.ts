import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserDocument, UserSchema } from '../user/user.schema';
import { RoomController } from './room.controller';
import { RoomDocument, RoomSchema } from './room.schema';
import { RoomService } from './room.service';
import { RedisSocketService } from 'src/chat/redis-socket.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoomDocument.name, schema: RoomSchema },
      { name: UserDocument.name, schema: UserSchema },
    ]),
  ],
  controllers: [RoomController],
  providers: [RoomService, RedisSocketService],
  exports: [RoomService],
})
export class RoomModule {}
