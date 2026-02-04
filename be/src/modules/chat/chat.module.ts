import { Module, forwardRef } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatRepository } from './chat.repository';
import { RoomModule } from '@src/modules/room/room.module';
import { AuthModule } from '@src/modules/auth/auth.module';
import { CurseWordModule } from '@src/modules/curse-word/curse-word.module';
import { RedisModule } from '@src/providers/redis/redis.module';

@Module({
  imports: [forwardRef(() => RoomModule), AuthModule, CurseWordModule, RedisModule],
  providers: [ChatService, ChatGateway, ChatRepository],
  exports: [ChatService],
})
export class ChatModule {}
