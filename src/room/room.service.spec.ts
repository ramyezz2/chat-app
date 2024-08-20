import {
  getConnectionToken,
  getModelToken,
  MongooseModule,
} from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Model } from 'mongoose';

import {
  closeMongoConnection,
  DbModule,
} from '../shared/helpers/db-test-module';
import { UserDocument, UserSchema } from '../user/user.schema';
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
        DbModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
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

  afterAll(async () => {
    await connection.close(true);
    await closeMongoConnection();
  });
});
