import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AppGuard } from './shared/guards/app.guard';
import { MongooseModule } from '@nestjs/mongoose';
import environment from './config/environment';
import { UserModule } from './user/user.module';
import { RoomModule } from './room/room.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { RedisOptions } from './config/redis-cashing-options';
import { ChatModule } from './chat/chat.module';
import { MessageModule } from './message/message.module';
import { AllExceptionsFilter } from './shared/exceptions/all-exception-filter.exception';

@Module({
  imports: [
    MongooseModule.forRoot(environment.databaseUrl),
    CacheModule.registerAsync(RedisOptions),
    ClientsModule.register([
      {
        name: 'CHAT_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: environment.redisHost,
          port: parseInt(environment.redisPort),
        },
      },
    ]),
    UserModule,
    RoomModule,
    MessageModule,
    ChatModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: AppGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
