import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetMessageDto } from './dto/get-message.dto';
import { MessageDocument } from 'src/message/message.schema';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(MessageDocument.name)
    private readonly messageRepository: Model<MessageDocument>,
  ) {}

  async create(senderId: string, createMessageDto: CreateMessageDto) {
    const createdMessage = new this.messageRepository({
      ...createMessageDto,
      sender_id: senderId,
    });
    return createdMessage.save();
  }

  async findAll(roomId: string, getMessageDto: GetMessageDto) {
    const query = {
      room_id: roomId,
    };

    if (getMessageDto.lastId) {
      query['_id'] = { $lt: getMessageDto.lastId };
    }

    return this.messageRepository
      .find(query)
      .sort({ createdAt: -1 })
      .limit(getMessageDto.limit);
  }
}
