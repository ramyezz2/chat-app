import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import environment from 'src/config/environment';
import { Cache } from 'cache-manager';
import { Socket } from 'socket.io';
@Injectable()
export class RedisSocketService {
  private readonly publisher: Redis;
  private readonly subscriber: Redis;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    // Get the Redis configuration options from the ConfigService
    const host = environment.redisHost;
    const port = parseInt(environment.redisPort);
    const username = environment.redisUserName;
    const password = environment.redisPassword;

    // Connect to Redis with the configuration options
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
  }

  publish(channel: string, message: any) {
    this.publisher.publish(channel, JSON.stringify(message));
  }

  subscribe(channel: string, callback: (message: string) => void): void {
    this.subscriber.subscribe(channel);
    this.subscriber.on('message', (receivedChannel, receivedMessage) => {
      if (receivedChannel === channel) {
        callback(receivedMessage);
      }
    });
  }

  unsubscribe(channel: string): void {
    this.subscriber.unsubscribe(channel);
  }

  addSocketToRoom(socket: Socket, roomId: string) {
    socket.join(roomId);
  }

  removeSocketFromRoom(socket: Socket, roomId: string) {
    socket.leave(roomId);
  }

  async setUserStatus({
    userId,
    socketId,
    status,
  }: {
    userId: string;
    status: 'ONLINE' | 'OFFLINE';
    socketId?: string;
  }) {
    const cashedUser = await this.cacheManager.get(userId);
    if (cashedUser) {
      cashedUser['status'] = status;
      this.cacheManager.set(userId, cashedUser);
    } else {
      this.cacheManager.set(userId, { status, socketId });
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
    receiverId,
    message,
  }: {
    receiverId: string;
    message: any;
  }) {
    const privateChannel = `private-${receiverId}`;

    // Publish the message to the receiver's private channel
    this.publisher.publish(privateChannel, JSON.stringify(message));
    return { status: 'Message sent', message };
  }
}
