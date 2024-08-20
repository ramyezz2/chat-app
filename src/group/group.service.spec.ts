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
import { GroupDocument, GroupSchema } from './group.schema';
import { GroupService } from './group.service';

describe('GroupService', () => {
  let connection: Connection;
  let groupService: GroupService;
  let userRepository: Model<UserDocument>;
  let groupRepository: Model<GroupDocument>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DbModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          { name: GroupDocument.name, schema: GroupSchema },
          { name: UserDocument.name, schema: UserSchema },
        ]),
      ],
      providers: [GroupService],
    }).compile();

    connection = await module.get(getConnectionToken());

    // Models registration
    userRepository = module.get(getModelToken(UserDocument.name));
    groupRepository = module.get(getModelToken(GroupDocument.name));

    groupService = module.get<GroupService>(GroupService);
  });

  it('should be defined', () => {
    expect(groupService).toBeDefined();
  });

  afterAll(async () => {
    await connection.close(true);
    await closeMongoConnection();
  });
});
