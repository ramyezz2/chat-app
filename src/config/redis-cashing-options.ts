import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import environment from './environment';

export const RedisOptions: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [],
  useFactory: async () => {
    const store = await redisStore({
      socket: {
        host: environment.redisHost,
        port: parseInt(environment.redisPort),
      },
    });
    return {
      store: () => store,
    };
  },
  inject: [],
};
