// import { Injectable } from '@nestjs/common';
// import { Message } from './messages.schema';
// import { Channel, connect, Connection } from 'amqplib';

// @Injectable()
// export class RabbitMQService {
//   private connection: Connection;
//   private channel: Channel;

//   async onModuleInit() {
//     this.connection = await connect('amqp://guest:guest@rabbitmq');
//     this.channel = await this.connection.createChannel();
//     await this.channel.assertQueue('message_queue');
//   }

//   async publishMessage(message: Message) {
//     await this.channel.sendToQueue(
//       'message_queue',
//       Buffer.from(JSON.stringify(message)),
//     );
//   }

//   async consumeMessages() {
//     await this.channel.consume('message_queue', (msg) => {
//       if (msg !== null) {
//         const message: Message = JSON.parse(msg.content.toString());
//         // Process the message
//         this.channel.ack(msg);
//       }
//     });
//   }
// }
