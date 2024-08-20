import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomDocument, RoomSchema } from './room.schema';
import { UserDocument, UserSchema } from '../user/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoomDocument.name, schema: RoomSchema },
      { name: UserDocument.name, schema: UserSchema },
    ]),
  ],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}
