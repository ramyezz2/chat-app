import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import environment from '../../config/environment';
// import { MongoMemoryServer } from 'mongoDb-memory-server';

// let mongoD: MongoMemoryServer;

export const DbModule = (customOpts: MongooseModuleOptions = {}) =>
  MongooseModule.forRootAsync({
    useFactory: async () => {
      // mongoD = new MongoMemoryServer();
      // const uri = await mongoD.getUri();
      return {
        ...customOpts,
        uri: environment.databaseUrl,
      };
    },
  });

export const closeMongoConnection = async () => {
  // if (mongoD) await mongoD.stop();
};
