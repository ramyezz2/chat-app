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
import { CurrentUser } from 'src/shared/decorators/user.decorator';
import { wsAuthMiddleware } from 'src/shared/middleware/ws-auth.middleware';
import { UserDocument } from 'src/user/user.schema';
import { RedisSocketService } from './redis-socket.service';

@WebSocketGateway({ namespace: '/chats', cors: true })
@UseGuards(wsAuthMiddleware)
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  // Inject the RedisService
  constructor(private redisSocketService: RedisSocketService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

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

    this.server.emit(`user-left`, {
      message: `User left the chat: ${client.id}`,
      id: client.id,
    });
  }
}
