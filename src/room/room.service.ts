import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isEmpty } from 'class-validator';
import { Model, Types } from 'mongoose';
import { RoomRoleEnum } from 'src/shared/enums';
import { pagination, PaginationDto } from '../shared/helpers/pagination';
import { PaginationSimpleList } from '../shared/types/simple-list-pagination.dto';
import { UserDocument } from '../user/user.schema';
import {
  CreateRoomRequest,
  RoomResponse,
  RoomsPagination,
  UpdateRoomRequest,
} from './dto';
import { RoomDocument } from './room.schema';
import { buildRoomResponse, buildRoomSimpleListResponse } from './utils';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(RoomDocument.name)
    private readonly roomRepository: Model<RoomDocument>,
    @InjectModel(UserDocument.name)
    private readonly userRepository: Model<UserDocument>,
  ) {}

  async getRoomsWithPagination({
    request,
    paginationDto,
    options,
  }: {
    request;
    paginationDto: PaginationDto;
    options?: { where?: {}; order?: {} };
  }): Promise<RoomsPagination> {
    const { page, limit } = paginationDto;
    const appUrl = `${request.protocol}://${request.get('host')}${
      request?._parsedUrl?.pathname
    }`;

    const sort = options?.order;
    for (const val in sort) {
      if (sort[val] !== 1) sort[val] = sort[val] === 'ASC' ? 1 : -1;
    }
    if (isEmpty(sort)) sort['createdAt'] = -1;

    const paginatedData = await pagination({
      model: this.roomRepository,
      page,
      limit,
      sort: options?.order,
      query: options?.where,
      appUrl: appUrl,
      populate: ['createdBy', 'members.member'],
    });

    paginatedData.data = paginatedData.data.map((room) => {
      return buildRoomResponse({ room });
    });
    return paginatedData;
  }

  async getRooms(): Promise<RoomResponse[]> {
    const rooms = await this.roomRepository.find({}).populate(['createdBy']);

    const RoomResponse = rooms.map((room) => {
      return buildRoomResponse({ room });
    });
    return RoomResponse;
  }

  async getRoomsSimpleList({
    request,
    paginationDto,
    options,
  }: {
    request;
    paginationDto: PaginationDto;
    options?: { where?: {}; order?: {} };
  }): Promise<PaginationSimpleList> {
    const { page, limit } = paginationDto;
    const appUrl = `${request.protocol}://${request.get('host')}${
      request?._parsedUrl?.pathname
    }`;

    const sort = options?.order;
    for (const val in sort) {
      if (sort[val] !== 1) sort[val] = sort[val] === 'ASC' ? 1 : -1;
    }
    if (isEmpty(sort)) sort['createdAt'] = -1;

    const paginatedData = await pagination({
      model: this.roomRepository,
      page,
      limit,
      sort: options?.order,
      query: options?.where,
      appUrl: appUrl,
    });

    paginatedData.data = paginatedData.data.map((room) => {
      return buildRoomSimpleListResponse({ room });
    });
    return paginatedData;
  }

  async getRoom({ id }: { id: string }): Promise<RoomResponse> {
    const room = await this.roomRepository
      .findOne({
        _id: id,
      })
      .populate(['createdBy', 'members.member']);
    if (!room) {
      return null;
    }
    return buildRoomResponse({ room });
  }

  async checkUniquenessForName(
    {
      name,
    }: {
      name?: string;
    },
    roomId = null,
  ): Promise<boolean> {
    const nameCondition = roomId
      ? {
          _id: { $nin: [roomId] },
          name,
        }
      : { name };
    const nameCount = name
      ? await this.roomRepository.countDocuments(nameCondition)
      : 0;
    const isNameExist = nameCount > 0 ? true : false;

    return isNameExist;
  }

  async checkMembersExist({
    membersIds,
  }: {
    membersIds: string[];
  }): Promise<boolean> {
    const condition = {
      _id: { $in: membersIds.map((id) => new Types.ObjectId(id)) },
    };
    const membersCount = await this.userRepository.countDocuments(condition);
    return membersCount > 0 && membersCount == membersIds.length ? true : false;
  }

  async create({
    currentUser,
    dto: { name, type, description, members },
  }: {
    currentUser: UserDocument;
    dto: CreateRoomRequest;
  }): Promise<RoomResponse> {
    const createdBy = currentUser;

    const membersArray = [
      {
        member: currentUser._id,
        role: RoomRoleEnum.ADMIN,
      },
    ];
    members?.forEach((member) => {
      if (member !== createdBy._id?.toString()) {
        membersArray.push({
          member: new Types.ObjectId(member),
          role: RoomRoleEnum.MEMBER,
        });
      }
    });
    const room = await new this.roomRepository({
      name,
      type,
      description,
      members: membersArray,
      createdBy,
    }).save();

    return this.getRoom({ id: room._id.toString() });
  }

  async update({
    id,
    dto,
    currentUser,
  }: {
    id: string;
    dto: UpdateRoomRequest;
    currentUser: UserDocument;
  }): Promise<RoomResponse> {
    const room = await this.roomRepository.findOne({
      _id: id,
    });
    // Add UpdatedById
    room.updatedBy = new Types.ObjectId(currentUser.id);

    if (dto.name) {
      room.name = dto.name;
    }
    if (dto.description) {
      room.description = dto.description;
    }
    if (!isEmpty(dto.members)) {
      const membersArray = [
        {
          member: new Types.ObjectId(currentUser.id),
          role: RoomRoleEnum.ADMIN,
        },
      ];
      dto.members?.forEach((member) => {
        if (member !== room.createdBy?.toString()) {
          membersArray.push({
            member: new Types.ObjectId(member),
            role: RoomRoleEnum.MEMBER,
          });
        }
      });

      room.members = membersArray;
    }

    await room.save();

    return this.getRoom({ id: room._id.toString() });
  }

  async deleteOne({ _id }: { _id: string }): Promise<RoomDocument> {
    return this.roomRepository.findOneAndDelete({
      _id,
    });
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

  async joinRoom({
    currentUser,
    roomId,
  }: {
    currentUser: UserDocument;
    roomId: string;
  }) {
    await this.roomRepository.updateOne(
      { _id: new Types.ObjectId(roomId) },
      {
        $push: {
          members: { member: currentUser._id, role: RoomRoleEnum.MEMBER },
        },
      },
    );
  }

  async leaveRoom({
    currentUser,
    roomId,
  }: {
    currentUser: UserDocument;
    roomId: string;
  }) {
    await this.roomRepository.updateOne(
      { _id: new Types.ObjectId(roomId) },
      {
        $pull: {
          members: { member: currentUser._id, role: RoomRoleEnum.MEMBER },
        },
      },
    );
  }
}
