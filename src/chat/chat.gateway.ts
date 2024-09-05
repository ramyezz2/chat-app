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

@UseGuards(wsAuthMiddleware)
@WebSocketGateway({ cors: true })
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  // Inject the RedisService
  constructor(private redisSocketService: RedisSocketService) {
    this.redisSocketService.subscribe('chat', (message) => {
      this.server.emit('message', message);
    });
  }

  afterInit(server: Server) {
    console.log('WebSocket server initialized');
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
      await this.redisSocketService.setUserStatus({ userId, status: 'ONLINE', socketId: socket.id });
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

  @UseGuards(wsAuthMiddleware)
  @SubscribeMessage('sendPublicMessage')
  handlePublicMessage(@MessageBody() message: string): void {
    this.redisSocketService.publish('public', message);
  }

  @UseGuards(wsAuthMiddleware)
  @SubscribeMessage('sendPrivateMessage')
  handlePrivateMessage(
    @MessageBody() { to, message }: { to: string; message: string },
    @ConnectedSocket() socket: Socket,
  ): void {
    const privateChannel = `private-${to}`;
    this.redisSocketService.publish(privateChannel, message);
    socket.to(privateChannel).emit('privateMessage', message);
  }

  @UseGuards(wsAuthMiddleware)
  @SubscribeMessage('newMessage')
  async handleNewMessage(
    @MessageBody()
    message: {
      channel: string;
      content: any;
      senderId: string;
      memberId: string;
    },
  ) {
    // Publish the message to the Redis channel
    this.redisSocketService.publish('chat', JSON.stringify(message));
  }
}
