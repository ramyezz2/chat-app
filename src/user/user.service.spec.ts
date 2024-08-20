import {
  MongooseModule,
  getConnectionToken,
  getModelToken,
} from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Connection, Model } from 'mongoose';
import {
  DbModule,
  closeMongoConnection,
} from 'src/shared/helpers/db-test-module';
import { UserDocument, UserSchema } from './user.schema';
import { UserService } from './user.service';
describe('UserService', () => {
  let connection: Connection;
  let userService: UserService;
  // let storageService: StorageService;
  let userRepository: Model<UserDocument>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        DbModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          { name: UserDocument.name, schema: UserSchema },
        ]),
      ],
      providers: [UserService],
    }).compile();

    connection = await module.get(getConnectionToken());

    userRepository = module.get(getModelToken(UserDocument.name));
    userService = module.get<UserService>(UserService);
    // storageService = module.get<StorageService>(StorageService);
  });

  it.only('should be defined', () => {
    expect(userService).toBeDefined();
  });

  afterAll(async () => {
    await connection.close(true);
    await closeMongoConnection();
  });
});
