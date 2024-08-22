import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import environment from 'src/config/environment';

@Injectable()
export class RedisPubSubService {
  private readonly publisher: Redis;
  private readonly subscriber: Redis;

  constructor() {
    // Connect to Redis with the configuration options
    this.publisher = new Redis({
      host: environment.redisHost,
      port: parseInt(environment.redisPort),
      username: environment.redisUserName,
      password: environment.redisPassword,
    });
    this.subscriber = new Redis({
      host: environment.redisHost,
      port: parseInt(environment.redisPort),
      username: environment.redisUserName,
      password: environment.redisPassword,
    });
  }

  publish(channel: string, message: string): void {
    this.publisher.publish(channel, message);
  }

  subscribe(channel: string, callback: (message: string) => void): void {
    this.subscriber.subscribe(channel);
    this.subscriber.on('message', (receivedChannel, receivedMessage) => {
      if (receivedChannel === channel) {
        callback(receivedMessage);
      }
    });
  }
}
