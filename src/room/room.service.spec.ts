import {
  getConnectionToken,
  getModelToken,
  MongooseModule,
} from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Model, Types } from 'mongoose';
import {
  mockedCreateRoomRequest,
  mockedUpdateRoomRequest,
} from 'src/mocks/roomMocks';
import { generateMockedUser, MockedRequest } from 'src/mocks/userMocks';
import {
  closeMongoConnection,
  DbModule,
} from '../shared/helpers/db-test-module';
import { UserDocument, UserSchema } from '../user/user.schema';
import { CreateRoomRequest, UpdateRoomRequest } from './dto';
import { RoomDocument, RoomSchema } from './room.schema';
import { RoomService } from './room.service';

describe('RoomService', () => {
  let connection: Connection;
  let roomService: RoomService;
  let userRepository: Model<UserDocument>;
  let roomRepository: Model<RoomDocument>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DbModule({}),
        MongooseModule.forFeature([
          { name: RoomDocument.name, schema: RoomSchema },
          { name: UserDocument.name, schema: UserSchema },
        ]),
      ],
      providers: [RoomService],
    }).compile();

    connection = await module.get(getConnectionToken());

    // Models registration
    userRepository = module.get(getModelToken(UserDocument.name));
    roomRepository = module.get(getModelToken(RoomDocument.name));

    roomService = module.get<RoomService>(RoomService);
  });

  it('should be defined', () => {
    expect(roomService).toBeDefined();
  });

  describe('getRoomsWithPagination / getRoomsWithPaginationSimpleList / getRoom', () => {
    let mockedUser: UserDocument;
    let room: RoomDocument;
    const createRoomRequest: CreateRoomRequest = JSON.parse(
      JSON.stringify(mockedCreateRoomRequest),
    );

    beforeAll(async () => {
      // Add user in test db
      const { user } = await generateMockedUser(userRepository);
      mockedUser = user;
      // Add room in test db
      room = await roomRepository.create({
        ...createRoomRequest,
        createdBy: new Types.ObjectId(user.id),
      });
    });

    it('should find all Rooms With Pagination', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
      };

      const options = {};
      const roomsFound = await roomService.getRoomsWithPagination({
        request: MockedRequest,
        paginationDto,
        options,
      });

      expect(roomsFound).toBeDefined();
      expect(roomsFound.data).toBeInstanceOf(Array);
      expect(typeof roomsFound.currentPage).toBe('number');
      expect(typeof roomsFound.itemsPerPage).toBe('number');
      expect(typeof roomsFound.totalItems).toBe('number');
      expect(typeof roomsFound.totalPages).toBe('number');
      expect(roomsFound.selfLink).toBeDefined;
      expect(roomsFound.nextLink).toBeDefined;
      expect(roomsFound.prevLink).toBeDefined;
    });

    it('should get all Rooms With Pagination And Options', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
      };
      const options = {};
      const roomsFound = await roomService.getRoomsWithPagination({
        request: MockedRequest,
        paginationDto,
        options,
      });

      expect(roomsFound).toBeDefined();
      expect(roomsFound.data).toBeInstanceOf(Array);
      expect(roomsFound.data[0].name).toBe(room.name);
      expect(typeof roomsFound.currentPage).toBe('number');
      expect(typeof roomsFound.itemsPerPage).toBe('number');
      expect(typeof roomsFound.totalItems).toBe('number');
      expect(typeof roomsFound.totalPages).toBe('number');
      expect(roomsFound.selfLink).toBeDefined;
      expect(roomsFound.nextLink).toBeDefined;
      expect(roomsFound.prevLink).toBeDefined;
    });

    it('should find all Rooms', async () => {
      const roomsFound = await roomService.getRooms();

      expect(roomsFound).toBeDefined();
      expect(roomsFound).toBeInstanceOf(Array);
      expect(roomsFound[0].name).toBe(room.name);
    });

    it('should get Rooms With Pagination Simple List', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
      };
      const options = {};
      const roomsFound = await roomService.getRoomsSimpleList({
        request: MockedRequest,
        paginationDto,
        options,
      });

      expect(roomsFound).toBeDefined();
      expect(roomsFound.data).toBeDefined();
      expect(roomsFound.data[0].id).toBeDefined();
      expect(roomsFound.data[0].name).toBeDefined();

      expect(typeof roomsFound.currentPage).toBe('number');
      expect(typeof roomsFound.itemsPerPage).toBe('number');
      expect(typeof roomsFound.totalItems).toBe('number');
      expect(typeof roomsFound.totalPages).toBe('number');
      expect(roomsFound.selfLink).toBeDefined;
      expect(roomsFound.nextLink).toBeDefined;
      expect(roomsFound.prevLink).toBeDefined;
    });

    it('should get Room By Id', async () => {
      const roomFound = await roomService.getRoom({
        id: room.id,
      });

      expect(roomFound).toBeDefined();
      expect(roomFound.id).toBeDefined();
      expect(roomFound.name).toBe(room.name);
    });

    afterAll(async () => {
      await roomRepository.deleteOne({ _id: room._id });
      await userRepository.deleteOne({ _id: mockedUser._id });
    });
  });

  describe('checkUniquenessForName', () => {
    let mockedUser: UserDocument;
    let room: RoomDocument;
    const createRoomRequest: CreateRoomRequest = JSON.parse(
      JSON.stringify(mockedCreateRoomRequest),
    );

    beforeAll(async () => {
      // Add user in test db
      const { user } = await generateMockedUser(userRepository);
      mockedUser = user;

      // Add room in test db
      room = await roomRepository.create({
        ...createRoomRequest,
        createdBy: new Types.ObjectId(user.id),
      });
    });

    it('should check Uniqueness For Name Not Exist', async () => {
      const checkName = await roomService.checkUniquenessForName({
        name: 'fakeName',
      });
      expect(checkName).toBeFalsy();
    });

    it('should check Uniqueness For Name Exist', async () => {
      const checkName = await roomService.checkUniquenessForName({
        name: room.name,
      });
      expect(checkName).toBeTruthy();
    });

    afterAll(async () => {
      await roomRepository.deleteOne({ _id: room._id });
      await userRepository.deleteOne({ _id: mockedUser._id });
    });
  });

  describe('create', () => {
    let mockedUser: UserDocument;
    let roomId: string;

    beforeAll(async () => {
      // Add user in test db
      const { user } = await generateMockedUser(userRepository);
      mockedUser = user;
    });

    it('should create Room', async () => {
      const createRoomRequest: CreateRoomRequest = JSON.parse(
        JSON.stringify(mockedCreateRoomRequest),
      );

      const roomFound = await roomService.create({
        currentUser: mockedUser,
        dto: createRoomRequest,
      });
      expect(roomFound).toBeDefined();
      expect(roomFound).toBeInstanceOf(Object);
      expect(roomFound.id).toBeDefined();
      expect(roomFound.name).toBe(createRoomRequest.name);

      roomId = roomFound.id;
    });

    afterAll(async () => {
      await roomRepository.deleteOne({ _id: roomId });
      await userRepository.deleteOne({ _id: mockedUser._id });
    });
  });

  describe('update', () => {
    let mockedUser: UserDocument;
    let room: RoomDocument;
    const createRoomRequest: CreateRoomRequest = JSON.parse(
      JSON.stringify(mockedCreateRoomRequest),
    );
    const updateRoomRequest: UpdateRoomRequest = JSON.parse(
      JSON.stringify(mockedUpdateRoomRequest),
    );

    beforeAll(async () => {
      // Add user in test db
      const { user } = await generateMockedUser(userRepository);
      mockedUser = user;

      // Add room in test db
      room = await roomRepository.create({
        ...createRoomRequest,
        createdBy: new Types.ObjectId(user.id),
      });
    });

    it('should update room data', async () => {
      const roomFound = await roomService.update({
        id: room.id,
        dto: updateRoomRequest,
        currentUser: mockedUser,
      });

      expect(roomFound).toBeDefined();
      expect(roomFound).toBeInstanceOf(Object);
      expect(roomFound.id).toBe(room.id);
      expect(roomFound.name).toBe(updateRoomRequest.name);
    });

    afterAll(async () => {
      await roomRepository.deleteOne({ _id: room._id });
      await userRepository.deleteOne({ _id: mockedUser._id });
    });
  });

  describe('deleteOne', () => {
    let mockedUser: UserDocument;
    let room: RoomDocument;
    const createRoomRequest: CreateRoomRequest = JSON.parse(
      JSON.stringify(mockedCreateRoomRequest),
    );

    beforeAll(async () => {
      // Add user in test db
      const { user } = await generateMockedUser(userRepository);
      mockedUser = user;

      // Add room in test db
      room = await roomRepository.create({
        ...createRoomRequest,
        createdBy: new Types.ObjectId(user.id),
      });
    });

    it('should delete room by id if exists', async () => {
      const roomFound = await roomService.getRoom({
        id: room.id,
      });
      expect(roomFound).toBeDefined();

      await roomService.deleteOne({ _id: room.id });

      const deletedRoom = await roomService.getRoom({
        id: room.id,
      });
      expect(deletedRoom).toBeNull();
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
