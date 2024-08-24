import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import environment from 'src/config/environment';
import {
  mockedCreateDirectMessageRequest,
  mockedCreateRoomMessageRequest,
  mockedDirectMessageResponse,
  mockedRoomMessageResponse,
  mockedUpdateMessageRequest,
} from 'src/mocks/messageMocks';
import { AppGuard } from 'src/shared/guards/app.guard';
import { UserService } from 'src/user/user.service';
import * as request from 'supertest';
import { mockedFoundUser, mockToken } from '../mocks/userMocks';
import { MessageResponse } from './dto';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { mockedRoomResponse } from 'src/mocks/roomMocks';

describe('Message Controller', () => {
  let api;
  let app: INestApplication;
  let userService: UserService;
  let messageService: MessageService;
  let messageController: MessageController;
  let mockedAccessToken;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: APP_GUARD, useClass: AppGuard },
        { provide: UserService, useValue: { findByIdForGuard: jest.fn() } },
        {
          provide: MessageService,
          useValue: {
            getMessagesWithPagination: jest.fn(),
            getMessage: jest.fn(),
            checkMemberExist: jest.fn(),
            isMemberInTheRoom: jest.fn(),
            checkRoomExist: jest.fn(),
            createDirectMessage: jest.fn(),
            createRoomMessage: jest.fn(),
            update: jest.fn(),
            deleteOne: jest.fn(),
          },
        },
      ],
      controllers: [MessageController],
    }).compile();

    messageController = module.get<MessageController>(MessageController);

    messageService = module.get<MessageService>(MessageService);
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
    expect(messageController).toBeDefined();
    expect(messageService).toBeDefined();
  });

  describe('GET api/messages/direct/:memberId', () => {
    it('should throw error (Member not found.)', async () => {
      const memberId = mockedFoundUser.id;
      jest
        .spyOn(messageService, 'checkMemberExist')
        .mockImplementation(() => Promise.resolve(false));
      const messages = await api
        .get(`/api/messages/direct/${memberId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect(HttpStatus.NOT_FOUND)
        .expect({
          message: 'Member not found.',
          errors: ['Member not found.'],
        });
      expect(messages.body).toBeInstanceOf(Object);
    });
    it('should get messages with pagination data', async () => {
      const memberId = mockedFoundUser.id;
      jest
        .spyOn(messageService, 'checkMemberExist')
        .mockImplementation(() => Promise.resolve(true));
      
      const messages = await api
        .get(`/api/messages/direct/${memberId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect(HttpStatus.OK);
      expect(messages.body).toBeInstanceOf(Object);
    });
  });

  describe('GET api/messages/rooms/:roomId', () => {
    it('should throw error (Room not found.)', async () => {
      const roomId = mockedRoomResponse.id;
      jest
        .spyOn(messageService, 'checkRoomExist')
        .mockImplementation(() => Promise.resolve(false));
      const messages = await api
        .get(`/api/messages/rooms/${roomId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect(HttpStatus.NOT_FOUND)
        .expect({
          message: 'Room not found.',
          errors: ['Room not found.'],
        });
      expect(messages.body).toBeInstanceOf(Object);
    });

    it('should throw error (You are not a member of this room.)', async () => {
      const roomId = mockedRoomResponse.id;
      jest
        .spyOn(messageService, 'checkRoomExist')
        .mockImplementation(() => Promise.resolve(true));

      jest
        .spyOn(messageService, 'isMemberInTheRoom')
        .mockImplementation(() => Promise.resolve(false));

      const messages = await api
        .get(`/api/messages/rooms/${roomId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect(HttpStatus.CONFLICT)
        .expect({
          message: 'You are not a member of this room.',
          errors: ['You are not a member of this room.'],
        });
      expect(messages.body).toBeInstanceOf(Object);
    });

    it('should get messages with pagination data', async () => {
      const roomId = mockedRoomResponse.id;
      jest
        .spyOn(messageService, 'checkRoomExist')
        .mockImplementation(() => Promise.resolve(true));

      jest
        .spyOn(messageService, 'isMemberInTheRoom')
        .mockImplementation(() => Promise.resolve(true));

      const messages = await api
        .get(`/api/messages/rooms/${roomId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect(HttpStatus.OK);
      expect(messages.body).toBeInstanceOf(Object);
    });
  });

  describe('POST api/messages/direct', () => {
    it('should create message', () => {
      const mockedMessageResponseCreated = JSON.parse(
        JSON.stringify(mockedDirectMessageResponse),
      );

      jest
        .spyOn(messageService, 'createDirectMessage')
        .mockImplementation(() =>
          Promise.resolve(mockedMessageResponseCreated),
        );

      return api
        .post(`/api/messages/direct`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .send(mockedCreateDirectMessageRequest)
        .expect(HttpStatus.CREATED)
        .expect(mockedMessageResponseCreated);
    });
  });

  describe('POST api/messages/room', () => {
    it('should create message', () => {
      const mockedMessageResponseCreated = JSON.parse(
        JSON.stringify(mockedRoomMessageResponse),
      );

      jest
        .spyOn(messageService, 'createRoomMessage')
        .mockImplementation(() =>
          Promise.resolve(mockedMessageResponseCreated),
        );

      return api
        .post(`/api/messages/room`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .send(mockedCreateRoomMessageRequest)
        .expect(HttpStatus.CREATED)
        .expect(mockedMessageResponseCreated);
    });
  });

  describe('PATCH api/messages/:messageId', () => {
    const mockedMessageResponseCreated: MessageResponse = JSON.parse(
      JSON.stringify(mockedDirectMessageResponse),
    );
    const mockedMessageId = mockedMessageResponseCreated.id;

    it('should throw error (Message not found.)', () => {
      jest
        .spyOn(messageService, 'getMessage')
        .mockImplementation(() => Promise.resolve(null));

      return api
        .patch(`/api/messages/${mockedMessageId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .send(mockedUpdateMessageRequest)
        .expect(HttpStatus.NOT_FOUND)
        .expect({
          message: 'Message not found.',
          errors: ['Message not found.'],
        });
    });

    it('should throw error (You are not authorized to update this message, You must be the message creator.)', () => {
      jest
        .spyOn(messageService, 'getMessage')
        .mockImplementation(() =>
          Promise.resolve(mockedMessageResponseCreated),
        );

      return api
        .patch(`/api/messages/${mockedMessageId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .send(mockedUpdateMessageRequest)
        .expect(HttpStatus.CONFLICT)
        .expect({
          message:
            'You are not authorized to update this message, You must be the message creator.',
          errors: [
            'You are not authorized to update this message, You must be the message creator.',
          ],
        });
    });

    it('should Patch message', async () => {
      jest
        .spyOn(messageService, 'getMessage')
        .mockImplementation(() =>
          Promise.resolve(mockedMessageResponseCreated),
        );

      // set the current member to be the creator.
      mockedMessageResponseCreated.sender.id = mockedFoundUser.id;

      jest
        .spyOn(messageService, 'update')
        .mockImplementation(() => Promise.resolve(mockedDirectMessageResponse));

      const content = mockedUpdateMessageRequest.content;
      mockedDirectMessageResponse.content = content;

      const response = await api
        .patch(`/api/messages/${mockedMessageId}`)
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .send(mockedUpdateMessageRequest)
        .expect(HttpStatus.OK);
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body.id).toBe(mockedMessageResponseCreated.id);
      expect(response.body.content).toBe(content);
    });
  });

  describe('DELETE api/messages/:messageId', () => {
    const mockedMessageResponseCreated = JSON.parse(
      JSON.stringify(mockedDirectMessageResponse),
    );
    const mockedMessageId = mockedMessageResponseCreated.id;

    it('should throw error (message not found.)', async () => {
      jest
        .spyOn(messageService, 'getMessage')
        .mockImplementation(() => Promise.resolve(null));

      return await api
        .delete(`/api/messages/${mockedMessageId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${mockedAccessToken}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.NOT_FOUND)
        .expect({
          message: 'Message not found.',
          errors: ['Message not found.'],
        });
    });
  });

  afterAll(async () => {
    jest.resetAllMocks();
    await app.close();
  });
});
