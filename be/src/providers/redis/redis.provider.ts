import { Logger, Provider } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: async (): Promise<RedisClientType> => {
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT;

    if (!host || !port) throw new Error('REDIS_HOST와 REDIS_PORT 환경 변수가 설정되지 않았습니다.');

    const url = `redis://${host}:${port}`;
    Logger.log(`Redis 연결 시도: ${url}`);

    const client = createClient({ url }) as RedisClientType;

    client.on('error', (err) => Logger.error('Redis 연결 에러:', err));
    client.on('connect', () => Logger.log('Redis 연결 성공'));

    await client.connect();
    return client;
  },
};
