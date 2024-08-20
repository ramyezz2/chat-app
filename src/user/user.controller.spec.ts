import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { Test } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AppGuard } from 'src/shared/guards/app.guard';

export const mockedGuard = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    req.user = {};
    return true;
  },
};

export const mockToken = (
  { id, firstName, lastName, email, isSuperAdmin, isEmailVerified },
  expiresIn: string,
) => {
  return jwt.sign(
    {
      id,
      firstName,
      lastName,
      email,
      isSuperAdmin,
      isEmailVerified,
    },
    'secret',
    { expiresIn },
  );
};

describe('UserController', () => {
  let api;
  let app: INestApplication;
  let userService: UserService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn(),
            checkExistByEmail: jest.fn(),
            create: jest.fn(),
            verify: jest.fn(),
            findByEmail: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
            findByRefreshToken: jest.fn(),
            argonVerify: jest.fn(),
            generateNewVerificationCode: jest.fn(),
          },
        },
      ],
      controllers: [UserController],
    })
      .overrideGuard(AppGuard)
      .useValue(mockedGuard)
      .compile();

    userService = module.get<UserService>(UserService);

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    api = await request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });
});
