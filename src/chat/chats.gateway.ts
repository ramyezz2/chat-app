import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { wsAuthMiddleware } from 'src/shared/middleware/ws-auth.middleware';
import { RedisSocketService } from './redis-socket.service';

@WebSocketGateway({ namespace: '/chats', cors: true })
@UseGuards(wsAuthMiddleware)
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  constructor(private redisSocketService: RedisSocketService) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`Client connected: ${client.id}`);
    const userId = client.handshake.auth.userId;
    // Update the user's status to "online"
    await this.redisSocketService.setUserStatus({ userId, status: 'ONLINE' });

    // Broadcast the "user-joined" event to all other clients
    client.broadcast.emit('user-joined', {
      message: `New user joined the chat: ${client.id}`,
      id: client.id,
    });
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log('Client disconnected', client.id);

    const userId = client.handshake.auth.userId;
    // Update the user's status to "offline"
    await this.redisSocketService.setUserStatus({ userId, status: 'OFFLINE' });

    // Emit the "user-left" event to all connected clients
    this.server.emit('user-left', {
      message: `User left the chat: ${client.id}`,
      id: client.id,
    });
  }
}
