import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { Server, Socket } from 'socket.io';
import { wsAuthMiddleware } from 'src/shared/middleware/ws-auth.middleware';
import { RedisPubSubService } from './redis-pubsub.service';

@WebSocketGateway(3002,{ namespace: '/chats', cors: true })
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  // Inject the RedisService
  constructor(
    private redisPubSubService: RedisPubSubService,
    private readonly chatsService: ChatsService,
  ) {
    this.redisPubSubService.subscribe('chat', (message) => {
      this.server.emit('message', message);
    });
  }

  handleConnection(client: Socket) {
    console.log('New client connected', client.id);

    //The event data will only be broadcast to every socket but the sender.
    //instead of this.server.emit we use client.broadcast.emit because we don't need to show the same user that he join the chat again
    //so broadcast the message to all clients except the user who just joined
    client.broadcast.emit(`user-joined`, {
      message: `New user joined the chat: ${client.id}`,
      id: client.id,
    });
  }

  /**
   * This method is called when a client disconnects from the WebSocket server.
   * It logs the client's disconnection, and emits a `user-left` event to all connected clients,
   * including the client's ID in the event payload.
   */
  handleDisconnect(client: Socket) {
    console.log('Client disconnected', client.id);
    this.server.emit(`user-left`, {
      message: `User left the chat: ${client.id}`,
      id: client.id,
    });
  }

  @SubscribeMessage('newMessage')
  async create(
    @ConnectedSocket() client,
    @MessageBody() createChatDto: CreateChatDto,
  ) {
    const senderId = client.handshake.user._id.toString();
    const chat = await this.chatsService.create(senderId, createChatDto);

    //Shift this to the redis service
    // this.server.emit('message', message);

    // Publish the message to the Redis channel
    this.redisPubSubService.publish('chat', JSON.stringify(createChatDto));
  }

  afterInit(client: Socket) {
    client.use((socket, next) => wsAuthMiddleware(socket, next));
  }
}
