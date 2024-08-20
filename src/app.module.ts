import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AppGuard } from './shared/guards/app.guard';
import { MongooseModule } from '@nestjs/mongoose';
import environment from './config/environment';
import { UserModule } from './user/user.module';
import { RoomModule } from './room/room.module';

@Module({
  imports: [
    MongooseModule.forRoot(environment.databaseUrl),
    UserModule,
    RoomModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: AppGuard,
    },
  ],
})
export class AppModule {}
