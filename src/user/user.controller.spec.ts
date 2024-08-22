import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { faker } from '@faker-js/faker';
import {
  mockedCreateUserRequest,
  mockedFoundUser,
  mockedGuard,
  mockedLoginCredentials,
  mockedMemberResponse,
  mockedUserResponse,
  mockToken,
} from 'src/mocks/userMocks';
import { AppGuard } from 'src/shared/guards/app.guard';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import environment from 'src/config/environment';
import TestAgent from 'supertest/lib/agent';
import { APP_GUARD } from '@nestjs/core';

describe('UserController', () => {
  let api: TestAgent;
  let app: INestApplication;
  let userController: UserController;
  let userService: UserService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        { provide: APP_GUARD, useClass: AppGuard },
        { provide: UserService, useValue: { findByIdForGuard: jest.fn() } },
        {
          provide: UserService,
          useValue: {
            findByIdForGuard: jest.fn(),
            login: jest.fn(),
            checkExistByEmail: jest.fn(),
            checkExistByUserName: jest.fn(),
            checkPhoneExist: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deleteById: jest.fn(),
            findMemberById: jest.fn(),
            findByRefreshToken: jest.fn(),
            argonVerify: jest.fn(),
            getUserById: jest.fn(),
            getUsersSimpleList: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
      controllers: [UserController],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.useGlobalPipes(new ValidationPipe());
    await app.init();

    api = await request(app.getHttpServer());
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
    expect(userService).toBeDefined();
  });

  describe('/POST api/users/signup', () => {
    it('should not signup with required inputs', () => {
      return api
        .post('/api/users/signup')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({})
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: [
            'firstName should not be empty',
            'lastName should not be empty',
            'email must be an email',
            'email should not be empty',
            'password must be longer than or equal to 6 characters',
            'password should not be empty',
          ],
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        });
    });

    it('should not signup with invalid email', () => {
      return api
        .post('/api/users/signup')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({ ...mockedCreateUserRequest, email: '123' })
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: ['email must be an email'],
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        });
    });

    it('should not signup with short password', () => {
      return api
        .post('/api/users/signup')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({ ...mockedCreateUserRequest, password: '123' })
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: ['password must be longer than or equal to 6 characters'],
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        });
    });

    it('should not signup since user already exist', () => {
      jest
        .spyOn(userService, 'checkExistByEmail')
        .mockImplementation(() => Promise.resolve(mockedFoundUser));

      return api
        .post('/api/users/signup')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send(mockedCreateUserRequest)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: 'Email is already exist.',
          errors: ['Email is already exist.'],
        });
    });

    it(`should signup if inputs valid and email doesn't exist`, () => {
      jest
        .spyOn(userService, 'checkExistByEmail')
        .mockImplementation(() => Promise.resolve(undefined));

      jest
        .spyOn(userService, 'create')
        .mockImplementation(() => Promise.resolve(mockedUserResponse));

      return api
        .post('/api/users/signup')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send(mockedCreateUserRequest)
        .expect(HttpStatus.CREATED)
        .expect(mockedUserResponse);
    });
  });

  describe('GET api/users/login', () => {
    it('should throw error', async () => {
      const userResponse = await api
        .post(`/api/users/login`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(HttpStatus.BAD_REQUEST);
      expect(userResponse.body).toBeInstanceOf(Object);
      expect(userResponse.body).toStrictEqual({
        message: [
          'email must be an email',
          'email should not be empty',
          'password must be longer than or equal to 6 characters',
          'password should not be empty',
        ],
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });

    it('should throw error (Not found) if userService login returns null', () => {
      jest
        .spyOn(userService, 'login')
        .mockImplementation(() => Promise.resolve(null));

      return api
        .post('/api/users/login')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send(mockedLoginCredentials)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect({
          message: 'Invalid email or password. Please try again.',
          errors: ['Invalid email or password. Please try again.'],
        });
    });

    it('should login successfully when userService.getOne return userData', () => {
      jest
        .spyOn(userService, 'login')
        .mockImplementation(() => Promise.resolve(mockedUserResponse));

      return api
        .post('/api/users/login')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send(mockedLoginCredentials)
        .expect(HttpStatus.CREATED)
        .expect(mockedUserResponse);
    });
  });

  describe('/PATCH api/users', () => {
    it('should throw error (Not authorized.) if token not provided', () => {
      jest
        .spyOn(userService, 'update')
        .mockImplementation(() => Promise.resolve(mockedMemberResponse));

      return api
        .patch('/api/users')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({ firstName: faker.person.firstName })
        .expect(HttpStatus.UNAUTHORIZED)
        .expect({
          message: 'Not authorized.',
          error: 'Unauthorized',
          statusCode: HttpStatus.UNAUTHORIZED,
        });
    });

    it('should login and return userData if token provided and user service return userData', () => {
      Object.defineProperty(environment, 'secret', {
        get: jest.fn(() => 'secret'),
      });

      jest
        .spyOn(userService, 'findByIdForGuard')
        .mockImplementation(() => Promise.resolve(mockedFoundUser));

      jest
        .spyOn(userService, 'update')
        .mockImplementation(() => Promise.resolve(mockedUserResponse));

      const mockedAccessToken = mockToken(mockedUserResponse, '15m');

      return api
        .patch('/api/users')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .send({ firstName: faker.person.firstName })
        .expect(HttpStatus.OK)
        .expect(mockedUserResponse);
    });
  });

  describe('refreshToken', () => {
    it('should return BAD REQUEST if refreshToken not provided', () => {
      return api
        .post('/api/users/refresh-token')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({})
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: ['refreshToken should not be empty'],
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        });
    });

    it('should return BAD REQUEST if userService throws error', () => {
      jest
        .spyOn(userService, 'findByRefreshToken')
        .mockImplementation(() => Promise.reject('invalid token'));

      return api
        .post('/api/users/refresh-token')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({
          refreshToken: faker.number.hex(10),
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect({ message: 'invalid token', errors: ['Invalid token.'] });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
