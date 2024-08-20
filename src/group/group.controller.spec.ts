import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { mockedGuard, mockToken } from '../user/user.controller.spec';
import { AppGuard } from 'src/shared/guards/app.guard';

describe('Group Controller', () => {
  let api;
  let app: INestApplication;
  let groupService: GroupService;
  let groupController: GroupController;
  let mockedAccessToken;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: GroupService,
          useValue: {
            getGroups: jest.fn(),
            getGroupsSimpleList: jest.fn(),
            getGroup: jest.fn(),
            checkUniquenessForName: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deleteOne: jest.fn(),
          },
        },
      ],
      controllers: [GroupController],
    })
      .overrideGuard(AppGuard)
      .useValue(mockedGuard)
      .compile();

    groupController = module.get<GroupController>(GroupController);

    groupService = module.get<GroupService>(GroupService);

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    api = await request(app.getHttpServer());

    // create mockToken
  });

  it('should be defined', () => {
    expect(groupController).toBeDefined();
    expect(groupService).toBeDefined();
  });

  afterAll(async () => {
    jest.resetAllMocks();
    await app.close();
  });
});
