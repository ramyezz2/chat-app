import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageDocument, MessageSchema } from 'src/message/message.schema';
import { ChatsGateway } from './chats.gateway';
import { ChatsService } from './chats.service';
import { RedisPubSubService } from './redis-pubsub.service';
import { wsAuthMiddleware } from 'src/shared/middleware/ws-auth.middleware';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MessageDocument.name, schema: MessageSchema },
    ]),
  ],
  providers: [ChatsGateway, RedisPubSubService, ChatsService],
  exports: [ChatsService],
})
export class ChatsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(wsAuthMiddleware)
      .forRoutes({ path: 'chats', method: RequestMethod.ALL });
  }
}
