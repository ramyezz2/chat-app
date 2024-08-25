import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import environment from 'src/config/environment';
import {
  mockedCreateRoomRequest,
  mockedRoomResponse,
  mockedUpdateRoomRequest,
} from 'src/mocks/roomMocks';
import { AppGuard } from 'src/shared/guards/app.guard';
import { UserService } from 'src/user/user.service';
import * as request from 'supertest';
import { mockedFoundUser, mockToken } from '../mocks/userMocks';
import { RoomResponse } from './dto';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomTypeEnum } from 'src/shared/enums';
import { faker } from '@faker-js/faker';
import { RedisSocketService } from 'src/chat/redis-socket.service';

describe('Room Controller', () => {
  let api;
  let app: INestApplication;
  let userService: UserService;
  let roomService: RoomService;
  let roomController: RoomController;
  let mockedAccessToken;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: APP_GUARD, useClass: AppGuard },
        { provide: UserService, useValue: { findByIdForGuard: jest.fn() } },
        {
          provide: RoomService,
          useValue: {
            getRoomsWithPagination: jest.fn(),
            getRooms: jest.fn(),
            getRoomsSimpleList: jest.fn(),
            getRoom: jest.fn(),
            checkUniquenessForName: jest.fn(),
            checkMembersExist: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deleteOne: jest.fn(),
            isMemberInTheRoom: jest.fn(),
            joinRoom: jest.fn(),
            leaveRoom: jest.fn(),
          },
        },
        {
          provide: RedisSocketService,
          useValue: {
            publishMessageToRoom: jest.fn(),
            publishMessageToDirect: jest.fn(),
            addUserToRoom: jest.fn(),
            removeUserFromRoom: jest.fn(),
          },
        },
      ],
      controllers: [RoomController],
    }).compile();

    roomController = module.get<RoomController>(RoomController);

    roomService = module.get<RoomService>(RoomService);
    userService = module.get<UserService>(UserService);

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.useGlobalPipes(new ValidationPipe());
    await app.init();

    api = await request(app.getHttpServer());

    // create mockToken
    mockedAccessToken = await mockToken(mockedFoundUser, '15m');

    Object.defineProperty(environment, 'secret', {
      get: jest.fn(() => 'secret'),
    });
    jest
      .spyOn(userService, 'findByIdForGuard')
      .mockImplementation(() => Promise.resolve(mockedFoundUser));
  });

  it('should be defined', () => {
    expect(roomController).toBeDefined();
    expect(roomService).toBeDefined();
  });

  describe('GET api/rooms', () => {
    it('should get rooms with pagination data', async () => {
      const rooms = await api
        .get(`/api/rooms`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect(HttpStatus.OK);
      expect(rooms.body).toBeInstanceOf(Object);
    });
  });

  describe('GET api/rooms/simple-list', () => {
    it('should get rooms simple-list data', async () => {
      const rooms = await api
        .get(`/api/rooms/simple-list`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect(HttpStatus.OK);
      expect(rooms.body).toBeInstanceOf(Object);
    });
  });

  describe('POST api/rooms', () => {
    it('should throw error (room name must be unique.)', () => {
      jest
        .spyOn(roomService, 'checkUniquenessForName')
        .mockImplementation(() => Promise.resolve(true));

      return api
        .post(`/api/rooms`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .send(mockedCreateRoomRequest)
        .expect(HttpStatus.CONFLICT)
        .expect({
          message: 'Name must be unique.',
          errors: ['Name must be unique.'],
        });
    });

    it('should create room', () => {
      const mockedRoomResponseCreated = JSON.parse(
        JSON.stringify(mockedRoomResponse),
      );

      jest
        .spyOn(roomService, 'checkUniquenessForName')
        .mockImplementation(() => Promise.resolve(false));

      jest
        .spyOn(roomService, 'create')
        .mockImplementation(() => Promise.resolve(mockedRoomResponseCreated));

      return api
        .post(`/api/rooms`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .send(mockedCreateRoomRequest)
        .expect(HttpStatus.CREATED)
        .expect(mockedRoomResponseCreated);
    });
  });

  describe('PATCH api/rooms/:roomId', () => {
    const mockedRoomResponseCreated: RoomResponse = JSON.parse(
      JSON.stringify(mockedRoomResponse),
    );
    const mockedRoomId = mockedRoomResponseCreated.id;

    it('should throw error (Room not found.)', () => {
      jest
        .spyOn(roomService, 'getRoom')
        .mockImplementation(() => Promise.resolve(null));

      return api
        .patch(`/api/rooms/${mockedRoomId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .send(mockedUpdateRoomRequest)
        .expect(HttpStatus.NOT_FOUND)
        .expect({ message: 'Room not found.', errors: ['Room not found.'] });
    });

    it('should throw error (You are not authorized to update this room, You must be the room creator.)', () => {
      jest
        .spyOn(roomService, 'getRoom')
        .mockImplementation(() => Promise.resolve(mockedRoomResponseCreated));

      jest
        .spyOn(roomService, 'checkUniquenessForName')
        .mockImplementation(() => Promise.resolve(true));

      return api
        .patch(`/api/rooms/${mockedRoomId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .send(mockedUpdateRoomRequest)
        .expect(HttpStatus.CONFLICT)
        .expect({
          message:
            'You are not authorized to update this room, You must be the room creator.',
          errors: [
            'You are not authorized to update this room, You must be the room creator.',
          ],
        });
    });

    it('should throw error (room name must be unique.)', () => {
      jest
        .spyOn(roomService, 'getRoom')
        .mockImplementation(() => Promise.resolve(mockedRoomResponseCreated));

      // set the current member to be the creator.
      mockedRoomResponseCreated.createdBy.id = mockedFoundUser.id;

      jest
        .spyOn(roomService, 'checkUniquenessForName')
        .mockImplementation(() => Promise.resolve(true));

      return api
        .patch(`/api/rooms/${mockedRoomId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .send(mockedUpdateRoomRequest)
        .expect(HttpStatus.CONFLICT)
        .expect({
          message: 'Name must be unique.',
          errors: ['Name must be unique.'],
        });
    });

    it('should Patch room', () => {
      jest
        .spyOn(roomService, 'getRoom')
        .mockImplementation(() => Promise.resolve(mockedRoomResponseCreated));

      // set the current member to be the creator.
      mockedRoomResponseCreated.createdBy.id = mockedFoundUser.id;

      jest
        .spyOn(roomService, 'checkUniquenessForName')
        .mockImplementation(() => Promise.resolve(false));
      jest
        .spyOn(roomService, 'update')
        .mockImplementation(() => Promise.resolve(mockedRoomResponse));

      const name = mockedUpdateRoomRequest.name;
      mockedRoomResponse.name = name;

      return api
        .patch(`/api/rooms/${mockedRoomId}`)
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .send(mockedUpdateRoomRequest)
        .expect(HttpStatus.OK)
        .expect(mockedRoomResponse);
    });
  });

  describe('DELETE api/rooms/:roomId', () => {
    const mockedRoomResponseCreated = JSON.parse(
      JSON.stringify(mockedRoomResponse),
    );
    const mockedRoomId = mockedRoomResponseCreated.id;

    it('should throw error (room not found.)', async () => {
      jest
        .spyOn(roomService, 'getRoom')
        .mockImplementation(() => Promise.resolve(null));

      return await api
        .delete(`/api/rooms/${mockedRoomId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.NOT_FOUND)
        .expect({ message: 'Room not found.', errors: ['Room not found.'] });
    });
  });

  describe('POST api/rooms/:roomId/join-public-room', () => {
    it('should throw error (Room not found.)', () => {
      const mockedRoomResponseCreated = JSON.parse(
        JSON.stringify(mockedRoomResponse),
      );
      const mockedRoomId = mockedRoomResponseCreated.id;
      jest
        .spyOn(roomService, 'getRoom')
        .mockImplementation(() => Promise.resolve(null));

      return api
        .post(`/api/rooms/${mockedRoomId}/join-public-room`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.NOT_FOUND)
        .expect({ message: 'Room not found.', errors: ['Room not found.'] });
    });

    it('should throw error (You are not authorized to join this room, The room is not public.)', () => {
      const mockedRoomResponseCreated = JSON.parse(
        JSON.stringify(mockedRoomResponse),
      );
      const mockedRoomId = mockedRoomResponseCreated.id;

      //set room to be private
      mockedRoomResponseCreated.type = RoomTypeEnum.PRIVATE;
      jest
        .spyOn(roomService, 'getRoom')
        .mockImplementation(() => Promise.resolve(mockedRoomResponseCreated));

      return api
        .post(`/api/rooms/${mockedRoomId}/join-public-room`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.CONFLICT)
        .expect({
          message:
            'You are not authorized to join this room, The room is not public.',
          errors: [
            'You are not authorized to join this room, The room is not public.',
          ],
        });
    });

    it('should throw error (You are already joined this room, You are the room creator.)', () => {
      const mockedRoomResponseCreated = JSON.parse(
        JSON.stringify(mockedRoomResponse),
      );
      const mockedRoomId = mockedRoomResponseCreated.id;

      jest
        .spyOn(roomService, 'getRoom')
        .mockImplementation(() => Promise.resolve(mockedRoomResponseCreated));

      // set the current member to be the creator.
      mockedRoomResponseCreated.createdBy.id = mockedFoundUser.id;

      return api
        .post(`/api/rooms/${mockedRoomId}/join-public-room`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.CONFLICT)
        .expect({
          message:
            'You are already joined this room, You are the room creator.',
          errors: [
            'You are already joined this room, You are the room creator.',
          ],
        });
    });

    it('should throw error (You are already joined the room.)', () => {
      const mockedRoomResponseCreated = JSON.parse(
        JSON.stringify(mockedRoomResponse),
      );
      const mockedRoomId = mockedRoomResponseCreated.id;

      jest
        .spyOn(roomService, 'getRoom')
        .mockImplementation(() => Promise.resolve(mockedRoomResponseCreated));

      jest
        .spyOn(roomService, 'isMemberInTheRoom')
        .mockImplementation(() => Promise.resolve(true));

      return api
        .post(`/api/rooms/${mockedRoomId}/join-public-room`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.CONFLICT)
        .expect({
          message: 'You are already joined the room.',
          errors: ['You are already joined the room.'],
        });
    });

    it('should throw error (You joined the room successfully.)', () => {
      const mockedRoomResponseCreated = JSON.parse(
        JSON.stringify(mockedRoomResponse),
      );
      const mockedRoomId = mockedRoomResponseCreated.id;

      jest
        .spyOn(roomService, 'getRoom')
        .mockImplementation(() => Promise.resolve(mockedRoomResponseCreated));

      jest
        .spyOn(roomService, 'isMemberInTheRoom')
        .mockImplementation(() => Promise.resolve(false));

      jest.spyOn(roomService, 'joinRoom').mockImplementation(() => null);

      return api
        .post(`/api/rooms/${mockedRoomId}/join-public-room`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect(HttpStatus.CREATED)
        .expect({});
    });
  });

  describe('POST api/rooms/:roomId/leave', () => {
    it('should throw error (Room not found.)', () => {
      const mockedRoomResponseCreated = JSON.parse(
        JSON.stringify(mockedRoomResponse),
      );
      const mockedRoomId = mockedRoomResponseCreated.id;
      jest
        .spyOn(roomService, 'getRoom')
        .mockImplementation(() => Promise.resolve(null));

      return api
        .post(`/api/rooms/${mockedRoomId}/leave`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.NOT_FOUND)
        .expect({ message: 'Room not found.', errors: ['Room not found.'] });
    });

    it('should throw error (You are not authorized to leave this room, You are the room creator.)', () => {
      const mockedRoomResponseCreated = JSON.parse(
        JSON.stringify(mockedRoomResponse),
      );
      const mockedRoomId = mockedRoomResponseCreated.id;

      // set the current member to be the creator.
      mockedRoomResponseCreated.createdBy.id = mockedFoundUser.id;

      jest
        .spyOn(roomService, 'getRoom')
        .mockImplementation(() => Promise.resolve(mockedRoomResponseCreated));

      return api
        .post(`/api/rooms/${mockedRoomId}/leave`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.CONFLICT)
        .expect({
          message:
            'You are not authorized to leave this room, You are the room creator.',
          errors: [
            'You are not authorized to leave this room, You are the room creator.',
          ],
        });
    });

    it('should throw error (You are not a member in this room.)', () => {
      const mockedRoomResponseCreated = JSON.parse(
        JSON.stringify(mockedRoomResponse),
      );
      const mockedRoomId = mockedRoomResponseCreated.id;

      jest
        .spyOn(roomService, 'getRoom')
        .mockImplementation(() => Promise.resolve(mockedRoomResponseCreated));

      jest
        .spyOn(roomService, 'isMemberInTheRoom')
        .mockImplementation(() => Promise.resolve(false));

      return api
        .post(`/api/rooms/${mockedRoomId}/leave`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.CONFLICT)
        .expect({
          message: 'You are not a member in this room.',
          errors: ['You are not a member in this room.'],
        });
    });

    it('should throw error (You joined the room successfully.)', () => {
      const mockedRoomResponseCreated = JSON.parse(
        JSON.stringify(mockedRoomResponse),
      );
      const mockedRoomId = mockedRoomResponseCreated.id;

      jest
        .spyOn(roomService, 'getRoom')
        .mockImplementation(() => Promise.resolve(mockedRoomResponseCreated));

      jest
        .spyOn(roomService, 'isMemberInTheRoom')
        .mockImplementation(() => Promise.resolve(true));

      jest.spyOn(roomService, 'leaveRoom').mockImplementation(() => null);

      return api
        .post(`/api/rooms/${mockedRoomId}/leave`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect(HttpStatus.CREATED)
        .expect({});
    });
  });

  afterAll(async () => {
    jest.resetAllMocks();
    await app.close();
  });
});
