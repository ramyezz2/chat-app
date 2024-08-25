// redis-socket.service.ts

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Redis } from 'ioredis';
import { Socket } from 'socket.io';
import environment from 'src/config/environment';

@Injectable()
export class RedisSocketService {
  private readonly publisher: Redis;
  private readonly subscriber: Redis;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    // Connect to Redis with the configuration options
    const host = environment.redisHost;
    const port = parseInt(environment.redisPort);
    const username = environment.redisUserName;
    const password = environment.redisPassword;
    this.publisher = new Redis({
      host,
      port,
      username,
      password,
    });
    this.subscriber = new Redis({
      host,
      port,
      username,
      password,
    });

    this.subscriber.on('message', (channel, message) => {
      // Handle incoming messages from Redis
      // Broadcast the message to connected sockets in the room
      // You can also add more logic here
    });

    this.subscriber.subscribe('messages');
  }

  publishMessage(message: any) {
    this.publisher.publish('messages', JSON.stringify(message));
  }

  addSocketToRoom(socket: Socket, roomId: string) {
    socket.join(roomId);
  }

  removeSocketFromRoom(socket: Socket, roomId: string) {
    socket.leave(roomId);
  }

  async setUserStatus({
    userId,
    status,
  }: {
    userId: string;
    status: 'ONLINE' | 'OFFLINE';
  }) {
    const cashedUser = await this.cacheManager.get(userId);
    if (cashedUser) {
      cashedUser['status'] = status;
      this.cacheManager.set(userId, cashedUser);
    } else {
      this.cacheManager.set(userId, { status });
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return (await this.cacheManager.get(userId))?.['status'] === 'ONLINE'
      ? true
      : false;
  }

  addUserToRoom({ userId, roomId }: { userId: string; roomId: string }) {
    this.publisher.sadd(`room:${roomId}:users`, userId);
  }

  removeUserFromRoom({ userId, roomId }: { userId: string; roomId: string }) {
    this.publisher.srem(`room:${roomId}:users`, userId);
  }

  publishMessageToRoom({ roomId, message }: { roomId: string; message: any }) {
    const messageData = JSON.stringify(message);
    this.publisher.smembers(`room:${roomId}:users`, (err, members) => {
      if (err) {
        console.error('Error retrieving room members:', err);
        return;
      }

      members.forEach((member) => {
        this.publisher.publish(`user:${member}:messages`, messageData);
      });
    });
  }

  async publishMessageToMember({
    memberId,
    message,
  }: {
    memberId: string;
    message: any;
  }) {
    if (await this.isUserOnline(memberId)) {
      this.publisher.publish(`user:${memberId}:messages`, message);
    }
  }
}
