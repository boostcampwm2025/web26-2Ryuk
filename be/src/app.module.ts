import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppGateway } from './app.gateway';
import databaseConfig from './providers/database/database.config';
import { ChatModule } from './modules/chat/chat.module';
import { RoomModule } from './modules/room/room.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './providers/redis/redis.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
// Entities
import { User } from './modules/user/user.entity';
import { ChattingReport } from './modules/report/chatting-report.entity';
import { Post } from './modules/post/post.entity';
import { PostPicture } from './modules/post/post-picture.entity';
import { PostLike } from './modules/post/post-like.entity';
import { ChattingLog } from './modules/log/chatting-log.entity';
import { Game } from './modules/game/game.entity';
import { GameRecord } from './modules/game/game-record.entity';
import { Comment } from './modules/comment/comment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      ...databaseConfig,
      entities: [User, ChattingReport, Post, PostPicture, PostLike, ChattingLog, Game, GameRecord, Comment],
      // 개발 환경에서는 마이그레이션 자동 실행 비활성화 (CLI로 별도 실행)
      migrationsRun: false,
      migrations: [],
    }),
    RedisModule,
    ChatModule,
    RoomModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppGateway,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
