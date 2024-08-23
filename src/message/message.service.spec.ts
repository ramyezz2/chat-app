import {
  getConnectionToken,
  getModelToken,
  MongooseModule,
} from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Model, Types } from 'mongoose';
import { generateMockedUser, MockedRequest } from 'src/mocks/userMocks';
import {
  closeMongoConnection,
  DbModule,
} from '../shared/helpers/db-test-module';
import { UserDocument, UserSchema } from '../user/user.schema';
import {
  CreateDirectMessageRequest,
  CreateRoomMessageRequest,
  UpdateMessageRequest,
} from './dto';
import { MessageDocument, MessageSchema } from './message.schema';
import { MessageService } from './message.service';
import {
  mockedCreateDirectMessageRequest,
  mockedUpdateMessageRequest,
} from 'src/mocks/messageMocks';
import { RoomDocument, RoomSchema } from 'src/room/room.schema';

describe('MessageService', () => {
  let connection: Connection;
  let messageService: MessageService;
  let userRepository: Model<UserDocument>;
  let messageRepository: Model<MessageDocument>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DbModule({}),
        MongooseModule.forFeature([
          { name: MessageDocument.name, schema: MessageSchema },
          { name: UserDocument.name, schema: UserSchema },
          { name: RoomDocument.name, schema: RoomSchema },
        ]),
      ],
      providers: [MessageService],
    }).compile();

    connection = await module.get(getConnectionToken());

    // Models registration
    userRepository = module.get(getModelToken(UserDocument.name));
    messageRepository = module.get(getModelToken(MessageDocument.name));

    messageService = module.get<MessageService>(MessageService);
  });

  it('should be defined', () => {
    expect(messageService).toBeDefined();
  });

  describe('getMessagesWithPagination', () => {
    let mockedUserSender: UserDocument;
    let mockedUserReceiver: UserDocument;
    let message: MessageDocument;
    const createDirectMessageRequest: CreateDirectMessageRequest = JSON.parse(
      JSON.stringify(mockedCreateDirectMessageRequest),
    );

    beforeAll(async () => {
      // Add user in test db
      mockedUserSender = (await generateMockedUser(userRepository)).user;
      mockedUserReceiver = (await generateMockedUser(userRepository)).user;

      // Add message in test db
      message = await messageRepository.create({
        ...createDirectMessageRequest,
        sender: mockedUserSender._id,
        receiver: mockedUserReceiver._id,
      });
    });

    it('should find Messages With Pagination', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
      };

      const options = {};
      const messagesFound = await messageService.getMessagesWithPagination({
        request: MockedRequest,
        paginationDto,
        options,
      });

      expect(messagesFound).toBeDefined();
      expect(messagesFound.data).toBeInstanceOf(Array);
      expect(typeof messagesFound.currentPage).toBe('number');
      expect(typeof messagesFound.itemsPerPage).toBe('number');
      expect(typeof messagesFound.totalItems).toBe('number');
      expect(typeof messagesFound.totalPages).toBe('number');
      expect(messagesFound.selfLink).toBeDefined;
      expect(messagesFound.nextLink).toBeDefined;
      expect(messagesFound.prevLink).toBeDefined;
    });

    it('should get all Messages With Pagination And Options', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
      };
      const options = {};
      const messagesFound = await messageService.getMessagesWithPagination({
        request: MockedRequest,
        paginationDto,
        options,
      });

      expect(messagesFound).toBeDefined();
      expect(messagesFound.data).toBeInstanceOf(Array);
      expect(messagesFound.data[0].id).toBe(message.id);
      expect(messagesFound.data[0].content).toBe(message.content);
      expect(messagesFound.data[0].type).toBe(message.type);
      expect(messagesFound.data[0].sender.id).toBe(message.sender.id);
      expect(messagesFound.data[0].receiver.id).toBe(message.receiver.id);

      expect(typeof messagesFound.currentPage).toBe('number');
      expect(typeof messagesFound.itemsPerPage).toBe('number');
      expect(typeof messagesFound.totalItems).toBe('number');
      expect(typeof messagesFound.totalPages).toBe('number');
      expect(messagesFound.selfLink).toBeDefined;
      expect(messagesFound.nextLink).toBeDefined;
      expect(messagesFound.prevLink).toBeDefined;
    });

    it('should get Message By Id', async () => {
      const messageFound = await messageService.getMessage({
        id: message.id,
      });

      expect(messageFound).toBeDefined();
      expect(messageFound.id).toBeDefined();
      expect(messageFound.content).toBe(message.content);
    });

    afterAll(async () => {
      await messageRepository.deleteOne({ _id: message._id });
      await userRepository.deleteOne({
        _id: { $in: [mockedUserSender._id, mockedUserReceiver._id] },
      });
    });
  });

  describe('create', () => {
    let mockedUser: UserDocument;
    let messageId: string;

    beforeAll(async () => {
      // Add user in test db
      const { user } = await generateMockedUser(userRepository);
      mockedUser = user;
    });

    it('should create Message', async () => {
      const createMessageRequest: CreateDirectMessageRequest = JSON.parse(
        JSON.stringify(mockedCreateDirectMessageRequest),
      );

      const messageFound = await messageService.createDirectMessage({
        currentUser: mockedUser,
        dto: createMessageRequest,
      });
      expect(messageFound).toBeDefined();
      expect(messageFound).toBeInstanceOf(Object);
      expect(messageFound.id).toBeDefined();
      expect(messageFound.content).toBe(createMessageRequest.content);

      messageId = messageFound.id;
    });

    afterAll(async () => {
      await messageRepository.deleteOne({ _id: messageId });
      await userRepository.deleteOne({ _id: mockedUser._id });
    });
  });

  describe('update', () => {
    let mockedUser: UserDocument;
    let message: MessageDocument;
    const createMessageRequest: CreateDirectMessageRequest = JSON.parse(
      JSON.stringify(mockedCreateDirectMessageRequest),
    );
    const updateMessageRequest: UpdateMessageRequest = JSON.parse(
      JSON.stringify(mockedUpdateMessageRequest),
    );

    beforeAll(async () => {
      // Add user in test db
      const { user } = await generateMockedUser(userRepository);
      mockedUser = user;

      // Add message in test db
      message = await messageRepository.create({
        ...createMessageRequest,
        sender: new Types.ObjectId(user.id),
      });
    });

    it('should update message data', async () => {
      const messageFound = await messageService.update({
        id: message.id,
        dto: updateMessageRequest,
      });

      expect(messageFound).toBeDefined();
      expect(messageFound).toBeInstanceOf(Object);
      expect(messageFound.id).toBe(message.id);
      expect(messageFound.content).toBe(updateMessageRequest.content);
    });

    afterAll(async () => {
      await messageRepository.deleteOne({ _id: message._id });
      await userRepository.deleteOne({ _id: mockedUser._id });
    });
  });

  describe('deleteOne', () => {
    let mockedUser: UserDocument;
    let message: MessageDocument;
    const createMessageRequest: CreateDirectMessageRequest = JSON.parse(
      JSON.stringify(mockedCreateDirectMessageRequest),
    );

    beforeAll(async () => {
      // Add user in test db
      const { user } = await generateMockedUser(userRepository);
      mockedUser = user;

      // Add message in test db
      message = await messageRepository.create({
        ...createMessageRequest,
        sender: new Types.ObjectId(user.id),
      });
    });

    it('should delete message by id if exists', async () => {
      const messageFound = await messageService.getMessage({
        id: message.id,
      });
      expect(messageFound).toBeDefined();

      await messageService.deleteOne({ _id: message.id });

      const deletedMessage = await messageService.getMessage({
        id: message.id,
      });
      expect(deletedMessage).toBeNull();
    });

    afterAll(async () => {
      await userRepository.deleteOne({ _id: mockedUser._id });
    });
  });

  afterAll(async () => {
    await connection.close(true);
    await closeMongoConnection();
  });
});
