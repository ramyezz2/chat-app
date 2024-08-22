import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { isEmpty, isNil } from 'lodash';
import { Model, Types } from 'mongoose';
import environment from 'src/config/environment';
import { PaginationDto } from 'src/shared/helpers/pagination';
import { PaginationSimpleList } from 'src/shared/types/simple-list-pagination.dto';
import {
  CreateUserRequest,
  LoginUserRequest,
  UpdateUserRequest,
  UserResponse,
} from './dto';
import { MemberResponse } from './dto/member.response.dto';
import { UserDocument } from './user.schema';
import { buildMemberSimpleListResponse, buildUserResponse } from './utils';
import { buildMemberResponse } from './utils/build-user-responses.helper';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserDocument.name)
    private userRepository: Model<UserDocument>,
  ) {}

  async formatIUser(user: UserDocument): Promise<UserResponse> {
    // update loginAt
    await this.userRepository.updateOne(
      { _id: user._id },
      { loginAt: new Date() },
    );
    return buildUserResponse({
      document: user,
    });
  }

  async findByIdForGuard({ id }: { id: string }): Promise<UserDocument> {
    const user = await this.userRepository.findOne({
      _id: new Types.ObjectId(id),
    });
    if (!user) {
      return null;
    }

    return user;
  }

  async login({
    email,
    password,
  }: LoginUserRequest): Promise<UserResponse | null> {
    const condition = { email };
    const user = await this.userRepository.findOne(condition);
    if (!user) {
      return null;
    }

    if (await this.argonVerify(user.hash, password)) {
      return this.formatIUser(user);
    }

    return null;
  }
  async checkExistByEmail({
    email,
  }: {
    email: string;
  }): Promise<UserDocument | null> {
    return await this.userRepository.findOne({ email });
  }

  async checkExistByUserName({
    userName,
  }: {
    userName: string;
  }): Promise<UserDocument | null> {
    return await this.userRepository.findOne({ userName });
  }

  async checkPhoneExist({
    phone,
    id,
  }: {
    phone: string;
    id?: string;
  }): Promise<boolean> {
    const conditions = {
      phone,
    };
    if (id) {
      conditions['_id'] = { $ne: new Types.ObjectId(id) };
    }
    const phoneCount = await this.userRepository.countDocuments(conditions);
    return phoneCount > 0 ? true : false;
  }

  async create({ dto }: { dto: CreateUserRequest }): Promise<UserResponse> {
    const { firstName, lastName, email, password, gender } = dto;
    const savedUser = await new this.userRepository({
      firstName,
      lastName,
      gender,
      email,
      hash: password ? await argon2.hash(password) : null,
    }).save();

    return this.formatIUser(savedUser);
  }

  async update({
    userId,
    dto,
  }: {
    userId: string;
    dto: UpdateUserRequest;
  }): Promise<MemberResponse> {
    const toUpdate = await this.userRepository.findById(userId);

    if (dto.firstName) {
      toUpdate.firstName = dto.firstName;
    }

    if (dto.lastName) {
      toUpdate.lastName = dto.lastName;
    }

    if (dto.gender) {
      toUpdate.gender = dto.gender;
    }

    if (!isNil(dto.phone)) {
      toUpdate.phone = dto.phone;
    }

    await toUpdate.save();

    return this.findMemberById({ id: toUpdate.id });
  }

  async deleteById({ id }: { id: string }) {
    return this.userRepository.findOneAndDelete({
      _id: new Types.ObjectId(id),
    });
  }

  async findMemberById({ id }: { id?: string }): Promise<MemberResponse> {
    const user = await this.userRepository.findOne({
      _id: new Types.ObjectId(id),
    });
    if (!user) {
      const errors = ['Not found'];
      throw new HttpException({ errors }, 401);
    }
    return buildMemberResponse({ member: user });
  }

  async findByRefreshToken({
    token,
  }: {
    token?: string;
  }): Promise<UserResponse> {
    try {
      const decoded = jwt.verify(token, environment.secret) as UserResponse;
      if (decoded['type'] != 'REFRESH') {
        return null;
      }
      const user = await this.getUserById({ id: decoded.id });
      if (!user) {
        return null;
      }
      return this.formatIUser(user);
    } catch (error) {
      throw error;
    }
  }

  async argonVerify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch (error) {
      return false;
    }
  }

  async getUserById({ id }: { id: string }): Promise<UserDocument | null> {
    return this.userRepository.findOne({
      _id: new Types.ObjectId(id),
    });
  }

  async getUsersSimpleList(
    request,
    paginationDto: PaginationDto,
    options?,
  ): Promise<PaginationSimpleList> {
    let page = paginationDto.page ? parseInt(paginationDto.page.toString()) : 1;
    let limit = paginationDto.limit
      ? parseInt(paginationDto.limit.toString())
      : 10;
    page = page <= 0 ? 1 : page;
    limit = limit <= 0 ? 1 : limit;

    const appUrl = `${request.protocol}://${request.get('host')}${
      request?._parsedUrl?.pathname
    }`;
    const sort = options.order;
    for (const val in sort) {
      if (sort[val] !== 1) sort[val] = sort[val] === 'ASC' ? 1 : -1;
    }
    if (isEmpty(sort)) sort['createdAt'] = -1;

    const pipeline = [
      {
        $match: options?.where || {},
      },
      {
        $addFields: {
          name: {
            $concat: ['$firstName', ' ', { $ifNull: ['$lastName', ''] }],
          },
        },
      },
      {
        $match: options?.search || {},
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          name: 1,
          email: 1,
          loginAt: 1,
          logoutAt: 1,
          createdAt: 1,
        },
      },
    ];

    const [usersResponse, paginatedCount] = await Promise.all([
      this.userRepository.aggregate([
        ...pipeline,
        { $sort: sort },
        { $skip: limit * (page - 1) },
        { $limit: limit },
      ]),
      this.userRepository.aggregate([...pipeline, { $count: 'count' }]),
    ]);
    const docsCount = paginatedCount[0] ? paginatedCount[0].count : 0;
    const pagesCount = docsCount / limit;
    const totalPages = Math.round(pagesCount + 0.4);

    const paginatedData = {
      data: usersResponse?.map((item) => {
        return buildMemberSimpleListResponse(item);
      }),
      itemsPerPage: usersResponse.length,
      totalItems: docsCount,
      currentPage: page,
      totalPages,
      prevLink: `${appUrl}?page=${page > 1 ? page - 1 : 1}&limit=${limit}`,
      selfLink: `${appUrl}?page=${page}&limit=${limit}`,
      nextLink: `${appUrl}?page=${
        page >= totalPages ? totalPages : page + 1
      }&limit=${limit}`,
    };
    return paginatedData;
  }

  async logout({ currentUser }: { currentUser: UserDocument }) {
    // update lastDateUserLeaveApp
    await this.userRepository.updateOne(
      {
        _id: currentUser._id,
      },
      { logoutAt: new Date() },
    );
  }
}
