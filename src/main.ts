import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import environment from './config/environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const options = new DocumentBuilder()
    .setTitle('Chat Application APIs')
    .setDescription('This is an Simple chat app using socket.io')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerCustomOptions = {
    swaggerOptions: {
      docExpansion: 'none',
      consumes: ['multipart/form-data'],
    },
  };

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/docs', app, document, swaggerCustomOptions);

  await app.listen(environment.port);

  // app.useGlobalPipes( new ValidationPipe());
  console.log(`Server is running on port ${environment.port}`);
}
bootstrap();
