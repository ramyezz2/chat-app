import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { mockedGuard, mockToken } from '../user/user.controller.spec';
import { AppGuard } from 'src/shared/guards/app.guard';

describe('Room Controller', () => {
  let api;
  let app: INestApplication;
  let roomService: RoomService;
  let roomController: RoomController;
  let mockedAccessToken;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RoomService,
          useValue: {
            getRooms: jest.fn(),
            getRoomsSimpleList: jest.fn(),
            getRoom: jest.fn(),
            checkUniquenessForName: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deleteOne: jest.fn(),
          },
        },
      ],
      controllers: [RoomController],
    })
      .overrideGuard(AppGuard)
      .useValue(mockedGuard)
      .compile();

    roomController = module.get<RoomController>(RoomController);

    roomService = module.get<RoomService>(RoomService);

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    api = await request(app.getHttpServer());

    // create mockToken
  });

  it('should be defined', () => {
    expect(roomController).toBeDefined();
    expect(roomService).toBeDefined();
  });

  afterAll(async () => {
    jest.resetAllMocks();
    await app.close();
  });
});
