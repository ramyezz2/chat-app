import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { RedisSocketService } from './redis-socket.service';
import { wsAuthMiddleware } from 'src/shared/middleware/ws-auth.middleware';
import { AppGuard } from 'src/shared/guards/app.guard';

@WebSocketGateway({ cors: true })
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  // Inject the RedisService
  constructor(
    private redisSocketService: RedisSocketService,
    // private readonly wsAuthMiddlewareService: wsAuthMiddleware, // Inject the middleware
  ) {
    this.redisSocketService.subscribe('chat', (message) => {
      this.server.emit('message', message);
    });

    this.redisSocketService.subscribe('public', (message) => {
      this.server.emit('publicMessage', message);
    });
  }

  afterInit(server: Server) {
    console.log('WebSocket server initialized');

    // Use the middleware
    // server.use((socket, next) => this.wsAuthMiddlewareService.use(socket, next));

    this.redisSocketService.subscribe('public', (message) => {
      this.server.emit('publicMessage', message);
    });
  }

  async handleConnection(socket: Socket) {
    this.logger.verbose('New client connected', socket.id);
    socket.broadcast.emit(`user-joined`, {
      message: `New user joined the chat: ${socket.id}`,
      id: socket.id,
    });
    const userId = socket.handshake.auth?.user?.id;

    if (userId) {
      // Update the user's status to "online"
      await this.redisSocketService.setUserStatus({
        userId,
        status: 'ONLINE',
        socketId: socket.id,
      });
      try {
        // Subscribe to the private channel for this user
        this.redisSocketService.subscribe(`private-${userId}`, (message) => {
          socket.emit('privateMessage', message);
        });
      } catch (error) {
        socket.disconnect();
      }
    }
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.verbose('Client disconnected', socket.id);

    const userId = socket.handshake.auth?.user?.id;
    // Update the user's status to "offline" or we can delete the user from the cache
    if (userId)
      await this.redisSocketService.setUserStatus({
        userId,
        status: 'OFFLINE',
      });

    this.server.emit(`user-left`, {
      message: `User left the chat: ${socket.id}`,
      id: socket.id,
    });
  }

  
  @UseGuards(AppGuard)
  @SubscribeMessage('sendPublicMessage')
  handlePublicMessage(@MessageBody() message: string): void {
    this.redisSocketService.publish('public', message);
  }

  @UseGuards(AppGuard)
  @SubscribeMessage('sendPrivateMessage')
  handlePrivateMessage(
    @MessageBody() { to, message }: { to: string; message: string },
    @ConnectedSocket() socket: Socket,
  ): void {
    const privateChannel = `private-${to}`;
    this.redisSocketService.publish(privateChannel, message);
    socket.to(privateChannel).emit(privateChannel, message);
  }

  @UseGuards(AppGuard)
  @SubscribeMessage('sendRoomMessage')
  handleRoomMessage(
    @MessageBody() { roomId, message }: { roomId: number; message: string },
    @ConnectedSocket() socket: Socket,
  ): void {
    const roomChannel = `room-${roomId}`;
    this.redisSocketService.publish(roomChannel, JSON.stringify(message)); // Publish to Redis channel
  }

  @SubscribeMessage('newMessage')
  async handleNewMessage(
    @MessageBody()
    message: {
      channel: string;
      content: any;
      senderId: string;
      memberId: string;
    },    @ConnectedSocket() socket: Socket,

  ) {
    // Publish the message to the Redis channel
    this.redisSocketService.publish('chat', JSON.stringify(message));
    this.server.emit('newMessage', message);
  }
}
