import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { isEmpty, isNil } from 'lodash';
import { Model, Types } from 'mongoose';
import environment from 'src/config/environment';
import { PaginationDto } from 'src/shared/helpers/pagination';
import { UserDocument } from './schemas/user.schema';
import {
  CreateUserRequest,
  LoginUserRequest,
  UpdateUserPasswordRequest,
  UpdateUserRequest,
  UserResponse,
} from './dto';
import { buildMemberSL, buildUserRO } from './utils';
import { PaginationSimpleList } from 'src/shared/types/simple-list-pagination.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserDocument.name)
    private userRepository: Model<UserDocument>,
  ) {}

  async formatIUser(user: UserDocument): Promise<UserResponse> {
    return buildUserRO({
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

  async findOne({
    dto: { email, password },
  }: {
    dto: LoginUserRequest;
  }): Promise<UserResponse | null> {
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
    const code = crypto.randomBytes(2).toString('hex');

    const savedUser = await new this.userRepository({
      firstName,
      lastName,
      gender,
      email,
      hash: password ? await argon2.hash(password) : null,
    }).save();

    return this.findById({ id: savedUser.id });
  }

  async update({
    userId,
    dto,
  }: {
    userId: string;
    dto: UpdateUserRequest;
  }): Promise<UserResponse> {
    const toUpdate = await this.userRepository.findById(userId);

    const childrenDto = {};

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

    const updatesUser = await this.userRepository.findById(userId);
    // if user update timezone || country|| language => update children data of this parent
    if (Object.keys(childrenDto).length > 0) {
      await this.userRepository.updateOne(
        {
          parent: new Types.ObjectId(userId),
        },
        {
          ...childrenDto,
        },
      );
    }

    return this.formatIUser(updatesUser);
  }

  async changePassword({
    userId,
    dto,
  }: {
    userId: string;
    dto: UpdateUserPasswordRequest;
  }): Promise<UserResponse> {
    const toUpdate = await this.userRepository.findById(userId).findOne({
      _id: new Types.ObjectId(userId),
    });
    toUpdate.hash = await argon2.hash(dto.newPassword);
    await toUpdate.save();
    return this.formatIUser(toUpdate);
  }

  async deleteById({ id }: { id: string }) {
    return this.userRepository.findOneAndDelete({
      _id: new Types.ObjectId(id),
    });
  }

  async findById({ id }: { id?: string }): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      _id: new Types.ObjectId(id),
    });
    if (!user) {
      const errors = ['Not found'];
      throw new HttpException({ errors }, 401);
    }
    return this.formatIUser(user);
  }

  async findByEmail({ email }: { email: string }): Promise<UserResponse> {
    const user = await this.checkExistByEmail({ email });

    if (user) {
      return this.formatIUser(user);
    }

    return null;
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
      return await this.findById({ id: decoded.id });
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
        return buildMemberSL(item);
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
}
