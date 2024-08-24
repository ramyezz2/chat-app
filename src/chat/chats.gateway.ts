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
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io';
import { RedisPubSubService } from './redis-pubsub.service';
import { CurrentUser } from 'src/shared/decorators/user.decorator';
import { UserDocument } from 'src/user/user.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@WebSocketGateway({ namespace: '/chats', cors: true })
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  // Inject the RedisService
  constructor(
    private redisPubSubService: RedisPubSubService,
    private readonly chatsService: ChatsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.redisPubSubService.subscribe('chat', (message) => {
      this.server.emit('message', message);
    });
  }

  async handleConnection(client: Socket) {
    console.log('New client connected', client.id);

    //set the user online status to true in redis

    const userId = client.handshake.auth.user.id;

    //set the user online status to true in redis
    const cashedUser = await this.cacheManager.get<{ user: UserDocument }>(
      userId,
    ); // ? Retrieve data from the cache

    this.cacheManager.set(userId, {
      ...cashedUser,
      status: 'ONLINE',
    });

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
  async handleDisconnect(client: Socket) {
    console.log('Client disconnected', client.id);

    const userId = client.handshake.auth.user.id;

    //set the user online status to true in redis
    const cashedUser = await this.cacheManager.get<{ user: UserDocument }>(
      userId,
    ); // ? Retrieve data from the cache

    this.cacheManager.set(userId, {
      ...cashedUser,
      status: 'OFFLINE',
    });

    this.server.emit(`user-left`, {
      message: `User left the chat: ${client.id}`,
      id: client.id,
    });
  }

  @SubscribeMessage('newMessage')
  async create(
    @ConnectedSocket() client,
    @MessageBody() createMessageDto: CreateMessageDto,
    @CurrentUser() user: UserDocument,
  ) {
    const senderId = client.handshake.user._id.toString();
    const chat = await this.chatsService.create(senderId, createMessageDto);

    //Shift this to the redis service
    // this.server.emit('message', message);

    // Publish the message to the Redis channel
    this.redisPubSubService.publish('chat', JSON.stringify(createMessageDto));
  }

  afterInit(client: Socket) {}
}
