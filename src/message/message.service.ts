import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isEmpty } from 'class-validator';
import { Model, Types } from 'mongoose';
import { RoomDocument } from 'src/room/room.schema';
import { pagination, PaginationDto } from '../shared/helpers/pagination';
import { UserDocument } from '../user/user.schema';
import {
  CreateDirectMessageRequest,
  CreateRoomMessageRequest,
  MessageResponse,
  MessagesPagination,
  UpdateMessageRequest,
} from './dto';
import { MessageDocument } from './message.schema';
import { buildMessageResponse } from './utils';
import { MessageTypeEnum } from 'src/shared/enums';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(MessageDocument.name)
    private readonly messageRepository: Model<MessageDocument>,
    @InjectModel(UserDocument.name)
    private readonly userRepository: Model<UserDocument>,
    @InjectModel(RoomDocument.name)
    private readonly roomRepository: Model<RoomDocument>,
  ) {}

  async getMessagesWithPagination({
    request,
    paginationDto,
    options,
  }: {
    request;
    paginationDto: PaginationDto;
    options?: { where?: {}; order?: {} };
  }): Promise<MessagesPagination> {
    const { page, limit } = paginationDto;
    const appUrl = `${request.protocol}://${request.get('host')}${
      request?._parsedUrl?.pathname
    }`;

    const sort = options?.order || {};
    for (const val in sort) {
      if (sort[val] !== 1) sort[val] = sort[val] === 'ASC' ? 1 : -1;
    }
    if (isEmpty(sort)) sort['createdAt'] = -1;

    const paginatedData = await pagination({
      model: this.messageRepository,
      page,
      limit,
      sort: options?.order,
      query: options?.where,
      appUrl: appUrl,
      populate: ['createdBy', 'members.member'],
    });

    paginatedData.data = paginatedData.data.map((message) => {
      return buildMessageResponse({ message });
    });
    return paginatedData;
  }

  async getMessage({ id }: { id: string }): Promise<MessageResponse> {
    const message = await this.messageRepository
      .findOne({
        _id: id,
      })
      .populate(['createdBy', 'members.member']);
    if (!message) {
      return null;
    }
    return buildMessageResponse({ message });
  }

  async checkMemberExist({ memberId }: { memberId: string }): Promise<boolean> {
    const condition = {
      _id: new Types.ObjectId(memberId),
    };
    const membersCount = await this.userRepository.countDocuments(condition);
    return membersCount > 0 ? true : false;
  }

  async isMemberInTheRoom({
    currentUser,
    roomId,
  }: {
    currentUser: UserDocument;
    roomId: string;
  }): Promise<boolean> {
    const memberCount = await this.roomRepository.countDocuments({
      _id: new Types.ObjectId(roomId),
      'members.member': currentUser._id,
    });
    return memberCount > 0 ? true : false;
  }

  async checkRoomExist({ roomId }: { roomId: string }): Promise<boolean> {
    const roomCount = await this.roomRepository.countDocuments({
      _id: new Types.ObjectId(roomId),
    });
    return roomCount > 0 ? true : false;
  }

  async createDirectMessage({
    currentUser,
    dto: { content, receiverId },
  }: {
    currentUser: UserDocument;
    dto: CreateDirectMessageRequest;
  }): Promise<MessageResponse> {
    const message = await new this.messageRepository({
      type: MessageTypeEnum.DIRECT,
      content,
      sender: currentUser._id,
      receiver: new Types.ObjectId(receiverId),
    }).save();

    return this.getMessage({ id: message._id.toString() });
  }

  async createRoomMessage({
    currentUser,
    dto: { content, roomId },
  }: {
    currentUser: UserDocument;
    dto: CreateRoomMessageRequest;
  }): Promise<MessageResponse> {
    const message = await new this.messageRepository({
      type: MessageTypeEnum.ROOM,
      content,
      sender: currentUser._id,
      room: new Types.ObjectId(roomId),
    }).save();

    return this.getMessage({ id: message._id.toString() });
  }

  async update({
    id,
    dto,
  }: {
    id: string;
    dto: UpdateMessageRequest;
  }): Promise<MessageResponse> {
    const message = await this.messageRepository.findOne({
      _id: id,
    });
    if (dto.content) {
      message.content = dto.content;
    }
    message.editHistory.push({
      content: dto.content,
      createdAt: new Date(),
    });

    await message.save();

    return this.getMessage({ id: message._id.toString() });
  }

  async deleteOne({ _id }: { _id: string }): Promise<MessageDocument> {
    return await this.messageRepository.findOneAndDelete({
      _id,
    });
  }
}
