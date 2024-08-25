import { Module } from '@nestjs/common';
import { ChatsGateway } from './chats.gateway';
import { RedisSocketService } from './redis-socket.service';

@Module({
  imports: [],
  providers: [ChatsGateway, RedisSocketService],
  exports: [ChatsGateway, RedisSocketService],
})
export class ChatsModule {}
