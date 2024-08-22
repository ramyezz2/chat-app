import { faker } from '@faker-js/faker';
import {
  MongooseModule,
  getConnectionToken,
  getModelToken,
} from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Connection, Model } from 'mongoose';
import environment from 'src/config/environment';
import {
  generateMockedUser,
  mockedCreateUserRequest,
} from 'src/mocks/userMocks';
import {
  DbModule,
  closeMongoConnection,
} from 'src/shared/helpers/db-test-module';
import { UserDocument, UserSchema } from './user.schema';
import { UserService } from './user.service';
import { buildUserResponse } from './utils';

describe('UserService', () => {
  let connection: Connection;
  let userService: UserService;
  let userRepository: Model<UserDocument>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        DbModule({}),
        MongooseModule.forFeature([
          { name: UserDocument.name, schema: UserSchema },
        ]),
      ],
      providers: [UserService],
    }).compile();

    connection = await module.get(getConnectionToken());

    userRepository = module.get(getModelToken(UserDocument.name));
    userService = module.get<UserService>(UserService);

    Object.defineProperty(environment, 'secret', {
      get: jest.fn(() => 'secret'),
    });
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('login', () => {
    it('should find one by email and password if exists', async () => {
      const { user, password } = await generateMockedUser(userRepository);

      const userFound = await userService.login({
        email: user.email,
        password: password,
      });

      expect(userFound).toBeDefined();
      expect(userFound?.email).toBe(user.email);

      await userRepository.deleteOne({ _id: user.id });
    });

    it('should not find one by email and password if not exists', async () => {
      const testedEmail = faker.internet.email();
      const testedPassword = faker.internet.password();

      const userFound = await userService.login({
        email: testedEmail,
        password: testedPassword,
      });

      expect(userFound).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user for signup', async () => {
      const createdUser = await userService.create({
        dto: mockedCreateUserRequest,
      });

      expect(createdUser.accessToken).toBeDefined();
      expect(createdUser.refreshToken).toBeDefined();

      await userRepository.deleteOne({ _id: createdUser.id });
    });
  });

  describe('update', () => {
    it('should update a user data', async () => {
      const { user } = await generateMockedUser(userRepository);
      const userFound = await userService.update({
        userId: user.id,
        dto: { firstName: 'ramy', lastName: 'ezz' },
      });
      expect(userFound.firstName).toBe('ramy');
      expect(userFound.lastName).toBe('ezz');

      await userRepository.deleteOne({ _id: user.id });
    });
  });

  describe('checkExistByEmail', () => {
    it('should return null if user does not exist by email', async () => {
      const mockedEmail = 'ramy@app.com';
      expect(
        await userService.checkExistByEmail({ email: mockedEmail }),
      ).toBeNull();
    });

    it('should be defined if the user already exist by email', async () => {
      const mockedEmail = 'ramy@app.com';

      const user = new userRepository({
        email: mockedEmail,
        firstName: 'ramy',
        lastName: 'ezz',
        phone: '+2345678901',
        hash: '123456789',
      });
      await user.save();
      expect(
        await userService.checkExistByEmail({ email: mockedEmail }),
      ).toBeDefined();
      await userRepository.deleteOne({ _id: user.id });
    });
  });

  describe('findByRefreshToken', () => {
    it('should find user with new access and refresh token', async () => {
      const { user } = await generateMockedUser(userRepository);
      const { refreshToken } = await buildUserResponse({ document: user });
      const userAfterRefreshing = await userService.findByRefreshToken({
        token: refreshToken,
      });

      expect(userAfterRefreshing).toBeDefined();
      expect(userAfterRefreshing.accessToken).toBeDefined();

      await userRepository.deleteOne({ _id: user.id });
    });

    it('should not find user with invalid refresh token', async () => {
      const { user } = await generateMockedUser(userRepository);
      const { refreshToken } = await buildUserResponse({ document: user });

      try {
        await userService.findByRefreshToken({ token: 'a' + refreshToken });
      } catch (error) {
        expect(error).toHaveProperty('message', 'invalid token');
      }

      await userRepository.deleteOne({ _id: user.id });
    });
  });

  afterAll(async () => {
    await connection.close(true);
    await closeMongoConnection();
  });
});
