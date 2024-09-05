import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { RedisSocketService } from './redis-socket.service';

@Module({
  imports: [],
  providers: [ChatGateway, RedisSocketService],
})
export class ChatModule {}
