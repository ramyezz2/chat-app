import { faker } from '@faker-js/faker';
import { ExecutionContext } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { Model, Types } from 'mongoose';
import { GenderEnum } from 'src/shared/enums';
import {
  CreateUserRequest,
  LoginUserRequest,
  UserResponse,
} from 'src/user/dto';
import { MemberResponse } from 'src/user/dto/member.response.dto';
import { UserDocument } from 'src/user/user.schema';
import { stub } from 'sinon';

export const MockedRequest = {
  app: {},
  baseUrl: '',
  body: {},
  cookies: {},
  fresh: true,
  headers: {},
  hostname: '',
  ip: '127.0.0.1',
  ips: [],
  method: 'GET',
  originalUrl: 'https://localhost:3000/',
  params: {},
  path: '',
  protocol: 'https',
  query: {},
  route: {},
  secure: true,
  signedCookies: {},
  stale: false,
  subdomains: [],
  xhr: true,
  acceptsCharsets: stub(),
  acceptsEncodings: stub(),
  acceptsLanguages: stub(),
  get: stub(),
  is: stub(),
  range: stub(),
};

export const userOneId = new Types.ObjectId();
//Email For Testing
export const OwnerEmail = 'admin@app.com';

export const mockedLoginCredentials: LoginUserRequest = {
  email: faker.internet.email(),
  password: faker.internet.password(),
};

export const mockedCreateUserRequest: CreateUserRequest = {
  email: faker.internet.email(),
  firstName: faker.internet.userName(),
  lastName: faker.internet.userName(),
  password: faker.internet.password(8),
  gender: GenderEnum.MALE,
};

export const mockedUserResponse: UserResponse = {
  id: faker.database.mongodbObjectId(),
  email: mockedCreateUserRequest.email,
  firstName: mockedCreateUserRequest.firstName,
  lastName: mockedCreateUserRequest.lastName,
  accessToken: jwt.sign(mockedCreateUserRequest, faker.number.hex(10)),
  refreshToken: jwt.sign(mockedCreateUserRequest, faker.number.hex(10)),
};

export const mockedMemberResponse: MemberResponse = {
  id: faker.database.mongodbObjectId(),
  email: mockedCreateUserRequest.email,
  firstName: mockedCreateUserRequest.firstName,
  lastName: mockedCreateUserRequest.lastName,
};

export const mockedFoundUser: UserDocument | any = {
  _id: userOneId._id,
  id: userOneId._id.toHexString(),
  email: mockedCreateUserRequest.email,
  firstName: mockedCreateUserRequest.firstName,
  lastName: mockedCreateUserRequest.lastName,
  gender: GenderEnum.MALE,
  phone: faker.phone.number(),
  hash: faker.number.hex(200),
  loginAt: faker.date.recent(),
  logoutAt: faker.date.past(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.past(),
};

export const mockedGuard = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    req.user = mockedFoundUser;
    return true;
  },
};

export const mockToken = (
  { id, firstName, lastName, email },
  expiresIn: string,
) => {
  return jwt.sign(
    {
      id,
      firstName,
      lastName,
      email,
      type: 'TOKEN',
    },
    'secret',
    { expiresIn },
  );
};

// return data that saved in database in user
// and extra data not saved i.e. {password, verificationCode, resetPasswordCode}
export const generateMockedUser = async (
  userRepository: Model<UserDocument>,
): Promise<{
  user: UserDocument;
  password: string;
}> => {
  const password = faker.internet.password();
  const hash = await argon2.hash(password);
  return {
    user: await new userRepository({
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      gender: GenderEnum.MALE,
      phone: faker.phone.number(),
      hash,
    }).save(),
    password,
  };
};
