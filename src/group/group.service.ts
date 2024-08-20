import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isEmpty } from 'class-validator';
import { Model, Types } from 'mongoose';
import { GroupRoleEnum } from 'src/shared/enums';
import { pagination, PaginationDto } from '../shared/helpers/pagination';
import { PaginationSimpleList } from '../shared/types/simple-list-pagination.dto';
import { UserDocument } from '../user/user.schema';
import {
  CreateGroupRequest,
  GroupResponse,
  GroupsPagination,
  UpdateGroupRequest,
} from './dto';
import { GroupDocument } from './group.schema';
import { buildGroupResponse, buildGroupSimpleListResponse } from './utils';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(GroupDocument.name)
    private readonly groupRepository: Model<GroupDocument>,
    @InjectModel(UserDocument.name)
    private readonly userRepository: Model<UserDocument>,
  ) {}

  async getGroupsWithPagination({
    request,
    paginationDto,
    options,
  }: {
    request;
    paginationDto: PaginationDto;
    options?: { where?: {}; order?: {} };
  }): Promise<GroupsPagination> {
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
      model: this.groupRepository,
      page,
      limit,
      sort: options?.order,
      query: options?.where,
      appUrl: appUrl,
      populate: ['createdBy', 'members.member'],
    });

    paginatedData.data = paginatedData.data.map((group) => {
      return buildGroupResponse({ group });
    });
    return paginatedData;
  }

  async getGroups(): Promise<GroupResponse[]> {
    const groups = await this.groupRepository.find({}).populate(['createdBy']);

    const GroupResponse = groups.map((group) => {
      return buildGroupResponse({ group });
    });
    return GroupResponse;
  }

  async getGroupsSimpleList({
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
      model: this.groupRepository,
      page,
      limit,
      sort: options?.order,
      query: options?.where,
      appUrl: appUrl,
    });

    paginatedData.data = paginatedData.data.map((group) => {
      return buildGroupSimpleListResponse({ group });
    });
    return paginatedData;
  }

  async getGroup({ id }: { id: string }): Promise<GroupResponse> {
    const group = await this.groupRepository
      .findOne({
        _id: id,
      })
      .populate(['createdBy', 'members.member']);
    if (!group) {
      return null;
    }
    return buildGroupResponse({ group });
  }

  async checkUniquenessForName(
    {
      name,
    }: {
      name?: string;
    },
    groupId = null,
  ): Promise<boolean> {
    const nameCondition = groupId
      ? {
          _id: { $nin: [groupId] },
          name,
        }
      : { name };
    const nameCount = name
      ? await this.groupRepository.countDocuments(nameCondition)
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
    dto: CreateGroupRequest;
  }): Promise<GroupResponse> {
    const createdBy = currentUser;

    const membersArray = [
      {
        member: currentUser._id,
        role: GroupRoleEnum.ADMIN,
      },
    ];
    members?.forEach((member) => {
      if (member !== createdBy._id?.toString()) {
        membersArray.push({
          member: new Types.ObjectId(member),
          role: GroupRoleEnum.MEMBER,
        });
      }
    });
    const group = await new this.groupRepository({
      name,
      type,
      description,
      members: membersArray,
      createdBy,
    }).save();

    return this.getGroup({ id: group._id.toString() });
  }

  async update({
    id,
    dto,
    currentUser,
  }: {
    id: string;
    dto: UpdateGroupRequest;
    currentUser: UserDocument;
  }): Promise<GroupResponse> {
    const group = await this.groupRepository.findOne({
      _id: id,
    });
    // Add UpdatedById
    group.updatedBy = new Types.ObjectId(currentUser.id);

    if (dto.name) {
      group.name = dto.name;
    }
    if (dto.description) {
      group.description = dto.description;
    }
    if (!isEmpty(dto.members)) {
      const membersArray = [
        {
          member: new Types.ObjectId(currentUser.id),
          role: GroupRoleEnum.ADMIN,
        },
      ];
      dto.members?.forEach((member) => {
        if (member !== group.createdBy?.toString()) {
          membersArray.push({
            member: new Types.ObjectId(member),
            role: GroupRoleEnum.MEMBER,
          });
        }
      });

      group.members = membersArray;
    }

    await group.save();

    return this.getGroup({ id: group._id.toString() });
  }

  async deleteOne({ _id }: { _id: string }): Promise<GroupDocument> {
    return this.groupRepository.findOneAndDelete({
      _id,
    });
  }
}
