import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RedisIoAdapter } from './providers/redis/redis-io.adapter';
import { REDIS_CLIENT } from './providers/redis/redis.provider';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.getHttpAdapter().getInstance().set('trust proxy', true);

  const corsOrigins = [process.env.FRONTEND_URL_HTTP, process.env.FRONTEND_URL_HTTPS].filter(Boolean) as string[];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // 상태 체크 엔드포인트
  app.getHttpAdapter().get('/health', (_, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // cookie-parser 미들웨어 등록
  app.use(cookieParser());

  // 전역 파이프 설정 (DTO 유효성 검사)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 전역 Interceptor는 AppModule의 APP_INTERCEPTOR provider로 등록됨

  // Redis WebSocket 어댑터 연결 (공유 Redis 클라이언트 사용)
  const redisClient = app.get(REDIS_CLIENT);
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(redisClient);
  app.useWebSocketAdapter(redisIoAdapter);

  // 전역 접두사 설정
  app.setGlobalPrefix('api');

  // 서버 포트 실행
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Server is running on: http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
