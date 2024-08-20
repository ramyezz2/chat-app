import { faker } from '@faker-js/faker';
import * as jwt from 'jsonwebtoken';
import { GenderEnum } from 'src/shared/enums';
import { CreateUserRequest, UserResponse } from 'src/user/dto';

export const mockedCreateUserRequest: CreateUserRequest = {
  email: faker.internet.email(),
  firstName: faker.internet.userName(),
  lastName: faker.internet.userName(),
  password: faker.internet.password(8),
  gender: GenderEnum.MALE,
};

export const mockedUserResponse: UserResponse = {
  id: faker.string.uuid(),
  email: mockedCreateUserRequest.email,
  firstName: mockedCreateUserRequest.firstName,
  lastName: mockedCreateUserRequest.lastName,
  accessToken: jwt.sign(
    mockedCreateUserRequest,
    faker.number.hex(10),
  ),
  refreshToken: jwt.sign(
    mockedCreateUserRequest,
    faker.number.hex(10),
  ),
};

//Email For Testing
export const OwnerEmail = 'admin@app.com';
